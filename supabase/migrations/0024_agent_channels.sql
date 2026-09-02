-- Telegram as a WEBHOOK channel, owned by this app, instead of a bot token living on the box.
--
-- WHY THIS MOVED. Until now a student's Telegram credentials were written into
-- ~/.hermes/.env during provisioning and the Hermes gateway ON THE INSTANCE polled Telegram and
-- replied. That works only for as long as every box runs Hermes. An OpenClaw box has no Hermes
-- gateway, so the moment an agent is provisioned from the Apollo template a student messaging
-- their bot would get silence — no error anywhere, just nothing back.
--
-- ApolloClaw hit exactly this and rebuilt it the way this table supports: Telegram POSTs to
-- /api/channels/telegram/{agentId}, that route runs a turn through Agent37's own API, and sends
-- the answer back. Nothing on the instance participates, so it works on every runtime.
--
-- It also removes a setup step. The old flow needed the student's NUMERIC Telegram user id,
-- which is a genuinely awkward thing to ask an 18-year-old to go find. The webhook learns their
-- chat id from the first message they send: they paste a bot token and that is the whole setup.

create table if not exists public.agent_channels (
  agent37_id   text not null references public.agents (agent37_id) on delete cascade,

  -- Only 'telegram' today. A column rather than a fixed table so adding one later is a row,
  -- not a migration.
  channel      text not null,

  -- The student's bot token, from BotFather. Encrypted at rest (lib/crypto/byo), same as the
  -- BYO model keys. NEVER returned to the browser — see toChannel() in lib/channels/store.ts,
  -- which has no field for it to be forgotten in.
  bot_token    text,

  -- Display only: the bot's @username, so the dashboard can say which bot is connected.
  account      text,

  -- Telegram echoes this on every delivery in X-Telegram-Bot-Api-Secret-Token. The webhook URL
  -- is public and contains a guessable agent id, so THIS is what actually authenticates a
  -- delivery. 32 random bytes, generated at connect, never shown to anyone.
  secret       text,

  -- The agent session this channel talks in, so a reply continues the conversation rather than
  -- starting a fresh one that knows nothing about the last message.
  session_id          text,
  session_started_at  timestamptz,

  -- Bound on the FIRST message received. After that the agent answers this one chat and nobody
  -- else: a bot added to a group, or found by a stranger, gets silence rather than someone
  -- else's college agent.
  owner_chat_id text,

  -- 'connected' | 'error' | 'disconnected', plus the last error for the dashboard to show.
  state        text not null default 'disconnected',
  message      text,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  primary key (agent37_id, channel)
);

-- Service-role only. RLS on with NO policies, deliberately: the bot token and the webhook secret
-- live here, and the routes that touch them authenticate the student first. A leaked anon key
-- must reach nothing in this table.
alter table public.agent_channels enable row level security;
