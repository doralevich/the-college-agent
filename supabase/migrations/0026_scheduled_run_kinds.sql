-- More than one kind of scheduled run.
--
-- The table was built for a single unnamed "check-in", so it was keyed one row per HOUR per
-- agent. That was right while there was one thing to schedule and wrong the moment there were
-- three: a student wanting a morning brief and an end-of-day summary is expressing two separate
-- intents that happen to be at different hours, and keying on the hour makes them collide the
-- moment two runs share one.
--
-- Keyed by KIND now. Two runs may sit at the same hour, and turning one off leaves the others
-- alone.
--
-- `kind` is free text with a default rather than an enum: adding a fourth run is then a registry
-- entry in config/scheduled-runs.ts and nothing here. Rows whose kind is not in that registry are
-- skipped by the sweep rather than run with a guessed prompt.

alter table public.checkin_schedules
  add column if not exists kind text not null default 'morning-brief';

-- The old key. Dropping it is what allows two runs at the same hour.
alter table public.checkin_schedules
  drop constraint if exists checkin_schedules_agent37_id_hour_key;

-- One row per kind per agent. Two morning briefs is a bug, not a feature.
alter table public.checkin_schedules
  drop constraint if exists checkin_schedules_agent37_id_kind_key;
alter table public.checkin_schedules
  add constraint checkin_schedules_agent37_id_kind_key unique (agent37_id, kind);
