-- Credits monitoring + auto-recharge state, per paying account. Alerts fire on absolute
-- remaining balance (low under $5, critical under $1) — a stage marker prevents repeats
-- until the balance recovers. Auto-recharge charges the saved payment method captured
-- from the hosting subscription.

alter table entitlements
  add column if not exists last_alert_stage text check (last_alert_stage in ('low', 'critical')),
  add column if not exists last_alert_at timestamptz,
  add column if not exists auto_recharge_enabled boolean not null default false,
  add column if not exists auto_recharge_threshold_cents integer not null default 500,
  add column if not exists auto_recharge_amount_cents integer not null default 2500,
  add column if not exists auto_recharge_failures integer not null default 0,
  add column if not exists stripe_payment_method_id text;
