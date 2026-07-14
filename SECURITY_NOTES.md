# Security Notes — The College Agent

Prepared for the university IT security review (HECVAT). This document records the security
posture of the application and the hardening pass completed in July 2026. It is the companion
to the ticket "Security Hardening Pass, The College Agent" and is kept current as the codebase
changes.

- **App:** thecollegeagent.ai (Next.js App Router, deployed on Vercel)
- **Data:** Supabase (Postgres, Auth, Storage), project `phanccynmhblrzhvqdfz` ("the-college-agent")
- **Payments:** Stripe · **Agent runtime:** Agent37 / Hermes · **Email:** Mailchimp (marketing), Mandrill (transactional)
- **Last hardening pass:** 2026-07-14

**In scope:** the ten items below.
**Explicitly out of scope for this pass:** SOC 2 certification, third-party penetration testing,
LLM prompt-injection hardening, and Google OAuth app verification.

---

## Deployment / activation checklist

Several changes ship as code but only take effect once deployed and configured. **The critical RLS
fix (step 2) was applied to production on 2026-07-14 with the owner's authorization; the remaining
steps await the normal deploy.** Apply in this order:

1. **Set env var `BYO_ENC_KEY`** (Vercel, all environments) — a long random secret (e.g.
   `openssl rand -base64 48`). Enables encryption-at-rest for student-supplied model keys.
   Until it is set, the code stores those keys as plaintext exactly as before (no regression).
2. **Apply migration `0021_fix_setup_onboard_rls.sql`** — ✅ **APPLIED to production 2026-07-14.**
   Closed the live data exposure (see Item 3). Verified post-apply: both tables show RLS enabled
   with zero policies. The migration file remains in the repo/PR for consistency; it is idempotent
   (`enable row level security` + `drop policy if exists`), so re-running it on the normal deploy is
   a safe no-op.
3. **Apply migration `0020_rate_limits.sql`** — creates the `rate_limits` table + `rate_limit_hit`
   function. Until applied, rate limiting fails **open** (allows traffic), so nothing breaks, but
   no limit is enforced.
4. **Run the BYO backfill** — after step 1, once, from a trusted shell with the service-role key
   and `BYO_ENC_KEY` in the environment:
   `node scripts/backfill-byo-encryption.mjs --dry-run` then without `--dry-run`. Encrypts the
   handful of existing plaintext keys. Idempotent and safe to re-run.
5. **CSP:** currently report-only. Promote to enforced only after watching the browser console /
   report stream on a preview deploy for violations (see Item 8).

