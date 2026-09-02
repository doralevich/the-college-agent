-- Proactive check-ins, scheduled by THIS APP instead of inside the agent box.
--
-- WHY MOVE THEM OUT OF THE BOX. Until now a check-in was a `hermes cron` job created on the
-- instance during provisioning. That works, and it ties the single most valuable thing the
-- product does to one specific agent runtime: OpenClaw boxes have no `hermes cron`, so the
-- moment an agent is provisioned from the Apollo template its check-ins silently stop existing.
-- Scheduling from here works on either runtime, because invoking an agent goes through Agent37's
-- own /v1/responses API rather than a runtime's CLI.
--
-- It is also simply better. In-box cron fires on the BOX's clock, which is UTC, so a student in
-- California who asked for a daily morning check-in got it at midnight. We now capture their
-- timezone from their browser at onboarding and store it per schedule, and the sweep compares
-- against their local wall clock (lib/schedule-timing.ts, via Intl so DST is handled).
--
-- HOUR GRANULARITY, because the sweep runs hourly (vercel.json). Minutes would be a promise the
-- mechanism cannot keep.

create table if not exists public.checkin_schedules (
  id           bigint generated always as identity primary key,
  agent37_id   text not null references public.agents (agent37_id) on delete cascade,

  -- The student this check-in is for. Carried here rather than re-derived at run time
  -- (agent -> workspace -> membership -> user) because the sweep needs two things that both
  -- hang off the student: their Telegram credentials, and their onboarding answers, which are
  -- what the check-in prompt is built from. Set null if the account is deleted; the sweep skips
  -- rows with no student, since there is nobody to write to.
  user_id      uuid references auth.users (id) on delete set null,

  -- Local hour, 0-23, in `timezone`.
  hour         integer not null check (hour between 0 and 23),

  -- Which days this fires on: 'daily', 'weekdays', or a comma-separated set of lowercase
  -- English weekday names ('monday,thursday' for the twice-weekly cadence). Free text rather
  -- than an enum so a new cadence in the onboarding form doesn't need a migration.
  days         text not null default 'daily',

  -- IANA name, e.g. "America/New_York". NOT NULL and not defaulted: a schedule with no timezone
  -- means UTC, which is the middle of the night for most of the student base, and a check-in
  -- that arrives at 3am is worse than no check-in. Seeding skips students whose timezone we
  -- never captured rather than guessing one for them.
  timezone     text not null,

  enabled      boolean not null default true,

  -- The local date (YYYY-MM-DD in `timezone`) this last fired on. The guard against double
  -- firing: the sweep runs every hour, so without it a retry would re-run the same hour, and
  -- DST would fire some schedules twice in a night.
  last_run_on  date,
  last_status  text,
  last_error   text,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  -- One schedule per hour per agent. The thrice-daily cadence is three rows (8, 12, 17), not one
  -- row with a list, so "is this due now?" stays a comparison rather than a parse.
  unique (agent37_id, hour)
);

create index if not exists checkin_schedules_due_idx
  on public.checkin_schedules (enabled, hour);

-- Service-role only. The hourly sweep and provisioning are the only writers, and a student has
-- no direct reason to read these rows: their cadence is shown from their onboarding answers.
-- RLS on with no policies means no anon/authenticated access at all, which is the intent.
alter table public.checkin_schedules enable row level security;
