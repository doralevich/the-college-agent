-- BYO-key, all optional. The setup form accepts the student's Anthropic / OpenAI keys AND
-- their Telegram credentials, but every field is optional — a student can provide some,
-- all, or none. The legacy NOT NULL constraints (from the old mandatory BYO-key wizard)
-- block any partial submission, so relax them. telegram_user_id is already nullable.
alter table public.setup_submissions alter column anthropic_key     drop not null;
alter table public.setup_submissions alter column openai_key        drop not null;
alter table public.setup_submissions alter column telegram_token    drop not null;
alter table public.setup_submissions alter column telegram_username drop not null;