Env vars this app relies on for security (all server-side, none `NEXT_PUBLIC_`):
`AGENT37_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
`CRON_SECRET`, `MAILCHIMP_API_KEY`, `MANDRILL_API_KEY`, `META_CAPI_ACCESS_TOKEN`, and (new)
`BYO_ENC_KEY`.

`META_CAPI_ACCESS_TOKEN` is the Meta Conversions API access token (from Meta Events Manager).
It is a **secret** and must be set in Vercel only — never `NEXT_PUBLIC_`, never committed (verified
absent from the repo and git history). The server-side Purchase event in `lib/meta-capi.ts` (fired
from the Stripe webhook) stays **dormant until this var is set**, and the var name must match
exactly or CAPI stays off. The public Meta **Pixel ID** (`NEXT_PUBLIC_META_PIXEL_ID`) is a public
identifier, not a secret — do not confuse the two.

---

## Item 1 — AGENT37_API_KEY exposure audit — ✅ PASS

The platform Agent37 key is server-only and never leaves the server.

- Read in exactly one module, `lib/agent37.ts`, which begins with `import "server-only"` (a build
  error if it is ever imported into a client bundle). Referenced only as `process.env.AGENT37_API_KEY`.
- **Never** prefixed `NEXT_PUBLIC_` (verified by search), so it cannot be inlined into client JS.
- Not logged and not placed in error messages: a missing key throws the static string
  "AGENT37_API_KEY is not set on the server" — the value itself is never interpolated.
- **Built client output checked:** grepping the compiled client chunks (`.next/static`) for
  `AGENT37_API_KEY` and `AGENT37_API_BASE` returns zero matches — the key is not inlined into
  any bundle that reaches the browser. (Structurally guaranteed too: it is read only in a
  `server-only` module and is never `NEXT_PUBLIC_`, the only prefix Next.js inlines client-side.)
- **Git history:** no literal Agent37/Anthropic/OpenAI key has ever been committed. The only
  `sk-ant-` matches in history are UI placeholder text ("Starts with sk-ant-…") on the setup form.

The only file that references the key is `lib/agent37.ts`. No change required.

---

## Item 2 — Encrypt stored BYO API keys at rest — ✅ IMPLEMENTED (activate per checklist)

Students may bring their own Anthropic/OpenAI key. These were stored as plaintext in
`setup_submissions.anthropic_key` / `.openai_key`. They are now encrypted at rest.

> **Approach — decided 2026-07-14: keep application-side AES-256-GCM.** The ticket named Supabase
> Vault (or pgcrypto) as preferred, with a separate-encrypted-columns migration. We deliberately use
> **application-side AES-256-GCM, in place** (a `v1:` envelope in the existing columns) instead.
> Rationale: the encryption key lives only in the Vercel env (`BYO_ENC_KEY`), never in Postgres — so a
> database dump alone is useless — and in-place encryption avoids a schema migration and a
> plaintext-column null-out step. HECVAT answer: *"student-supplied API keys are encrypted at rest
> with AES-256-GCM; the encryption key is held outside the database in the platform's secret store."*
> (If a reviewer specifically requires the literal "Supabase Vault" mechanism, it can be switched
> later without changing the end state.)

- **Scheme:** AES-256-GCM, application-side (`lib/crypto/byo.ts`). The key is derived
  (SHA-256) from the `BYO_ENC_KEY` environment variable, which lives only in Vercel — never in
  the database or the repo. A database dump alone therefore cannot reveal the plaintext.
- **Stored format:** `v1:<iv>:<authTag>:<ciphertext>` (all base64). The `v1:` prefix lets reads
  transparently handle both new ciphertext and any legacy plaintext during the migration window.
- **Write paths wrapped with `encryptForStorage()`:** `app/api/setup-submit`,
  `app/api/billing/byo`, and the admin intake `PUT` (`app/api/admin/workspaces/[id]/intake`).
- **Read path wrapped with `decryptSecret()`:** `lib/provisioning.ts` (the only place the raw key
  is needed — it is written into the agent's runtime env). The admin intake `GET` decrypts so an
  admin still sees the real key (platform-admin only, by design). Presence-only checks
  (`billing/credits`, `cron`, dashboard count) need no decryption — ciphertext is still truthy.
- **Migration-safe:** `encryptForStorage()` no-ops to plaintext (with a warning) until
  `BYO_ENC_KEY` is set, so the code shipped before the env var will not break. After the var is
  set, `scripts/backfill-byo-encryption.mjs` encrypts existing rows (idempotent; never nulls a
  key it cannot encrypt).
- Keys were already **never** returned to the browser (only booleans / redacted views), so there
  was no client-side exposure — this closes exposure to anyone with raw DB access.

---

## Item 3 — RLS audit across every table — ✅ PASS after a CRITICAL fix

Audited against the **live database** (via the Supabase API — `pg_policies`, table RLS flags,
and the security advisor), not just the migration files, per the ticket. Every one of the 24
tables in `public` has RLS enabled. Each is now in one of two acceptable states: **RLS-on with
scoped policies** (students reach only their own rows) or **RLS-on with no policy** (provably
server-only; the anon/authenticated keys get nothing, the service role bypasses).

### 🔴 CRITICAL finding — FIXED (migration `0021_fix_setup_onboard_rls.sql`)

`setup_submissions` and `onboard_submissions` had RLS **enabled** but carried a policy named
`service_role_all_setup` / `service_role_all_onboard` defined `FOR ALL TO public USING (true)`.
The name implied "service role only," but `TO public` covers the **anon** and **authenticated**
roles — including the anon key that ships in the browser bundle. Combined with the default SELECT
grant on public tables, **any holder of the anon key could read every row**:

- `setup_submissions` → every student's Telegram bot token and BYO Anthropic/OpenAI API keys
- `onboard_submissions` → every student's name, school & personal email, phone, and resume URL

This was a live exposure. The fix drops both policies (leaving RLS-on-no-policy, matching the
server-only access pattern these tables actually use) and re-asserts `enable row level security`
idempotently. **This migration was applied to production on 2026-07-14 (owner-authorized), ahead of
everything else; verified afterward — both tables show RLS enabled with zero policies, so the public
key can no longer read them.** Note: encrypting the BYO keys (Item 2) reduces the blast radius of the
key columns, but the RLS fix is what actually closes the read; both are needed.

### Secondary finding — repo ↔ database drift

The live database's RLS configuration is **not fully captured in the repo migrations** — only
`0019` enables RLS in version control, yet the live DB has RLS + policies on nearly every table
(they were applied out-of-band). `0021` narrows this gap for the two affected tables. Recommend a
follow-up reconciliation migration that captures the current live policy set so the schema is
reproducible from migrations alone. Tracked as a hardening backlog item.

### Per-table verdict

| Table | RLS | Verdict |
|---|---|---|
| setup_submissions | on | **FIXED** — was `TO public USING(true)`; now no-policy (server-only) |
| onboard_submissions | on | **FIXED** — was `TO public USING(true)`; now no-policy (server-only) |
| workspaces | on | Scoped — member/owner only |
| memberships | on | Scoped — workspace member/admin |
| agents | on | Scoped — workspace member (read) / admin (write) |
| chat_sessions | on | Scoped — workspace member |
| checklist_items | on | Scoped — self (`auth.uid() = user_id`) |
| entitlements | on | Scoped — self (email = JWT email) |
| orders | on | Scoped — self (user_id or email) |
| wallet_transactions | on | Scoped — self |
| referral_codes | on | Scoped — self |
| referrals | on | Scoped — self (referrer) |
| invitations | on | Scoped — workspace admin |
| leads | on | Server-only (no policy) — set by `0019` |
| configurations | on | Server-only (no policy) — set by `0019` |
| newsletter_signups | on | Server-only (no policy) |
| stripe_events | on | Server-only (no policy) |
| demo_leads | on | Server-only (no policy) |
| demo_sessions | on | Server-only (no policy) |
| orgs | on | Server-only (no policy) |
| ambassadors | on | Server-only (no policy) |
| ambassador_sales | on | Server-only (no policy) |
| ambassador_payouts | on | Server-only (no policy) |
| ambassador_ledger_adjustments | on | Server-only (no policy) |
| rate_limits (`0020`, pending deploy) | on | Server-only (no policy); function EXECUTE revoked from public/anon/authenticated |

### Additional advisor notes (lower priority, for David's awareness)

- **SECURITY DEFINER functions callable by anon/authenticated:** `accept_invitation`,
  `get_invitation`, `can_create_agent` are intentionally callable (the invite / provisioning
  flows). `handle_new_workspace` (a trigger fn), `set_agent_status`, `is_workspace_admin/member`,
  `get_workspace_members` are internal helpers exposed via PostgREST RPC. Consider
  `REVOKE EXECUTE ... FROM anon, authenticated` on the internal ones, or move them to a
  non-exposed schema. `set_agent_status` is the most worth reviewing (an anon caller could
  attempt to flip an agent's status by id). Not changed in this pass to avoid disturbing the
  provisioning/invite flows without a dedicated test.
- **Auth: leaked-password protection is disabled.** One-click enable in the Supabase dashboard
  (Auth → Password security) checks new passwords against HaveIBeenPwned. Recommended.

---

## Item 4 — Admin route + API authentication — ✅ PASS

Platform-admin identity is a server-side email allowlist in `config/admins.ts` (`isAdminEmail`),
kept out of the client bundle via `server-only`. There is no DB/env mirror — a single source of
truth.

- **Every** `/api/admin/*` route enforces it before doing anything: seven routes call the shared
  `requirePlatformAdmin()` (`lib/admin.ts`); `admin/ambassadors` uses a local equivalent that
  also gates on `isAdminEmail` (it returns 404 to hide the route's existence rather than 403 —
  both are acceptable). The new deletion route (Item 10) uses `requirePlatformAdmin()`.
- The `/admin` UI is gated in `app/(authed)/admin/layout.tsx`: logged-out → redirect to login;
  logged-in non-admin → hard `notFound()`, so the god-view never leaks.

Minor consistency note: two guard styles exist (shared vs. local). Not a vulnerability; a future
cleanup could route `admin/ambassadors` through `requirePlatformAdmin()` too.

---

## Item 5 — CRON_SECRET on cron routes — ✅ PASS

There is one cron route, `app/api/cron/credits-watch`. It requires `CRON_SECRET`: a missing secret
returns 503, and a request whose `Authorization` header is not `Bearer <CRON_SECRET>` returns 401,
before any work is done. No unauthenticated cron path exists.

---

## Item 6 — Stripe webhook verification + idempotency — ✅ PASS

`app/api/stripe/webhook`:

- **Signature verification:** the raw body + `Stripe-Signature` header are verified with
  `stripe.webhooks.constructEvent(raw, sig, STRIPE_WEBHOOK_SECRET)`; a bad signature is rejected
  before processing.
- **Idempotency:** the event id is inserted into `stripe_events` up front; a duplicate insert
  (Stripe retries deliveries) is detected and the event is skipped. If processing throws, the row
  is deleted so a genuine retry can reprocess — no event is silently lost or double-applied.

---

## Item 7 — Rate limiting on public POST endpoints — ✅ IMPLEMENTED (activate per checklist)

A Supabase-backed atomic fixed-window limiter (`lib/rate-limit.ts` + `rate_limit_hit` SQL function
in `0020`) keyed by `endpoint:client-IP`. It is atomic (`INSERT ... ON CONFLICT DO UPDATE`), so it
holds across Vercel's serverless instances, and **fails open** (allows the request, logs a warning)
if the datastore is unreachable — availability is never sacrificed to the limiter. Blocked callers
get HTTP 429; each block is logged.

Applied to the public POST surface:

| Endpoint | Limit (per IP) | Why |
|---|---|---|
| `/api/ask` | 15 / 60s | Public chat — spends the **platform Anthropic key** |
| `/api/demo/chat` | 15 / 60s | Demo chat — platform key (also has a per-session message cap) |
| `/api/build/checkout` | 8 / 60s | Mints Stripe Checkout sessions |
| `/api/onboard-submit` | 6 / 60s | Writes intake row + uploads files to storage |
| `/api/setup-submit` | 6 / 60s | Stores BYO keys / Telegram creds |
| `/api/newsletter` | 8 / 60s | Public signup |
| `/api/contact` | 5 / 60s | Public form |
| `/api/demo/start` | 6 / 60s | Creates demo sessions |
| `/api/lead-capture` | 10 / 60s | Build-funnel lead |
| `/api/ambassador-request` | 5 / 60s | Public application |
| `/api/orgs-request` | 5 / 60s | Public application |

**Activation:** until migration `0020` is deployed the limiter fails open (no enforcement, no
breakage). The hourly cron cleans up expired `rate_limits` rows.

---

## Item 8 — Security headers + CSP — ✅ IMPLEMENTED (CSP report-only)

`next.config.ts` sends, on every route:

- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` (plus `frame-ancestors 'none'` in the CSP)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), browsing-topics=()`

**CSP** is deliberately shipped as `Content-Security-Policy-Report-Only` first. It allow-lists the
site's real third parties (Supabase, Calendly, Facebook pixel, Vercel insights, Google Fonts). It
still permits `'unsafe-inline'`/`'unsafe-eval'` in `script-src` because the current app relies on
them; tightening those is a follow-up. **Promote to enforced** (`Content-Security-Policy`) only
after watching a preview deploy for violation reports, so a missed origin doesn't break a page.

---

## Item 9 — GitHub repository security — ⚠️ PARTLY DEFERRED (decision recorded)

**Decision — 2026-07-14:**

- **Dependabot alerts + security updates, and secret scanning with push protection:** **enable.**
  These are repo-admin toggles (GitHub → Settings → Code security & analysis), not code, so they
  must be switched on in the GitHub UI by a repo admin (they cannot be enabled from the app
  codebase or the tooling available to this pass). No workflow impact. Note: third-party secret
  scanning via **GitGuardian is already active** on PRs (it runs as a check on #187/#188), so the
  repo already has push-time secret detection today; enabling GitHub-native secret scanning adds a
  second layer.
- **Branch protection on `main`: DEFERRED** (recorded here per the ticket). The current workflow
  depends on direct pushes to `main` — Donna (AI Chief of Staff) pushes SEO/content directly, and
  the fast-forward-to-`main` step is a deploy fallback for rate-limited deploys. Requiring PR review
  on `main` would break both. Decision: **leave `main` open for now** and rely on the draft-PR
  convention; revisit once Donna's pushes and the deploy fallback are moved onto a PR/automation
  path. To be re-confirmed with David.

---

## Accepted risks (documented, revisited on review)

- **`postcss` moderate advisory (GHSA-qx2v-qp2m-jg93), via Next.js.** Flagged by Dependabot. It is a
  transitive dependency **inside Next.js itself** (`node_modules/next/node_modules/postcss`); the only
  available "fix" (`npm audit fix --force`) would downgrade Next.js to v9 — a breaking change that would
  take the app down. The advisory concerns XSS in PostCSS's CSS-stringify output, a build-time code path
  not reachable by untrusted input in this app, so real-world exploitability here is negligible.
  **Decision:** accept and monitor; it resolves on a future Next.js upgrade. (2026-07-14)

## Post-hardening additions (2026-07-14)

- **Audit logging** (`lib/audit.ts` + `audit_log` table, migration `0022`, applied to prod): sensitive
  admin actions are recorded — account deletion, admin intake edits, ambassador approve/suspend/payout,
  workspace deletion — with actor email, target, metadata, and IP. Best-effort (never breaks the action).
  Feeds FERPA / SOC 2 evidence. Server-only table (RLS on, no policy).
- **Cookie/consent banner** (`app/components/CookieConsent.tsx`): the Meta Pixel and Google Analytics now
  load **only after the visitor accepts** (opt-in model), for GDPR/CCPA. Switchable to opt-out if desired.

## Item 10 — Data deletion capability + runbook — ✅ IMPLEMENTED

### Capability

`DELETE /api/admin/users/[id]` (platform-admin only) triggers `purgeUserAccount()`
(`lib/account-deletion.ts`). To prevent a fat-fingered id from wiping the wrong account, the caller
must echo the target's exact email in the body: `{ "confirm": "<email>" }`. It returns an auditable
report of everything removed.

Order of operations (best-effort per step; the report lists any failures rather than stranding a
half-deleted account):

1. **Agent37 instances** for the user's workspaces → `agent37.deleteAgent()` (torn down first so a
   later failure can't leave a running, billed box orphaned).
2. **Storage** — resumes and avatars in the `college-agent-uploads` bucket.
3. **Every user-scoped Supabase row** (children before parents): `chat_sessions`, `agents`,
   `invitations`, `memberships`, `onboard_submissions`, `setup_submissions`, `checklist_items`,
   `referral_codes`, `referrals`, `wallet_transactions`, `orders`, `entitlements` (by email), then
   `workspaces`.
4. **Mailchimp** — permanent erase of the address (`removeFromMailchimp`, GDPR delete-permanent).
5. **Supabase auth user** — `auth.admin.deleteUser`.

### What is retained, and why

- **Stripe** customer / subscription / payment records are **retained** as the financial
  system-of-record (tax, accounting, chargeback obligations). To also redact the Stripe customer
  for a given request, do it manually in the Stripe dashboard (or via API) — see runbook.

### Runbook — manual data-deletion request

1. Confirm the requester's identity and the account email.
2. Find the user id (Supabase Auth → Users, or the admin god-view).
3. Call `DELETE /api/admin/users/<id>` with body `{ "confirm": "<email>" }` (signed in as an
   admin). Review the returned `report.errors` — retry if any external step (Agent37, Mailchimp)
   reports a transient failure.
4. **Stripe (manual):** if the request requires erasing billing PII too, in Stripe find the
   customer by email and delete/redact it. Otherwise it is retained per the policy above.
5. Record the deletion (date, account email, report) in the deletion log.
6. Note: marketing lists outside Mailchimp are not used; `leads` / `newsletter_signups` rows are
   keyed by email and can be additionally purged on request via SQL if the person was never a
   registered user.

---

## Change log

- **2026-07-14** — Initial hardening pass. Items 2, 7, 8, 10 implemented; Item 3 CRITICAL RLS
  exposure found (live) and fixed (`0021`); Items 1, 4, 5, 6 verified passing; Item 9 deferred
  (branch protection) with the decision recorded.
- **2026-07-14** — Migration `0021` **applied to production** with owner authorization, closing the
  critical exposure; verified (both tables RLS-enabled, zero policies). Remaining activation steps
  (`BYO_ENC_KEY`, migration `0020`, the encryption backfill, CSP enforce) still run through the
  normal deploy.
- **2026-07-14** — Follow-up round: cookie/consent banner gating Meta Pixel + Google Analytics
  (GDPR/CCPA); audit logging of sensitive admin actions (`audit_log`, migration `0022`, applied to
  production) wired into account deletion, admin intake edits, ambassador actions, and workspace
  deletion.

## Accepted findings

- **`postcss` moderate advisory (GHSA-qx2v-qp2m-jg93)** — flagged by Dependabot. It is a
  **transitive dependency inside Next.js** (`node_modules/next/node_modules/postcss`); the only
  available fix (`npm audit fix --force`) would downgrade Next.js to v9, a breaking change that
  would take the app down. The vulnerability is an XSS in PostCSS's CSS-stringify output — a
  build-time tool, not a path exposed by this application at runtime. **Decision: accept** and
  resolve on a future Next.js upgrade. Re-evaluate when Next.js ships a patched `postcss`.
