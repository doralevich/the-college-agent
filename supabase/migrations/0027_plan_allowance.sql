-- Monthly AI allowance for the tiered plans ($25 / $50 / $100, including $5 / $15 / $40 of
-- AI usage a month). Each paid invoice grants its tier's allowance, recorded on the wallet
-- ledger alongside starter grants, top-ups and auto-recharges.
--
-- Two changes, both additive:
--
--   1. A new ledger type, 'allowance'. The type CHECK is widened, never narrowed, so every
--      existing row still satisfies it.
--
--   2. stripe_invoice_id, with a unique index. An allowance belongs to exactly one invoice,
--      and Stripe sends invoice.paid AND invoice.payment_succeeded for the same invoice -
--      plus retries of either. The index is what makes a grant happen once per invoice
--      however many times it is delivered. Partial, so the existing rows (all null here)
--      are untouched.
--
-- Safe to apply ahead of the code: nothing writes 'allowance' or stripe_invoice_id until the
-- webhook change ships.

alter table public.wallet_transactions
  drop constraint if exists wallet_transactions_type_check;

alter table public.wallet_transactions
  add constraint wallet_transactions_type_check
  check (type = any (array['starter', 'topup', 'auto_recharge', 'refund', 'allowance']));

alter table public.wallet_transactions
  add column if not exists stripe_invoice_id text;

create unique index if not exists wallet_transactions_invoice_uniq
  on public.wallet_transactions (stripe_invoice_id)
  where stripe_invoice_id is not null;
