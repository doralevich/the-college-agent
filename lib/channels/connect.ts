import "server-only";
import { randomBytes } from "crypto";
import * as telegram from "@/lib/channels/telegram";
import {
  deleteChannel,
  getChannelConfig,
  getChannelRow,
  toChannel,
  upsertChannel,
  type Channel,
} from "@/lib/channels/store";
import { publicSiteOrigin } from "@/lib/site-url";
import { ApiError } from "@/lib/http";

// Connecting and disconnecting a student's Telegram bot.
//
// The old design put the bot token on the INSTANCE and let the Hermes gateway poll Telegram.
// That only works while every box runs Hermes: an OpenClaw box has no Hermes gateway, so a
// student messaging their bot would get silence. Telegram now delivers to us instead —
// /api/channels/telegram/{agentId} — and that route runs a turn and sends the reply back. Both
// ends are ours, so it works on any runtime.
//
// It also drops a setup step. The old flow needed the student's numeric Telegram user id, found
// by messaging a third-party bot. Here the first message they send binds their chat id
// automatically: they paste a bot token and that is the whole setup.

/** Where Telegram posts updates for one agent. Absolute, because Telegram needs a real URL. */
export function telegramWebhookUrl(agentId: string): string {
  return `${publicSiteOrigin()}/api/channels/telegram/${encodeURIComponent(agentId)}`;
}

/**
 * Connect Telegram: validate the token, register our webhook, remember the credential.
 *
 * The URL is public and guessable — it has an agent id in it — so it is the `secret_token` that
 * actually protects the endpoint. Telegram echoes it on every delivery in a header, and the
 * receiver rejects anything without it. 32 random bytes, generated here and never shown to
 * anyone, including the student.
 */
export async function connectTelegram(
  agentId: string,
  credentials: { botToken: string }
): Promise<Channel> {
  const botToken = credentials.botToken.trim();
  if (!botToken) throw new ApiError(400, "invalid_request", "Paste your bot token first.");

  // Validate FIRST, so a typo'd token fails before anything is stored or registered.
  let me: { username?: string; first_name?: string };
  try {
    me = await telegram.getMe(botToken);
  } catch (e) {
    throw new ApiError(400, "invalid_token", (e as Error).message);
  }

  const secret = randomBytes(32).toString("hex");
  const url = telegramWebhookUrl(agentId);

  try {
    await telegram.setWebhook(botToken, url, { secret });
  } catch (e) {
    throw new ApiError(400, "webhook_failed", (e as Error).message);
  }

  await upsertChannel(agentId, "telegram", {
    botToken,
    secret,
    account: me.username ? `@${me.username}` : (me.first_name ?? null),
    // A fresh connection has no owner and no thread yet. Cleared explicitly rather than left
    // over from a previous connection, which would bind the new bot to the old person's chat.
    ownerChatId: null,
    sessionId: null,
    sessionStartedAt: null,
    state: "connected",
    message: null,
  });

  const row = await getChannelRow(agentId, "telegram");
  if (!row) throw new ApiError(500, "db_error", "Channel did not save.");
  return toChannel(row);
}

/**
 * Disconnect: stop Telegram delivering, then forget the credential.
 *
 * Webhook removal is best-effort. If Telegram is unreachable or the token has already been
 * revoked in BotFather we still drop our row — leaving a student unable to disconnect because a
 * third party is down would be the worse failure, and a webhook pointing at an agent with no
 * channel row is answered and ignored.
 */
export async function disconnectTelegram(agentId: string): Promise<void> {
  const config = await getChannelConfig(agentId, "telegram").catch(() => null);
  if (config?.token) {
    await telegram.deleteWebhook(config.token).catch(() => {});
  }
  await deleteChannel(agentId, "telegram");
}

/** The browser-safe view of this agent's Telegram channel, or null when never connected. */
export async function getTelegramChannel(agentId: string): Promise<Channel | null> {
  const row = await getChannelRow(agentId, "telegram");
  return row ? toChannel(row) : null;
}
