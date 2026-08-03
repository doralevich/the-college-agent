# Security & Hardening Playbook

**Purpose:** Reproduce, on a new app (e.g. Apollo Claw's build), the exact security posture and
hardening pass shipped on The College Agent (thecollegeagent.ai). Hand this file to Claude Code and
say: *"Harden this repo against this playbook. Work item by item. For each, tell me: already done /
implemented now / needs a decision from me. Verify against the LIVE database and the built client
bundle, not just the source."*

**Stack this assumes** (adapt if yours differs): Next.js (App Router) on Vercel · Supabase
(Postgres + Auth + Storage, RLS) · Stripe · an agent runtime (Agent37/Hermes) · email (Mailchimp +
a transactional sender). The *patterns* below are portable even if a layer is swapped.

---

## 0. Golden rules (apply to every item)

1. **Secrets are server-only.** Any key that grants spend or data access is read only in a module
   that starts with `import "server-only";` and is **never** prefixed `NEXT_PUBLIC_` (that prefix is
   the only thing Next.js inlines into client JS). Verify by grepping the **built** output
   (`.next/static`) for the key name — expect zero matches.
2. **Verify against reality, not the repo.** RLS especially: audit the **live** database
   (`pg_policies`, table RLS flags, the security advisor), because policies are often applied
   out-of-band and the migrations drift from what's actually enforced.
3. **Migration-safe rollout.** Every change must be a no-op until its env var / migration is live, so
   you can ship code first and flip it on during the normal deploy without a regression window.
4. **Fail open on availability primitives, fail closed on authz.** The rate limiter must allow
   traffic if its datastore is unreachable; auth checks must deny by default.
5. **One source of truth for privilege.** The admin allowlist lives in app code only — no DB/env
   mirror to drift.

---

## 1. Secrets / env vars (server-side only; none `NEXT_PUBLIC_`)

| Var | Purpose |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | RLS-bypassing admin DB client (server only) |
| `<RUNTIME>_API_KEY` (e.g. `AGENT37_API_KEY`) | Agent runtime; spend-granting |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Payments + webhook signature verification |
| `CRON_SECRET` | Bearer token gating cron routes |
| `BYO_ENC_KEY` | AES-256-GCM key for encrypting user-supplied secrets at rest (see Item 2) |
| `MAILCHIMP_API_KEY` / transactional key | Marketing / transactional email |
| any ad/analytics server token (e.g. `META_CAPI_ACCESS_TOKEN`) | Server-side conversions; secret, dormant until set |

Rule: a missing secret throws a **static** string ("X is not set on the server") — never interpolate
the value into logs or error messages.

---

## 2. The auth spine — build this first (everything else leans on it)

Centralize auth in one module (`lib/auth.ts`) + an admin helper (`lib/admin.ts`) + the allowlist
(`config/admins.ts`). Wrap every route in a small `route()`/`ApiError` helper so failures return
typed JSON, not stack traces.

**Admin allowlist — `config/admins.ts`:**
```ts
import "server-only";
const RAW_ADMIN_EMAILS = ["you@company.com", "cofounder@company.com"];
export const ADMIN_EMAILS: readonly string[] = RAW_ADMIN_EMAILS.map((e) => e.trim().toLowerCase());
export function isAdminEmail(email?: string | null): boolean {
  return !!email && ADMIN_EMAILS.includes(email.trim().toLowerCase());
}
```

**Enforced admin second factor (AAL2) — `lib/auth.ts`:**
```ts
export async function assertStepUp(db: DB): Promise<void> {
  const { data, error } = await db.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) throw new ApiError(500, "mfa_error", error.message);
  if (data?.currentLevel !== "aal2") {
    throw new ApiError(403, "mfa_required", "Two-factor step-up required for admin access.");
  }
}
```

**Admin route preamble — `lib/admin.ts`:**
```ts
export async function requirePlatformAdmin() {
  const { supabase, user } = await requireUser();
  if (!isAdminEmail(user.email)) throw new ApiError(403, "forbidden", "Admin access required");
  await assertStepUp(supabase);           // admins must be at aal2
  return { supabase, user };
}
```

**Entitlement gate (paid/allowed) — apply to EVERY spend-increasing action, not just "create":**
```ts
export async function requireEntitled(db: DB): Promise<void> {
  const { data: allowed, error } = await db.rpc("can_create_agent"); // SECURITY DEFINER, checks JWT email vs entitlements
  if (error) throw new ApiError(500, "db_error", error.message);
  if (!allowed) throw new ApiError(403, "forbidden", "Your account isn't approved for this yet.");
}
```

**Per-resource access — `requireAgentAccess` — MEMBER-FIRST (learn from our bug):**
> ⚠️ **Hard-won lesson.** The first version routed *every admin-email caller* straight into the
> cross-tenant "god-view" path, which calls `assertStepUp()`. Result: an admin who is also a normal
> paying user got *"Two-factor step-up required for admin access"* when using **their own** resource.
> Fix: **check workspace membership FIRST**; only require step-up for genuine cross-tenant access.
```ts
export async function requireAgentAccess(agent37Id: string, level: "member" | "admin") {
  const { supabase, user } = await requireUser();

  // Member-first: RLS-scoped read returns a row ONLY for a workspace the caller belongs to.
  // A normal user — OR an admin on their OWN resource — lands here. No step-up.
  const { data: ownRow } = await supabase
    .from("agents").select("*").eq("agent37_id", agent37Id).maybeSingle();
  if (ownRow) {
    const row = ownRow as AgentRow;
    if (level === "admin") await requireAdmin(supabase, row.workspace_id, user.id);
    else await requireMember(supabase, row.workspace_id, user.id);
    return { supabase, user, row, isPlatformAdmin: false as const };
  }

  // Not a member → cross-tenant god-view: admins only, and it REQUIRES step-up (aal2).
  if (isAdminEmail(user.email)) {
    await assertStepUp(supabase);
    const row = await getAgentRow(createAdminClient(), agent37Id); // service-role read (RLS hides other tenants)
    return { supabase, user, row, isPlatformAdmin: true as const };
  }
  throw new ApiError(404, "not_found", "Agent not found"); // don't leak existence
}
```
`isPlatformAdmin` is therefore `true` **only** for genuine cross-tenant access; downstream handlers
use it to relax user-scoped gates (e.g. skip `requireEntitled` when an operator acts on a user's
resource). MFA step-up gates the **operator surface**, never a person using the thing they paid for.

---

## 3. The 10-item hardening pass

For each: **Goal · Threat · Implement · Verify.**

### Item 1 — Platform API-key exposure audit
- **Goal:** the runtime/spend key never reaches the browser or git history.
- **Implement:** read it in exactly one `server-only` module; never `NEXT_PUBLIC_`; never logged.
- **Verify:** grep built client chunks (`.next/static`) and full git history for the key name /
  `sk-ant-` / `sk-` → only UI placeholder strings allowed, zero real values.

### Item 2 — Encrypt user-supplied (BYO) secrets at rest
- **Goal:** user-provided API keys / tokens are useless in a DB dump.
- **Threat:** plaintext third-party keys in a table = mass credential theft if the DB leaks.
- **Implement:** application-side **AES-256-GCM**, key derived from `BYO_ENC_KEY` (Vercel env, never
  in Postgres). In-place `v1:` envelope in the existing column — no schema migration, no plaintext
  null-out. Migration-safe: no-ops to plaintext until the env var is set, then backfill.
```ts
import "server-only";
import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";
const PREFIX = "v1:";
const key = () => {
  const raw = process.env.BYO_ENC_KEY; if (!raw) throw new Error("BYO_ENC_KEY is not set");
  return createHash("sha256").update(raw, "utf8").digest(); // any-length secret → stable 32 bytes
};
export const byoEncConfigured = () => !!process.env.BYO_ENC_KEY;
export const isEncrypted = (v?: string | null) => typeof v === "string" && v.startsWith(PREFIX);
export function encryptSecret(pt?: string | null): string | null {
  const s = (pt ?? "").trim(); if (!s) return null;
  const iv = randomBytes(12); const c = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([c.update(s, "utf8"), c.final()]);
  return `${PREFIX}${iv.toString("base64")}:${c.getAuthTag().toString("base64")}:${ct.toString("base64")}`;
}
export function encryptForStorage(pt?: string | null): string | null { // migration-safe write
  const s = (pt ?? "").trim(); if (!s) return null;
  if (!byoEncConfigured()) { console.warn("[byo] BYO_ENC_KEY not set — storing plaintext"); return s; }
  return encryptSecret(s);
}
export function decryptSecret(stored?: string | null): string | null { // reads legacy plaintext too
  if (!stored) return null; if (!isEncrypted(stored)) return stored;
  const [iv, tag, ct] = stored.slice(PREFIX.length).split(":");
  const d = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"));
  d.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([d.update(Buffer.from(ct, "base64")), d.final()]).toString("utf8");
}
```
- Wrap every **write** path with `encryptForStorage()`, the single raw-key **read** with
  `decryptSecret()`. Presence-only checks need no decrypt (ciphertext is still truthy).
- **Verify:** write a key, confirm the column starts with `v1:`; confirm it's never returned to the
  browser (only booleans / redacted views).

### Item 3 — RLS audit across EVERY table (the highest-value item)
- **Goal:** every table is provably isolated per user, or provably server-only.
- **Threat (the real bug we found live):** a policy named `service_role_all_*` defined
  `FOR ALL TO public USING (true)`. `TO public` includes **anon** + **authenticated** — i.e. the anon
  key that ships in the browser. Combined with the default SELECT grant, **any holder of the anon key
  could read every row** (Telegram tokens, BYO API keys, names, emails, phones, resume URLs). This
  was a live exposure fixed by dropping the policies (leaving RLS-on / no-policy = server-only).
- **Implement:** every table lands in one of two states:
  - **Scoped policies** — user reaches only their rows (`auth.uid() = user_id`, or workspace
    membership via a `is_workspace_member/admin(workspace_id)` SECURITY DEFINER helper).
  - **RLS-on, no policy** — provably server-only (anon/authenticated get nothing; service role
    bypasses). Use for tables only the server ever touches (leads, webhook events, rate_limits, …).
- **Verify (against the LIVE db):** enumerate `pg_policies`, table RLS flags, and the security
  advisor. Produce a per-table verdict table. Watch for: `TO public USING(true)`, RLS-disabled
  tables, and SECURITY DEFINER functions callable by anon/authenticated (`REVOKE EXECUTE ... FROM
  anon, authenticated` on internal helpers). Enable Supabase **leaked-password protection** (Auth →
  Password security) while you're there.

### Item 4 — Admin route + API authentication
- **Goal:** no admin capability without admin identity + step-up.
- **Implement:** **every** `/api/admin/*` route calls `requirePlatformAdmin()` (Item 2 spine) before
  any work. The `/admin` **UI** is gated in its layout: logged-out → redirect to login; logged-in
  non-admin → hard `notFound()` (the god-view never even hints it exists).
- **Verify:** hit an admin route as a normal user (403) and logged-out (401/redirect); load `/admin`
  as a non-admin (404).

### Item 5 — CRON_SECRET on cron routes
- **Goal:** no unauthenticated cron path.
- **Implement:** each cron route requires `Authorization: Bearer <CRON_SECRET>`; missing secret → 503,
  wrong/absent header → 401, **before** any work. Wire the secret into the Vercel cron config.

### Item 6 — Stripe webhook: signature verification + idempotency
- **Implement:** verify the raw body with
  `stripe.webhooks.constructEvent(raw, sig, STRIPE_WEBHOOK_SECRET)` (reject bad sig before
  processing). Insert `event.id` into a `stripe_events` table **up front**; a duplicate insert
  (Stripe retries) → skip. If processing throws, **delete** the row so a genuine retry can reprocess
  — never silently lose or double-apply. (Read the raw body — disable body parsing for this route.)

### Item 7 — Rate limiting on public (unauthenticated) POST endpoints
- **Goal:** throttle abuse of endpoints that spend money or write data, across serverless instances.
- **Implement:** an atomic Postgres fixed-window counter keyed by `endpoint:ip`. **Fails open.**
```sql
create table if not exists public.rate_limits (
  bucket text not null, window_start timestamptz not null, count integer not null default 0,
  primary key (bucket, window_start));
alter table public.rate_limits enable row level security;   -- server-only (no policy)
create or replace function public.rate_limit_hit(p_bucket text, p_max integer, p_window_seconds integer)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_window timestamptz; v_count integer;
begin
  v_window := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  insert into public.rate_limits (bucket, window_start, count) values (p_bucket, v_window, 1)
  on conflict (bucket, window_start) do update set count = public.rate_limits.count + 1
  returning count into v_count;
  return v_count <= p_max;
end $$;
revoke all on function public.rate_limit_hit(text, integer, integer) from public, anon, authenticated;
```
```ts
export async function limit(req, endpoint, { max, windowSeconds }) {
  const ip = clientIp(req);                       // first x-forwarded-for entry; "unknown" buckets together
  try {
    const { data, error } = await createAdminClient().rpc("rate_limit_hit",
      { p_bucket: `${endpoint}:${ip}`, p_max: max, p_window_seconds: windowSeconds });
    if (error) { console.error("[rate-limit]", error.message); return true; } // fail open
    return data === true;
  } catch { return true; }                         // fail open
}
```
- Apply to the whole public POST surface (checkout, intake/onboard, setup, newsletter, contact,
  lead-capture, any public chat/demo that spends the platform key, public applications). Typical caps
  5–15 / 60s per IP. Blocked → HTTP 429.

### Item 8 — Security headers + Content-Security-Policy
- **Implement (`next.config.ts`):** always-on headers immediately; **CSP report-only first.**
```ts
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Content-Security-Policy-Report-Only", value: cspReportOnly }, // allow-list your real 3rd parties
];
// async headers() { return [{ source: "/:path*", headers: securityHeaders }]; }
```
- CSP allow-lists your real origins (Supabase https+wss, payment/embed widgets, fonts, analytics).
  Ship **report-only**, watch a preview deploy for violations, THEN promote to enforced
  `Content-Security-Policy`. Tightening `script-src` off `'unsafe-inline'/'unsafe-eval'` is a
  follow-up if the app relies on inline/styled-jsx.

### Item 9 — GitHub repository security
- **Enable (repo-admin toggles, not code):** Dependabot alerts + security updates; secret scanning +
  push protection.
- **Branch protection on `main`:** a **decision**, not automatic. If bots/automation push directly to
  `main` (content, deploy fallbacks), requiring PR review breaks them — record the decision and revisit
  once those move onto a PR path. Don't silently break your own deploy flow.

### Item 10 — Data deletion capability + runbook (FERPA/GDPR)
- **Implement:** `DELETE /api/admin/users/[id]` (platform-admin only) → a `purgeUserAccount()` that
  requires the caller to **echo the target email** in the body (`{ "confirm": "<email>" }`) so a
  fat-fingered id can't wipe the wrong account. Returns an auditable report. Order:
  1. **External runtime instances first** (tear down billed boxes so a later DB failure can't orphan one).
  2. **Storage** (uploaded files).
  3. **User-scoped DB rows, children before parents** (sessions → agents → memberships → intake/setup →
     credits/orders → entitlements by email → workspaces).
  4. **Marketing** (permanent erase from Mailchimp).
  5. **Auth user** last.
  - **Retain Stripe** as the financial system-of-record (tax/chargeback); redact manually only on request.
- Best-effort per step (report failures, never strand a half-deleted account). Write the **runbook**
  (identity check → find id → call endpoint → review report.errors → manual Stripe step → log it).

---

## 4. Enforced in-app admin MFA (TOTP step-up to AAL2)
- Use Supabase native MFA (`auth.mfa.enroll / challenge / verify / getAuthenticatorAssuranceLevel`).
- Enforcement is already wired by `assertStepUp` (called in `requirePlatformAdmin` and the
  cross-tenant branch of `requireAgentAccess`). No migration needed.
- **UI:** an `AdminMfaGate` in the `/admin` layout — if `currentLevel !== "aal2"`, walk the admin
  through enroll (first time) / challenge (returning) before rendering the console. The enroll/verify
  calls go straight to Supabase Auth (not through your admin routes), so it can't deadlock.
- Also require MFA on the **infrastructure** accounts themselves: Supabase, Vercel, GitHub, Stripe,
  email.

## 5. Audit logging (evidence trail for FERPA / SOC 2)
```ts
export async function logAudit(entry: { actorEmail?; action: string; target?; metadata?; req? }) {
  try {
    await createAdminClient().from("audit_log").insert({
      actor_email: entry.actorEmail ?? null, action: entry.action, target: entry.target ?? null,
      metadata: entry.metadata ?? null, ip: ipFrom(entry.req),
    });
  } catch (e) { console.warn("[audit]", (e as Error).message); } // never breaks the action
}
```
`audit_log` is server-only (RLS on, no policy). Call it from every sensitive admin action (account
deletion, intake edits, approvals/suspensions, workspace deletion).

## 6. Consent / cookie banner (GDPR/CCPA)
Load analytics/ad pixels **only after** the visitor accepts (opt-in). One component gates the Meta
Pixel + Google Analytics. Switchable to opt-out if you want broader pixel coverage.

## 7. Point-in-time recovery
Enable Supabase **PITR** backups (dashboard toggle). Cheap, and every enterprise reviewer asks.

---

## 8. Activation / deploy checklist (order matters)
1. Set `BYO_ENC_KEY` in Vercel (all envs) — `openssl rand -base64 48`. (Code no-ops to plaintext until set.)
2. Apply the **RLS fix migration** first (it closes any live exposure). Idempotent.
3. Apply the **rate_limits migration** (limiter fails open until then — no breakage, no enforcement).
4. Run the **BYO backfill** once from a trusted shell (dry-run first) to encrypt existing plaintext keys.
5. **CSP:** ship report-only; watch a preview deploy; then promote to enforced.
6. Flip on Dependabot / secret scanning / push protection in GitHub.
7. Enable Supabase PITR + leaked-password protection.

---

## 9. Compliance document set to generate (reviewers ask for these)
Mirror the College Agent's `compliance/` package, retargeted to Apollo Claw:
- `SECURITY_NOTES.md` — the per-item posture record (this pass, kept current).
- `security-overview.md` — one-pager for buyers.
- `HECVAT-responses.md` — the higher-ed vendor questionnaire answers.
- `vendor-security-packet.md` — the "send this to procurement" bundle.
- `incident-response-plan.md` + `information-security-policy.md` + `data-retention-and-deletion-policy.md`.
- `data-processing-agreement-TEMPLATE.md` (FERPA/GDPR DPA — **have a privacy attorney review before signing**).
- `security-next-steps.md` — living roadmap (what's done / do-soon / needed-when-a-school-asks).

**Runtime-layer honesty:** if you resell an agent runtime on its *standard* plan, state plainly that
there's no custom DPA/SLA/breach-window at that layer, point to its Trust Center, and note a SOC 2
Type 1 is available on request. Don't promise contractual flow-down you can't back — price an
enterprise agreement in first.

---

## 10. Final acceptance checklist
- [ ] Every spend/data secret is `server-only`, never `NEXT_PUBLIC_`, absent from built bundle + git history.
- [ ] BYO/user secrets encrypted at rest (`v1:` envelope); key only in Vercel.
- [ ] Every table: scoped-policy OR RLS-on-no-policy, **verified live**; no `TO public USING(true)`.
- [ ] Every `/api/admin/*` calls `requirePlatformAdmin()`; `/admin` UI hard-`notFound()`s non-admins.
- [ ] Admin actions require **AAL2** step-up; `requireAgentAccess` is **member-first** (own resource ≠ god-view).
- [ ] Cron routes require `CRON_SECRET`.
- [ ] Stripe webhook: signature-verified + idempotent (event-id table, delete-on-throw).
- [ ] Public POST surface rate-limited (fails open).
- [ ] Security headers on every route; CSP at least report-only.
- [ ] Dependabot + secret scanning on; branch-protection decision recorded.
- [ ] Data-deletion endpoint + runbook; audit logging on sensitive actions.
- [ ] PITR + leaked-password protection on; infra accounts on MFA.
- [ ] Compliance doc set generated and retargeted.

## 11. Known accepted risks / gotchas to expect
- **`postcss` transitive advisory inside Next.js** — build-time only, not runtime-exploitable; the
  "fix" downgrades Next.js. Accept + monitor; resolves on a Next.js upgrade.
- **CSP `'unsafe-inline'/'unsafe-eval'`** may be required initially by inline/styled-jsx; tighten later.
- **Rate limiter fails open** by design — availability > enforcement for a signup form.
- **`requireAgentAccess` must be member-first** — see the ⚠️ in §2; the naïve admin-first version
  locks admins out of their own resources with a spurious 2FA error.
- **Migrations drift from the live DB** — always reconcile RLS against the running database.

---

## Scope note (what this playbook does NOT cover)
- **SOC 2 Type II, third-party penetration test, cyber-liability insurance, VPAT/WCAG** — these are
  money/time/independent-auditor items, not code. Track them in `security-next-steps.md`.
- **LLM prompt-injection hardening** and OAuth app verification — separate workstreams.
- **UI / dashboard replication** — the College Agent's dashboard shell (sidebar tabs, chat, intake
  wizard, settings hub, credits/billing) is a *separate* port from this security pass. If you want it,
  ask for a companion "Dashboard/UX architecture brief" and I'll produce it the same way.
