# The College Agent: Billing & Monitoring — Build Handoff

## What This Is

The College Agent is a Next.js app where college students pay for a personal AI agent (Hermes by Nous Research) running on Agent37 cloud infrastructure. Each student gets a dedicated box with AI access via Telegram.

This document scopes the work to add a dual-path billing system: students can either use **Platform Credits** (pay us, we handle model costs) or **BYO API Key** (bring their own Anthropic/OpenAI key, pay us a flat subscription).

---

## Stack

- **Next.js App Router** + TypeScript
- **Supabase** — student records, orders, entitlements (service role key in `.env.local`)
- **Stripe** — subscriptions, one-time payments, portal, invoices
- **Agent37** — provisions and manages Hermes boxes per student (`lib/agent37.ts`)
- **Mandrill** — transactional email (already in `.env.local`)
- **Hermes (Nous Research)** — the AI agent software running on each Agent37 box

---

## What Already Exists (Do Not Rebuild)

| What | Where |
|------|-------|
| Stripe checkout (subscription) | `app/api/build/checkout/route.ts` |
| Stripe webhook (payment → entitlements) | `app/api/stripe/webhook/route.ts` |
| Stripe billing portal | `app/api/billing/portal/route.ts` + `components/BillingView.tsx` |
| Agent37 provisioning | `lib/agent37.ts` → `agent37.listAgents()`, `agent37.createAgent()`, `agent37.exec()` |
| Agent37 budget API | `lib/agent37.ts` → `agent37.getBudget(id)`, `agent37.setBudget(id, opts)` |
| Agent37 usage API | `lib/agent37.ts` → `agent37.getUsage(id, month?)` |
| Budget display (modal) | `components/BudgetDialog.tsx` |
| Student dashboard shell | `app/(authed)/dashboard/` + `components/DashboardClient.tsx` |
| Dashboard tabs | `lib/dashboard-tabs.ts` — tabs: chat, files, integrations, agent, agents, billing, settings |
| Onboarding wizard | `app/onboard/page.tsx` |
| Setup (API keys + Telegram) | `app/setup/page.tsx` |
| Admin panel | `app/(authed)/admin/` |
| Student tables | `entitlements`, `orders`, `agents`, `workspaces`, `setup_submissions`, `onboard_submissions` |
| Hermes provisioning logic | `lib/hermes.ts` → `configureHermes()` — already handles BYO anthropicKey/openaiKey |

### Key Types (already defined in `lib/types.ts`)

```typescript
interface Budget {
  monthly_cap_micros: number;
  monthly_consumed_micros: number;
  monthly_remaining_micros: number;
  monthly_period: string;       // "2024-07"
  topup_remaining_micros: number;
  updated_at: number | null;
}

interface Usage {
  period: string;
  total_micros: number;
  by_integration: {
    llm: { cost_micros: number; calls: number; input_tokens: number; output_tokens: number };
    brave: { cost_micros: number; calls: number };
    composio: { cost_micros: number; calls: number };
  };
}
```

### Existing Agent37 Routes (already in `app/api/agents/[id]/`)

- `GET /api/agents/{id}/budget` — student can view own agent budget
- `GET /api/agents/{id}/usage?month=2024-07` — student can query any month
- `PATCH /api/agents/{id}/budget` — admin only, raises cap or adds topup

### Important: `configureHermes()` in `lib/hermes.ts`

When a student provides a BYO key, this function writes it to `~/.hermes/.env` on the Agent37 box and repoints Hermes off the Agent37 metered gateway to direct Anthropic/OpenAI. When no BYO key is provided, Hermes uses `custom:Agent37` as the model provider (metered, billed against Agent37 wallet). This is the core of the dual-path model.

---

## Dual-Path Architecture

### Path A: Platform Credits
- Student funds a wallet via Stripe (one-time top-up)
- Model calls route through Agent37's metered gateway (default Hermes behavior)
- Usage monitored via Agent37 budget/usage API
- Auto-recharge: Stripe off-session charge when balance drops below threshold
- Alerts: cron checks Agent37 balance, fires Telegram/email
- Receipts: Stripe invoice + `wallet_transactions` table

### Path B: BYO API Key
- Student enters Anthropic or OpenAI key during setup (stored in `setup_submissions.anthropic_key` / `setup_submissions.openai_key`)
- `configureHermes()` already handles writing BYO key to Hermes config
- Student pays flat monthly subscription (Stripe)
- Usage monitored by calling Anthropic/OpenAI usage APIs server-side using their stored key
- Alerts: cron checks provider usage vs self-set threshold
- Receipts: Stripe subscription invoices only

