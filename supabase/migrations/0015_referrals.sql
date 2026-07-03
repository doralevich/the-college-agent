-- Referral program: each student gets a stable share code; completed referred
-- checkouts land in `referrals` (unique per Stripe session, so webhook retries
-- can't double-reward). Writes go through service-role API routes; students read
-- only their own rows.
create table if not exists public.referral_codes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  code text not null unique,
  created_at timestamptz not null default now()
);

alter table public.referral_codes enable row level security;
drop policy if exists "referral_codes_self_select" on public.referral_codes;
create policy "referral_codes_self_select" on public.referral_codes
  for select using (auth.uid() = user_id);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  referrer_user_id uuid not null references auth.users(id) on delete cascade,
  referred_email text not null,
  stripe_session_id text not null unique,
  status text not null default 'pending', -- pending | rewarded | no_customer
  reward_cents integer not null default 2500,
  created_at timestamptz not null default now(),
  rewarded_at timestamptz
);

alter table public.referrals enable row level security;
drop policy if exists "referrals_self_select" on public.referrals;
create policy "referrals_self_select" on public.referrals
  for select using (auth.uid() = referrer_user_id);
