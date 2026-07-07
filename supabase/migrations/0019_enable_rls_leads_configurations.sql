-- Enable Row Level Security on the two tables that were left exposed.
--
-- `leads` (marketing / build leads: names, emails, phones, school) and
-- `configurations` are written and read EXCLUSIVELY by server-side code using
-- the service-role key:
--   * app/api/lead-capture/route.ts   (insert, SUPABASE_SERVICE_ROLE_KEY)
--   * app/api/cron/credits-watch/route.ts (read/update, createAdminClient)
--   * app/(authed)/dashboard/[[...tab]]/page.tsx (read, createAdminClient)
-- and `configurations` has no client references at all.
--
-- The service role BYPASSES RLS, so enabling RLS with no policies keeps every
-- server path working while denying the public anon/authenticated keys (which
-- ship in the browser bundle) any read or write. Before this, both tables were
-- fully readable by anyone holding the public key.
--
-- No policies are added on purpose: nothing should ever reach these tables with
-- the public key. If a scoped client-side read is needed later, add an explicit
-- SELECT policy then.

alter table public.leads enable row level security;
alter table public.configurations enable row level security;