---

## Phase 1: Data Model — 0.5 days

New Supabase migration. Add to existing tables and create new ones:

```sql
-- Add to entitlements
ALTER TABLE entitlements
  ADD COLUMN billing_mode text CHECK (billing_mode IN ('platform', 'byo')) DEFAULT 'platform',
  ADD COLUMN provider text CHECK (provider IN ('anthropic', 'openai')),
  ADD COLUMN wallet_balance_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN alert_threshold_pct integer DEFAULT 80,
  ADD COLUMN auto_recharge_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN auto_recharge_threshold_cents integer DEFAULT 1000,
  ADD COLUMN auto_recharge_amount_cents integer DEFAULT 2500,
  ADD COLUMN last_alerted_pct integer,
  ADD COLUMN last_alerted_at timestamptz,
  ADD COLUMN stripe_payment_method_id text;

-- Add to orders
ALTER TABLE orders
  ADD COLUMN billing_mode text CHECK (billing_mode IN ('platform', 'byo')) DEFAULT 'platform',
  ADD COLUMN provider text CHECK (provider IN ('anthropic', 'openai'));

-- New table: wallet top-up and auto-recharge transactions
CREATE TABLE wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  amount_cents integer NOT NULL,
  type text NOT NULL CHECK (type IN ('topup', 'auto_recharge', 'refund')),
  stripe_payment_intent_id text,
  status text NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- New table: monthly usage snapshots for platform path charts
CREATE TABLE usage_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  agent37_id text NOT NULL,
  period text NOT NULL,             -- "2024-07"
  total_micros bigint NOT NULL,
  llm_cost_micros bigint,
  llm_calls integer,
  llm_input_tokens integer,
  llm_output_tokens integer,
  brave_cost_micros bigint,
  brave_calls integer,
  composio_cost_micros bigint,
  composio_calls integer,
  snapshotted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, period)
);
```

---

## Phase 2: Onboarding Choice Screen — 2 days

**File to modify:** `app/build/page.tsx` (or wherever the configurator lives) + `app/api/build/checkout/route.ts`

Add a "Power your agent" step to the `/build` configurator before checkout:

```
[ Platform Credits ]     [ Bring Your Own Key ]
  We handle the            Use your Anthropic
  model costs.             or OpenAI account.
  Pay as you go.           Flat subscription only.
```

- BYO path: after selection, show provider choice (Anthropic / OpenAI) + key entry field
- Platform path: no key entry; show wallet top-up prompt after checkout completes
- Wire `billing_mode` + `provider` into the checkout API call → stored on `orders` → synced to `entitlements` via Stripe webhook

**In `app/api/stripe/webhook/route.ts`**, when syncing `entitlements` on `checkout.session.completed`, also write `billing_mode` and `provider` from the order record.

**In `app/api/setup-submit/route.ts`** (or equivalent), store the BYO key in `setup_submissions` as today, and also call `configureHermes()` with the appropriate key — this already works, just make sure it's gated on `billing_mode === 'byo'`.

---

## Phase 3: BYO Path Dashboard — 3 days

**Files to modify:** `components/BillingView.tsx`, `app/api/billing/summary/route.ts`

**New API route:** `app/api/billing/usage/route.ts`

The billing tab should detect `billing_mode` from the summary response and render different UI.

### New API: `GET /api/billing/usage`

Server-side, pull usage from the student's provider using their stored key:

```typescript
// Anthropic usage API
GET https://api.anthropic.com/v1/usage
Headers: x-api-key: <stored anthropic_key>

// OpenAI usage API
GET https://api.openai.com/v1/usage?date=YYYY-MM-DD
Headers: Authorization: Bearer <stored openai_key>
```

Read the key from `setup_submissions` using the authenticated user's ID (service role query, never expose key to client).

### BYO Billing Tab UI

- Current month spend (from provider usage API)
- Tokens used (input + output)
- Link to provider's billing dashboard (Anthropic: console.anthropic.com/settings/billing, OpenAI: platform.openai.com/usage)
- Stripe subscription section: plan name, next billing date, amount
- Invoice list (Phase 8 covers this, stub with "View invoices" → Stripe portal link for now)

---

## Phase 4: Platform Path - Wallet + Top-up — 3 days

### New API routes:

