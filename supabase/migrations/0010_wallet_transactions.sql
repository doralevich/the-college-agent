-- Payment ledger for AI credits: the one-time starter grant, student top-ups, and later
-- auto-recharges/refunds. This table records what was bought or granted; the spendable
-- balance itself is enforced by the Agent37 per-box budget (monthly floor + top-ups).

create table wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount_cents integer not null,
  type text not null check (type in ('starter', 'topup', 'auto_recharge', 'refund')),
  status text not null check (status in ('pending', 'succeeded', 'failed')),
  stripe_session_id text,
  stripe_payment_intent_id text,
  created_at timestamptz not null default now()
);

alter table wallet_transactions enable row level security;

-- Students read their own history; all writes go through service-role API routes.
create policy wallet_transactions_self_select on wallet_transactions
  for select using (auth.uid() = user_id);

create index wallet_transactions_user_idx on wallet_transactions (user_id, created_at desc);

-- The Stripe webhook settles pending rows by checkout session id.
create unique index wallet_transactions_session_uniq on wallet_transactions (stripe_session_id)
  where stripe_session_id is not null;

-- The starter grant happens once per account, ever — rebuilding an agent doesn't re-mint it.
create unique index wallet_transactions_starter_once on wallet_transactions (user_id)
  where type = 'starter';
