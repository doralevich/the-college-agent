-- Entitlement / allowlist gate for creating OpenClaw instances.
-- v1: an 'active' row for the user's email = may create an OpenClaw.
-- Later, the Stripe webhook upserts status here by email (source = 'stripe'),
-- so `can_create_agent()` is the single seam billing plugs into — no app changes.
--
-- Keyed by email (not user_id) so the allowlist can be seeded BEFORE a user's
-- first magic-link login (no auth.users row exists yet at seed time).

create table if not exists public.entitlements (
  email      text primary key,
  status     text not null default 'active'
             check (status in ('active','inactive','past_due','canceled')),
  source     text not null default 'allowlist',   -- 'allowlist' | 'stripe'
  user_id    uuid references auth.users (id) on delete set null,
  note       text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- True iff the current user's email is an active entitlement. SECURITY DEFINER
-- so it reads entitlements regardless of the caller's RLS view. Uses the JWT
-- email claim (auth.email() isn't available on all Supabase versions).
create or replace function public.can_create_agent()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.entitlements
    where email = lower(auth.jwt() ->> 'email')
      and status = 'active'
  );
$$;

alter table public.entitlements enable row level security;

-- Users may read ONLY their own entitlement row (to render approval state).
drop policy if exists entitlements_self_select on public.entitlements;
create policy entitlements_self_select on public.entitlements
  for select using (email = lower(auth.jwt() ->> 'email'));
-- No insert/update/delete policies: only the service role (seed script) and the
-- future Stripe webhook (service role) may mutate entitlements.

grant select on public.entitlements to authenticated;
grant execute on function public.can_create_agent() to authenticated;
