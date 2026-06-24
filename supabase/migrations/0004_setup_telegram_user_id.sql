-- College Agent: Hermes needs the student's NUMERIC Telegram user id (TELEGRAM_ALLOWED_USERS),
-- not just a @username. Add a column for it on the technical-setup intake.
alter table public.setup_submissions add column if not exists telegram_user_id text;