**`POST /api/billing/topup`**
```typescript
// Body: { amount_cents: number }
// 1. Look up stripe_customer_id from entitlements
// 2. Create Stripe PaymentIntent (off-session if payment method saved, otherwise use Stripe hosted page)
// 3. Insert wallet_transactions row with status: 'pending'
// 4. Return { clientSecret } for Stripe Elements, or { url } for hosted checkout
```

**`POST /api/stripe/webhook`** (extend existing handler):
```typescript
// On payment_intent.succeeded where metadata.type === 'topup':
// 1. Update wallet_transactions row to status: 'succeeded'
// 2. Increment entitlements.wallet_balance_cents
// 3. Call agent37.setBudget(agent37Id, { topup_micros: amount_cents * 10000 })
//    (1 cent = 10,000 micros)
```

### Dashboard: Wallet UI (add to BillingView for platform path)

- Wallet balance card: `$X.XX remaining this month`
- Top-up button: amount picker ($10 / $25 / $50 / custom) → Stripe payment flow
- Transaction history: list from `wallet_transactions` table

### Note on micros conversion:
Agent37 uses micros (millionths of a dollar). 1 USD = 1,000,000 micros. 1 cent = 10,000 micros.

---

## Phase 5: Platform Path - Usage Display — 2.5 days

**Files to modify:** `components/BillingView.tsx` (platform path branch)

**New API route:** `app/api/billing/usage-history/route.ts`

### Usage Display (current month)

The budget and usage are already fetched in `BudgetDialog`. Move this data into the main billing tab for platform path students:

- Monthly allowance (from `Budget.monthly_cap_micros`)
- Spent so far (from `Budget.monthly_consumed_micros`)
- Remaining (from `Budget.monthly_remaining_micros`)
- Breakdown: LLM cost / Search cost / Tools cost (from `Usage.by_integration`)
- Burn rate: spent ÷ days elapsed → estimated month-end total

### Monthly History Chart

Monthly snapshots are stored in `usage_snapshots`. A cron job (see Phase 6) populates this on the 1st of each month for the previous month.

**New API:** `GET /api/billing/usage-history` → query `usage_snapshots` for the authenticated user, last 6 months.

Render as a simple bar chart (use Recharts if already in `package.json`, otherwise CSS bars to avoid a new dependency).

### Cron: Monthly Snapshot

Add a cron route at `app/api/cron/snapshot-usage/route.ts` (protected by `CRON_SECRET` header):

```typescript
// For each active entitlement where billing_mode === 'platform':
// 1. Find their agent37_id from agents table
// 2. Call agent37.getUsage(id, previousMonth)
// 3. Upsert into usage_snapshots
```

Schedule this in Vercel cron (vercel.json) to run on the 1st of each month.

---

## Phase 6: Alert System — 2.5 days

### New API route: `app/api/cron/check-usage-alerts/route.ts`

Run daily via Vercel cron. For each active entitlement:

**Platform path:**
```typescript
const budget = await agent37.getBudget(agent37Id);
const pct = (budget.monthly_consumed_micros / budget.monthly_cap_micros) * 100;
```

**BYO path:**
```typescript
// Call Anthropic or OpenAI usage API (reuse logic from Phase 3)
const { spent, cap } = await getProviderUsage(userId, provider, key);
const pct = (spent / cap) * 100;
```

**Alert logic:**
```typescript
const threshold = entitlement.alert_threshold_pct; // e.g., 80
if (pct >= threshold && entitlement.last_alerted_pct < threshold) {
  await sendTelegramAlert(userId, pct, remaining);
  await sendMandrillAlert(email, pct, remaining);
  await supabase.from('entitlements').update({
    last_alerted_pct: Math.floor(pct),
    last_alerted_at: new Date().toISOString()
  }).eq('user_id', userId);
}
// Reset last_alerted_pct at start of new billing period
```

### Alert Settings UI

Add to `app/(authed)/dashboard/settings/page.tsx`:
- Alert threshold selector: 50% / 70% / 80% / 90% (saved to `entitlements.alert_threshold_pct`)
- Notification channel: Telegram (if connected) + email toggle

### Telegram message format:
```
Your College Agent has used X% of your monthly budget.
Remaining: $X.XX
Top up now: <link>
```

Use Mandrill for email (template already used in onboarding flow — check `app/api/onboard-submit`).

---

## Phase 7: Auto-recharge (Platform Path Only) — 3 days

### Step 1: Save payment method during initial checkout

