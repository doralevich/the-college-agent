-- One row per user. A student's intake is the single set of answers their (one) agent is
-- built from, so model it one-to-one instead of as an append-only log — that removes the
-- "which row wins?" ambiguity and makes "clear" mean "delete your row".
--
-- Collapse any existing duplicate rows per real user (keep the most recent), then enforce
-- it with a UNIQUE constraint on user_id. Anonymous rows (user_id IS NULL) are exempt:
-- Postgres treats NULLs as distinct, so pre-signup submissions still coexist. The API
-- switches its inserts to upserts (ON CONFLICT user_id) so a re-submit overwrites the row.

-- Keep the latest (submitted_at, then id as tiebreak) per non-null user_id; drop the rest.
delete from public.onboard_submissions a
using public.onboard_submissions b
where a.user_id is not null
  and a.user_id = b.user_id
  and (a.submitted_at < b.submitted_at
       or (a.submitted_at = b.submitted_at and a.id < b.id));

delete from public.setup_submissions a
using public.setup_submissions b
where a.user_id is not null
  and a.user_id = b.user_id
  and (a.submitted_at < b.submitted_at
       or (a.submitted_at = b.submitted_at and a.id < b.id));

alter table public.onboard_submissions add constraint onboard_submissions_user_id_key unique (user_id);
alter table public.setup_submissions  add constraint setup_submissions_user_id_key  unique (user_id);
