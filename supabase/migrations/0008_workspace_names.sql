-- College Agent: friendly workspace names.
--
-- Every workspace used to be bootstrapped with the literal "My Workspace" (see the old
-- lib/workspaces.ts), so the /admin god-view couldn't tell one student's workspace from
-- another. The app now names them "<First>'s Workspace" (intake first name) or, before the
-- student onboards, "<handle>'s Workspace" (email local-part). Backfill existing rows to
-- match — this mirrors lib/workspaces.ts deriveWorkspaceName() exactly.
--
-- Only rows still carrying the legacy default are touched, so any name a student set by
-- hand in Settings is preserved. Owner email lives in auth.users (readable from a migration
-- running as postgres); the first name in public.onboard_submissions (one row per user as
-- of 0007). COALESCE prefers the first name, then the email handle.

update public.workspaces w
set name = coalesce(
    nullif(btrim(ob.first_name), ''),
    nullif(split_part(u.email, '@', 1), '')
  ) || '''s Workspace'
from auth.users u
left join public.onboard_submissions ob on ob.user_id = u.id
where w.owner_id = u.id
  and w.name = 'My Workspace'
  and coalesce(nullif(btrim(ob.first_name), ''), nullif(split_part(u.email, '@', 1), '')) is not null;
