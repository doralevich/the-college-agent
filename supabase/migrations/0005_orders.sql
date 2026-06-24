-- Orders + Stripe wiring for the /build checkout.
--
-- `orders` holds the full purchase detail (what the student chose) so it's queryable.
-- `entitlements` (0002) stays the lean access gate that `can_create_agent()` checks — the
-- Stripe webhook is the only thing that flips it to 'active'. `stripe_events` dedupes
-- webhook deliveries. All three are written ONLY by the service role (checkout route +
-- webhook); no RLS write policies. Users may read their own orders.

create table if not exists public.orders (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid references auth.users (id) on delete set null,
  email                    text not null,
  status                   text not null default 'pending'
                           check (status in ('pending','paid','past_due','canceled')),

  plan                     text not null,                    -- 'basic' | 'graduate' | 'scholar'
  plan_price_id            text,
  plan_amount              integer,                          -- cents

  hosting                  text not null,                    -- 'basic' | 'pro' (monthly)
  hosting_price_id         text,
  hosting_amount           integer,

  support                  text not null default 'none',     -- 'none' | 'sixmonth' | 'annual'
  support_price_id         text,
  support_amount           integer,

  onboarding               text not null default 'standard', -- 'standard' | 'whiteglove'
  onboarding_price_id      text,
  onboarding_amount        integer,

  integrations             text[] not null default '{}',
  amount_subtotal          integer,                          -- cents due today (first invoice)

  stripe_session_id        text,
  stripe_customer_id       text,
  stripe_subscription_id   text,
  stripe_payment_intent_id text,

  student_info             jsonb,
  config                   jsonb,

  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  paid_at                  timestamptz
);

create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_email_idx on public.orders (lower(email));
create index if not exists orders_stripe_session_idx on public.orders (stripe_session_id);
create index if not exists orders_stripe_subscription_idx on public.orders (stripe_subscription_id);

alter table public.orders enable row level security;

-- Users may read their own orders (by user_id or JWT email). No write policy: only the
-- service role (checkout route + Stripe webhook) inserts/updates.
drop policy if exists orders_self_select on public.orders;
create policy orders_self_select on public.orders
  for select using (
    user_id = auth.uid()
    or lower(email) = lower(auth.jwt() ->> 'email')
  );

grant select on public.orders to authenticated;

-- Webhook idempotency: record each Stripe event id once; replays become no-ops.
create table if not exists public.stripe_events (
  id          text primary key,        -- Stripe event id (evt_...)
  type        text,
  received_at timestamptz not null default now()
);
alter table public.stripe_events enable row level security;  -- service-role only; no policies

-- Entitlements gains the live Stripe linkage (the gate stays status-driven).
alter table public.entitlements add column if not exists stripe_customer_id text;
alter table public.entitlements add column if not exists stripe_subscription_id text;
