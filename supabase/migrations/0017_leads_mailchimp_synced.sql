-- Mirror flag for the Mailchimp lead sync: false until both lead emails land in the
-- audience; the hourly cron retries unsynced rows (and back-fills pre-existing leads).
alter table public.leads add column if not exists mailchimp_synced boolean not null default false;
create index if not exists leads_mailchimp_unsynced_idx on public.leads (captured_at) where mailchimp_synced = false;
