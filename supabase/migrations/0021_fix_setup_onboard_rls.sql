-- CRITICAL fix — setup_submissions / onboard_submissions were readable by the public key.
--
-- Both tables had RLS enabled but carried a policy (service_role_all_setup /
-- service_role_all_onboard) defined `FOR ALL TO public USING (true)`. The NAME implied it
-- was meant for the service role, but `TO public` covers the anon and authenticated roles —
-- the anon key that ships in the browser bundle. Combined with the default SELECT grant on
-- public tables, that policy let anyone holding the anon key read EVERY row:
--   * setup_submissions  -> Telegram bot tokens + BYO Anthropic/OpenAI API keys
--   * onboard_submissions -> names, school/personal emails, phones, resume URLs
-- (Verified against the live database via pg_policies during the July 2026 hardening pass.)
--
-- These tables are written and read EXCLUSIVELY by server-side code holding the service-role
-- key (createAdminClient), which BYPASSES RLS:
--   * app/api/setup-submit/route.ts, app/api/billing/byo/route.ts (write)
--   * app/api/admin/workspaces/[id]/intake/route.ts (admin read/write)
--   * lib/provisioning.ts, app/api/billing/credits/route.ts, cron/credits-watch (read)
--   * app/(authed)/dashboard/[[...tab]]/page.tsx (read)
-- No browser/anon path reads them. So the correct state is RLS enabled with NO policy:
-- deny every non-service-role caller, service role bypasses — the same "provably server-only"
-- pattern as 0019_enable_rls_leads_configurations.sql.
--
-- `enable row level security` is repeated here (idempotent) because the live DB had RLS on
-- these tables but the repo migrations never recorded it — this file closes that drift so a
-- rebuild from migrations lands in the same safe state. If a scoped client read is ever
-- needed, add an explicit `using (auth.uid() = user_id)` SELECT policy then — never `TO public`.

alter table public.setup_submissions  enable row level security;
alter table public.onboard_submissions enable row level security;

drop policy if exists service_role_all_setup   on public.setup_submissions;
drop policy if exists service_role_all_onboard on public.onboard_submissions;
