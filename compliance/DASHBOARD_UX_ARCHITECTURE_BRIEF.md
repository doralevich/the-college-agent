# Dashboard & UX Architecture Brief

**Purpose:** Reproduce The College Agent's authenticated **dashboard/backend** — the funnel, the
conversational intake wizard, the intake→agent customization pipeline, chat, settings, credits/billing,
and provisioning — on a new app (Apollo Claw's build). Companion to `SECURITY_HARDENING_PLAYBOOK.md`.

Hand this to Claude Code with: *"Build the authenticated dashboard against this brief. Follow the
funnel model in §1 first, then the build order in §13. Ask me before changing the state model."*

**Stack:** Next.js App Router (Vercel) · Supabase (Postgres + Auth + Storage, RLS) · Stripe · an agent
runtime (Agent37/Hermes) · a transactional email sender. The architecture is portable if a layer swaps.

---

## 1. The funnel model (the ONE mental model — internalize this first)

Every dashboard surface is a pure function of **four booleans** the server resolves per request:

| Flag | Source | Meaning |
|---|---|---|
| `paid` | `entitlements.status === 'active'` (by email) | bought / entitled |
| `onboardDone` | an `onboard_submissions` row exists (by `user_id`) | finished the intake wizard |
| `setupDone` | a `setup_submissions` row exists | connected tools (Telegram/BYO) — **optional** |
| `hasAgent` | an `agents` row exists in their workspace | agent provisioned |

Surface resolution:
- **not paid** → build/upgrade CTA.
- **paid, not onboardDone** → **the conversational intake wizard** (this is the gate; see §4).
- **paid, onboardDone, not hasAgent** → "build my agent" / provisioning.
- **hasAgent** → the full app (chat, checklist, integrations, settings, credits).

> ⚠️ **Lesson:** `onboardDone` = "a row exists," so a stale/older intake row makes the wizard get
> skipped ("straight to creating the agent, no questions"). That's correct for finished users, but
> account for it in testing and in any re-onboarding flow (a self-service "delete agent → redo"
> path clears the intake row so the wizard returns — see §7).

---

## 2. Route & layout structure

```
app/(authed)/
  layout.tsx                 # getSession(); if no user → redirect("/login")
  dashboard/
    layout.tsx               # bootstraps a default workspace, wraps in <WorkspaceProvider>
    [[...tab]]/page.tsx       # SERVER component: resolves the 4 flags, hands them to the client
  admin/                     # gated god-view (see security playbook)
  login/ reset-password/
```

- **Auth gate lives in the layout**, not per-page: logged-out → `/login`. Self-serve: *any* logged-in
  user gets in; the real gate is **payment**, surfaced as the on-page checklist (no "pending approval"
  wall).
- **Workspace bootstrap** in the dashboard layout: `getUserWorkspaces(user.id)` creates a default
  personal workspace on first visit, provided via `WorkspaceProvider` (client context: current
  workspace + user email).
- **One catch-all route** `[[...tab]]` with a shared route grammar so server guard and client can't drift:
```ts
export const DASHBOARD_TAB_IDS = ["start-here","chat","files","integrations","checklist",
  "refer","credits","agent","agents","billing","settings", /* legacy: */ "welcome","now-what","shortcuts"] as const;
export function dashboardPath(tab, chatSessionId?) {
  return tab === "chat" && chatSessionId ? `/dashboard/chat/${encodeURIComponent(chatSessionId)}` : `/dashboard/${tab}`;
}
export function parseDashboardRoute(segments) { /* null → 404; [] → default; [tab]; ["chat", sessionId] */ }
```
  The chat thread id rides the URL as a third segment so refresh / Back / shared links reopen the same conversation.

---

## 3. The server component (state resolution)

`dashboard/[[...tab]]/page.tsx` does ONE parallel read, then hands plain flags to the client:
```ts
const [entRes, onboardRes, setupRes, agentRes, leadRes] = await Promise.all([
  db.from("entitlements").select("status").eq("email", email).maybeSingle(),
  db.from("onboard_submissions").select("first_name, agent_name, avatar_url, questionnaire").eq("user_id", user.id).maybeSingle(),
  db.from("setup_submissions").select("user_id", { count: "exact", head: true }).eq("user_id", user.id),
  workspace ? db.from("agents").select("agent37_id, name").eq("workspace_id", workspace.id).order("created_at").limit(1).maybeSingle() : Promise.resolve({ data: null }),
  db.from("leads").select("...").or(`school_email.ilike.${email},personal_email.ilike.${email}`).order("captured_at",{ascending:false}).limit(1).maybeSingle(),
]);
const paid = entRes.data?.status === "active";
const onboardDone = !!onboardRes.data;
const setupDone = (setupRes.count ?? 0) > 0;
const agentId = agentRes.data?.agent37_id ?? null;
```
- Reads with the **service-role client** (user is already authenticated; only their own rows).
- The **`leads` row prefills** the wizard so paid users aren't re-asked what they gave pre-payment.
- `questionnaire` (JSONB) also seeds the chat greeting (e.g. today's classes) and the school accent color.

---

## 4. The conversational intake wizard (the heart of customization)

`components/ConversationalOnboard.tsx` — a one-question-at-a-time wizard driven by a **`STEPS[]` array**.

- **Step kinds:** `text`, `textarea`, `single`, `multi`, `select`, `typeahead`, `image` (avatar),
  `file` (résumé), `academics`, `classList` (structured class rows), `intro`, `info`, `branch`.
- **Conditional questions:** each step has an optional `showIf: (form) => boolean`; the visible list is
  derived from the full form each render. An opt-in **"go deeper" branch** (`wantDeepDive`) reveals
  higher-value questions only if the user says yes — the standard flow is byte-for-byte unchanged for
  everyone else.
- **Resume-in-place:** progress (`{stepIdx, form}`) is persisted to `localStorage` (keyed by user id)
  so a refresh/close resumes at the same spot. Files (avatar/résumé) live in component state (they
  don't serialize) — re-picked if the user returns.
- **Prefill:** name/email/phone/school come from the `leads` row so those steps are skipped.
- **Submit (last step only):** POST `multipart/form-data` to `/api/onboard-submit` — a JSON `data`
  blob plus `avatar` / `résumé` files. On success: clear localStorage → **auto-provision** (POST
  `/api/provision`) → navigate to the dashboard. A provision failure is surfaced but the answers are
  saved (the checklist path can retry).

**Single source of truth for fields — `lib/intake-schema.ts`:**
```ts
export const INTAKE_GROUPS: IntakeGroup[] = [ /* "About You", "Academic Life", ... each = [key,label][] */ ];
```
Two consumers share it so they can't drift: the **admin summary PDF** and the **agent's full-profile
file**. Add a question → add its key here → it automatically flows to both.

---

## 5. Intake → agent brain (the pipeline that makes the agent *yours*)

```
wizard submit → /api/onboard-submit                         (store answers + extract résumé text + upload files)
              → /api/provision → configureAgentFromIntake   (write the persona files into the live agent)
edit later    → reconfigureExistingAgentForUser (via after())(push updated intake into the running agent)
```

- **`/api/onboard-submit`**: upserts one `onboard_submissions` row per user (JSONB `questionnaire`
  blob + a few promoted columns). Extracts **résumé text** (PDF → text, best-effort) so the agent gets
  the *content*, not just a link. Uploads résumé/avatar to Storage. If an agent already exists, this is
  an **edit** → `after()` re-pushes the intake to the live agent's brain.
- **`configureAgentFromIntake`** (`lib/provisioning.ts` → `lib/hermes.ts`) writes three files:
  - **SOUL.md** — identity/persona (agent name, tone, response style, off-limits topics).
  - **memories/USER.md** — curated, **always-loaded** durable facts (name, school, year, major,
    classes, priorities, LinkedIn, "résumé on file", stressors, goals, check-in cadence). Budgeted
    (~2.6k chars) — drop lowest-priority facts rather than truncate.
  - **context/STUDENT_PROFILE.md** — the **full reference**: every answered field grouped like the
    wizard + résumé text + résumé URL, loaded on demand.
- Unit-test the builders (pure string functions): assert classes, LinkedIn, résumé text, and each deep
  field actually land in the right file. This is what guarantees "every question reaches the agent."

---

## 6. Chat (`components/chat/*`)

- **`ChatProvider`** owns session state; **`useChat`** drives a turn. Streaming responses via
  `/api/agents/[id]/chat/responses` (member-gated). Sessions CRUD under `chat/sessions`.
- **Thread rail** (`ChatSidebar`) + **URL-carried thread id** (`/dashboard/chat/<sessionId>`).
- **Model + effort menus** (`ModelMenu`, `EffortMenu`) from `chat/models`. **Attachments**
  (`useChatAttachments`, `chat/files`) — note the proxy body cap must be raised for uploads.
- **Empty state** greets by name and can surface "Today: <classes>" from the intake.
- Chat/Files tabs **lazy-mount on first open, then stay mounted (hidden)** so drafts, streams, and
  scroll survive tab switches.

---

## 7. Settings hub (`components/SettingsHub.tsx`)

One hub, section-keyed by route so deep links open the right section:
- **General** — workspace name / id / delete (`SettingsView`).
- **Your Agent** (`AgentsView` + `AgentActionsMenu`) — restart/stop/rename, and **delete with
  `?reonboard=1`**: tears down the runtime box **first** (no orphan), **clears the onboarding intake**,
  then deletes the row → user re-enters the funnel at the wizard. This is the self-service "start over."
- **Subscription** (`BillingView`) — Stripe portal (card, invoices, cancel hosting).
- **Usage Credits** (`CreditsView`) — balance, top-ups, auto-recharge, alerts, usage chart.

---

## 8. Credits & billing

- Ledger table `wallet_transactions` (types: `starter`, `topup`), idempotent by row id.
- **Starter grant** at provisioning (one per user ever, via a partial unique index — re-provision can't
  double-grant). **Top-ups** bought at checkout deliver on provision or via an hourly cron that
  re-verifies payment with Stripe before retrying. **Referral** ("give a month / get a month").
- A sidebar **credits pill** (green/amber/red) links to top-up.

## 9. Integrations (`components/IntegrationsView.tsx`)
Browse/search a large catalog, connect via the runtime's connector layer, Favorites. Per-agent, gated.

## 10. Post-payment auto-signin
Stripe `success_url` → `/build/success?session_id=…` → `/api/auth/post-checkout`: resolve the Stripe
customer email → find-or-create the auth user → admin `generateLink` → `verifyOtp` on the cookie
client (sets session cookies) → 302 `/dashboard`. User lands **already signed in**, no email click.
(Route Handler, not a Server Component — it needs writable cookies.)

## 11. Provisioning lifecycle (`/api/provision`)
Idempotent (early-return if an agent row exists). Requires **paid + onboardDone** (setup optional).
Machine shape from the plan. Creates the runtime instance → inserts the `agents` row (**rollback /
delete the box if the insert fails** so you never bill an untracked instance) → grants starter credits
→ delivers pending top-ups → `configureAgentFromIntake` → welcome email. `maxDuration` raised (it waits
on the box + an exec).

## 12. Data model (core tables)
`workspaces`, `memberships`, `agents`, `onboard_submissions`, `setup_submissions`, `entitlements`
(by email), `orders`, `wallet_transactions`, `chat_sessions`, `checklist_items`, `referral_codes`,
`referrals`, `leads`, `stripe_events`, `audit_log`, `rate_limits`. RLS per the security playbook
(scoped to workspace/self, or server-only no-policy).

---

## 13. Recommended build order
1. Auth + `(authed)` layout gate + `WorkspaceProvider` bootstrap.
2. The **funnel server component** (resolve the 4 flags) + `dashboard-tabs` route grammar.
3. `DashboardClient` shell: sidebar tabs from `(paid, hasAgent)`, default-tab resolution, render-branch order.
4. The **intake wizard** + `intake-schema` (single source of truth) + `/api/onboard-submit`.
5. The **intake→agent pipeline** (`configureAgentFromIntake` + builders) with unit tests.
6. `/api/provision` (idempotent, rollback-safe) + post-checkout auto-signin.
7. Chat, Settings hub, Credits/Billing, Integrations.
8. Layer the **security playbook** over all of it (RLS, rate limits, admin MFA, headers, deletion).

## 14. Gotchas / lessons
- **`onboardDone` = row-exists** — stale rows skip the wizard; provide a "delete agent → redo" reset (§7).
- **Provisioning must be idempotent + rollback-safe** — never leave a billed box without a DB row, or vice versa.
- **Chat/Files: mount-once, hide** — don't remount on tab switch or you lose drafts/streams.
- **One route grammar** shared server+client (`dashboard-tabs.ts`) or the guard and UI drift.
- **`INTAKE_GROUPS` is the contract** — every new question goes there so PDF + agent profile stay in sync.
- Pair this with `SECURITY_HARDENING_PLAYBOOK.md` — the member-first `requireAgentAccess` fix matters
  the moment an admin account also uses the product as a user.
