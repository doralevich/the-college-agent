-- Audit log of administrative and sensitive-data actions (FERPA / SOC 2 evidence). Written
-- server-side only via lib/audit.ts. RLS enabled with NO policy: the service role bypasses it,
-- the public anon/authenticated key gets nothing — same server-only pattern as the other
-- internal tables. Append-only in practice; never exposed to the browser.

create table if not exists public.audit_log (
  id           uuid primary key default gen_random_uuid(),
  actor_email  text,
  action       text not null,
  target       text,
  metadata     jsonb,
  ip           text,
  created_at   timestamptz not null default now()
);

alter table public.audit_log enable row level security;

create index if not exists audit_log_created_at_idx on public.audit_log (created_at desc);
