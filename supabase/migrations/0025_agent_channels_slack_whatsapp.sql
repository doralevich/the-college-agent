-- Slack and WhatsApp alongside Telegram.
--
-- agent_channels was built for Telegram, which needs only a bot token and a secret. The other two
-- need a little more, and both of the columns below are things ONLY they use:
--
--   external_id   the provider-side id a reply has to be addressed through. WhatsApp's Phone
--                 Number ID: the send goes to /{phone_number_id}/messages, so without it a
--                 message can be received and never answered. Null for Telegram and Slack.
--
--   verify_token  echoed back once, when Meta verifies our callback URL during setup. Unlike
--                 every other credential here it has to be READABLE by the person doing the
--                 setup, because they paste it into Meta's console - so it is the single
--                 deliberate exception to "credentials never leave the server".
--
-- Slack needs no new column: its signing secret goes in `secret`, the same field Telegram's
-- webhook secret uses, because both answer the same question - is this delivery really from them.

alter table public.agent_channels add column if not exists external_id  text;
alter table public.agent_channels add column if not exists verify_token text;
