-- Footer newsletter signups. Every signup lands here first so nothing is lost if
-- Mailchimp is down or not yet configured; the API route then mirrors to Mailchimp.
create table if not exists public.newsletter_signups (
  email text primary key,
  source text not null default 'footer',
  mailchimp_synced boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.newsletter_signups enable row level security;
-- No public policies: service-role writes only, admin reads via dashboard.
