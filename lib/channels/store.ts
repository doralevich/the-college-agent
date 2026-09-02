import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptSecret, encryptForStorage } from "@/lib/crypto/byo";

// Reading and writing agent_channels.
//
// Service-role throughout, like every other agent-scoped table here: the caller has already
// passed requireAgentAccess, and RLS on this table has no policies precisely so that a leaked
// anon key reaches nothing.
//
// THE ONE RULE THIS FILE EXISTS TO ENFORCE: bot_token and secret go out to the browser NEVER.
// `toChannel` is the only thing routes should return, and it has no field for either of them to
// be forgotten in.

export type ChannelId = "telegram";
export type ChannelState = "connected" | "error" | "disconnected";

export interface ChannelRow {
  agent37_id: string;
  channel: string;
  bot_token: string | null;
  account: string | null;
  /** Telegram echoes this on every delivery; it's what authenticates the webhook. */
  secret: string | null;
  /** The agent session this channel talks in, so the thread continues across messages. */
  session_id: string | null;
  session_started_at: string | null;
  /** Bound on the first message. Anyone else talking to the bot is ignored. */
  owner_chat_id: string | null;
  state: string;
  message: string | null;
  updated_at: string | null;
}

/** The browser-safe view of a row. No credential, by construction. */
export interface Channel {
  channel: ChannelId;
  state: ChannelState;
  account: string | null;
  message: string | null;
  /** Whether a student has actually messaged the bot yet — until then there is no address. */
  linked: boolean;
  updatedAt: number | null;
}

export function toChannel(row: ChannelRow): Channel {
  return {
    channel: row.channel as ChannelId,
    state: (row.state as ChannelState) || "disconnected",
    account: row.account,
    message: row.message,
    linked: Boolean(row.owner_chat_id),
    updatedAt: row.updated_at ? Date.parse(row.updated_at) : null,
  };
}

export async function getChannelRow(
  agentId: string,
  channel: ChannelId
): Promise<ChannelRow | null> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("agent_channels")
    .select("*")
    .eq("agent37_id", agentId)
    .eq("channel", channel)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as ChannelRow) ?? null;
}

export interface ChannelConfig {
  token: string;
  secret: string | null;
  ownerChatId: string | null;
  sessionId: string | null;
  sessionStartedAt: number | null;
  updatedAt: number | null;
}

/**
 * Everything the webhook and the scheduler need to actually talk, credentials included.
 *
 * Server-only by construction: it returns the decrypted bot token, so it must never be handed to
 * a route that serialises its result. Returns null when the channel isn't usable — no row, or no
 * token — so callers can treat "not connected" as one case.
 */
export async function getChannelConfig(
  agentId: string,
  channel: ChannelId
): Promise<ChannelConfig | null> {
  const row = await getChannelRow(agentId, channel);
  if (!row) return null;
  const token = decryptSecret(row.bot_token);
  if (!token) return null;
  return {
    token,
    secret: decryptSecret(row.secret),
    ownerChatId: row.owner_chat_id,
    sessionId: row.session_id,
    sessionStartedAt: row.session_started_at ? Date.parse(row.session_started_at) : null,
    updatedAt: row.updated_at ? Date.parse(row.updated_at) : null,
  };
}

export interface ChannelPatch {
  botToken?: string | null;
  account?: string | null;
  secret?: string | null;
  sessionId?: string | null;
  sessionStartedAt?: string | null;
  ownerChatId?: string | null;
  state?: ChannelState;
  message?: string | null;
}

/**
 * Create or update one channel row, touching only the fields given.
 *
 * A partial patch rather than a whole row on purpose: the webhook updates `session_id` on almost
 * every message and `owner_chat_id` exactly once, and neither should have to re-supply the bot
 * token — which would mean decrypting and re-encrypting a credential for no reason.
 */
export async function upsertChannel(
  agentId: string,
  channel: ChannelId,
  patch: ChannelPatch
): Promise<void> {
  const db = createAdminClient();
  const row: Record<string, unknown> = {
    agent37_id: agentId,
    channel,
    updated_at: new Date().toISOString(),
  };
  // Secrets are encrypted on the way in. encryptForStorage passes plaintext through until
  // BYO_ENC_KEY is set, so this is safe before that env var exists.
  if (patch.botToken !== undefined) row.bot_token = encryptForStorage(patch.botToken);
  if (patch.secret !== undefined) row.secret = encryptForStorage(patch.secret);
  if (patch.account !== undefined) row.account = patch.account;
  if (patch.sessionId !== undefined) row.session_id = patch.sessionId;
  if (patch.sessionStartedAt !== undefined) row.session_started_at = patch.sessionStartedAt;
  if (patch.ownerChatId !== undefined) row.owner_chat_id = patch.ownerChatId;
  if (patch.state !== undefined) row.state = patch.state;
  if (patch.message !== undefined) row.message = patch.message;

  const { error } = await db
    .from("agent_channels")
    .upsert(row, { onConflict: "agent37_id,channel" });
  if (error) throw new Error(error.message);
}

export async function deleteChannel(agentId: string, channel: ChannelId): Promise<void> {
  const db = createAdminClient();
  const { error } = await db
    .from("agent_channels")
    .delete()
    .eq("agent37_id", agentId)
    .eq("channel", channel);
  if (error) throw new Error(error.message);
}
