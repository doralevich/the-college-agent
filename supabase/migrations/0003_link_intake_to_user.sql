-- College Agent: tie the existing public intake tables to an authenticated user so
-- the dashboard onboarding checklist can tell whether THIS student finished each step.
-- These tables were created ad hoc (not in apolloclaw2's migrations) and are written
-- via the service-role client, so no RLS changes are needed here.

alter table public.onboard_submissions add column if not exists user_id uuid references auth.users (id) on delete set null;
alter table public.setup_submissions  add column if not exists user_id uuid references auth.users (id) on delete set null;

create index if not exists onboard_submissions_user_idx on public.onboard_submissions (user_id);
create index if not exists setup_submissions_user_idx  on public.setup_submissions (user_id);