In `app/api/build/checkout/route.ts`, add to the Stripe Checkout Session:
```typescript
payment_intent_data: {
  setup_future_usage: 'off_session',
}
```

In the Stripe webhook on `checkout.session.completed`, retrieve the `PaymentIntent`, get the `payment_method` ID, and store it in `entitlements.stripe_payment_method_id`.

### Step 2: Auto-recharge settings UI

Add to settings tab:
- Toggle: Enable auto-recharge (on/off)
- Recharge when balance drops below: $5 / $10 / $15 / custom
- Recharge amount: $10 / $25 / $50 / custom

Save to `entitlements` columns added in Phase 1.

### Step 3: Cron job — `app/api/cron/auto-recharge/route.ts`

Run hourly (or daily). For each platform path entitlement where `auto_recharge_enabled = true`:

```typescript
const balance = entitlement.wallet_balance_cents;
const threshold = entitlement.auto_recharge_threshold_cents;

if (balance < threshold) {
  // Charge the saved payment method
  const paymentIntent = await stripe.paymentIntents.create({
    amount: entitlement.auto_recharge_amount_cents,
    currency: 'usd',
    customer: entitlement.stripe_customer_id,
    payment_method: entitlement.stripe_payment_method_id,
    confirm: true,
    off_session: true,
  });

  // Insert wallet_transactions row (status: pending, type: auto_recharge)
  // Webhook will handle the balance increment on payment_intent.succeeded
}
```

On failure (`payment_intent.payment_failed`): send Telegram + email alert, flip `auto_recharge_enabled = false` after 3 consecutive failures.

---

## Phase 8: Invoice/Receipt History — 1.5 days

**New API route:** `app/api/billing/invoices/route.ts`

```typescript
// Both paths: pull Stripe invoices
const invoices = await stripe.invoices.list({
  customer: entitlement.stripe_customer_id,
  limit: 24,
});

// Platform path also: pull wallet_transactions from Supabase
```

**Response shape:**
```typescript
type Invoice = {
  id: string;
  date: string;
  amount_cents: number;
  status: 'paid' | 'open' | 'void';
  type: 'subscription' | 'topup' | 'auto_recharge';
  pdf_url: string | null;  // Stripe provides this for subscription invoices
};
```

Add invoice list to billing tab below the main billing summary. Each row: date, description, amount, status pill, "Download PDF" link (Stripe provides `invoice.invoice_pdf` URL).

---

## Build Order Summary

| Phase | What | Days | Dependency |
|-------|------|------|------------|
| 1 | Data model (Supabase migration) | 0.5 | None — start here |
| 2 | Onboarding choice screen | 2 | Phase 1 |
| 3 | BYO path dashboard | 3 | Phase 1 + 2 |
| 4 | Platform wallet + top-up | 3 | Phase 1 + 2 |
| 5 | Platform usage display + history | 2.5 | Phase 4 |
| 6 | Alert system | 2.5 | Phase 3 + 5 |
| 7 | Auto-recharge | 3 | Phase 4 |
| 8 | Invoice history | 1.5 | Phase 3 + 4 |
| | **Total** | **18 days** | |

**Parallel path:** Phases 3 (BYO) and 4-5 (Platform) can be built simultaneously by two devs after Phase 1-2 land.

**Fastest path to shipping something:** Phases 1-3 give you a working BYO path in ~5.5 days. BYO is simpler, covers students with their own API keys, and unblocks the subscription revenue model immediately.

---

## Env Vars (already in `.env.local`)

```
AGENT37_API_KEY          — Agent37 control plane (NEEDS ROTATION — currently invalid)
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
MANDRILL_API_KEY
```

**Missing (will need to add):**
```
CRON_SECRET              — shared secret for protecting cron routes
```

---

## Important Notes

- The AGENT37_API_KEY in `.env.local` is currently revoked. Generate a new one at agent37.com/dashboard/cloud/api-keys before any Agent37 API calls will work.
- Agent37 uses micros (millionths of a dollar). Always convert: `dollars * 1_000_000 = micros`, `cents * 10_000 = micros`.
- Never expose `setup_submissions.anthropic_key` or `openai_key` to the client. All provider API calls using stored keys must happen server-side.
- The `entitlements` table is the billing gate. `status: 'active'` = student can use their agent. Keep this table as the source of truth for all billing state.
- Stripe's self-serve portal already handles payment method updates and cancellation — don't rebuild those flows.
