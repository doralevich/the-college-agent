import "server-only";
import { randomBytes } from "crypto";
import * as telegram from "@/lib/channels/telegram";
import * as slack from "@/lib/channels/slack";
import * as whatsapp from "@/lib/channels/whatsapp";
import {
  deleteChannel,
  getChannelConfig,
  getChannelRow,
  listChannels,
  toChannel,
  upsertChannel,
  type Channel,
} from "@/lib/channels/store";
import { channelDef, type ChannelId } from "@/config/channels";
import { publicSiteOrigin } from "@/lib/site-url";
import { ApiError } from "@/lib/http";

// Connecting and disconnecting a student's chat app.
//
// The old Telegram design put the bot token on the INSTANCE and let the Hermes gateway poll.
// That only works while every box runs Hermes: an OpenClaw box has no Hermes gateway, so a
// student messaging their bot would get silence. Every channel now delivers to a webhook in
// this app instead, which runs a turn and sends the reply back - so all three work on any
// runtime, and there is one shape to reason about rather than three.
//
// EVERY CONNECT VALIDATES THE CREDENTIAL WITH THE PROVIDER FIRST. A typo'd token that is stored
// and only fails at the first message is a support ticket a day later; failing here is a
// sentence on the form.

/** Where a provider posts updates for one agent. Absolute, because they need a real URL. */
export function channelWebhookUrl(channel: ChannelId, agentId: string): string {
  return `${publicSiteOrigin()}/api/channels/${channel}/${encodeURIComponent(agentId)}`;
}

export interface ConnectInput {
  botToken?: string;
  signingSecret?: string;
  accessToken?: string;
  phoneNumberId?: string;
  appSecret?: string;
}

function required(value: string | undefined, label: string): string {
  const v = (value ?? "").trim();
  if (!v) throw new ApiError(400, "invalid_request", `${label} is required.`);
  return v;
}

async function connectTelegram(agentId: string, input: ConnectInput): Promise<void> {
  const botToken = required(input.botToken, "Bot token");

  let me: { username?: string; first_name?: string };
  try {
    me = await telegram.getMe(botToken);
  } catch (e) {
    throw new ApiError(400, "invalid_token", (e as Error).message);
  }

  // The webhook URL is public and contains a guessable agent id, so the secret_token Telegram
  // echoes on every delivery is what actually authenticates one. 32 random bytes, never shown.
  const secret = randomBytes(32).toString("hex");
  try {
    await telegram.setWebhook(botToken, channelWebhookUrl("telegram", agentId), { secret });
  } catch (e) {
    throw new ApiError(400, "webhook_failed", (e as Error).message);
  }

  await upsertChannel(agentId, "telegram", {
    botToken,
    secret,
    account: me.username ? `@${me.username}` : (me.first_name ?? null),
    externalId: null,
    verifyToken: null,
    // A fresh connection has no owner and no thread. Cleared explicitly rather than left over
    // from a previous one, which would bind the new bot to the old person's chat.
    ownerChatId: null,
    sessionId: null,
    sessionStartedAt: null,
    state: "connected",
    message: null,
  });
}

async function connectSlack(agentId: string, input: ConnectInput): Promise<void> {
  const botToken = required(input.botToken, "Bot token");
  const signingSecret = required(input.signingSecret, "Signing secret");

  let auth: { team?: string; user?: string };
  try {
    auth = await slack.authTest(botToken);
  } catch (e) {
    throw new ApiError(400, "invalid_token", (e as Error).message);
  }

  // Slack has no setWebhook equivalent - the student pastes the Request URL into the app's
  // Event Subscriptions themselves, which is why the card shows it. The signing secret takes
  // the place of Telegram's secret_token: it is what proves a delivery is really Slack's.
  await upsertChannel(agentId, "slack", {
    botToken,
    secret: signingSecret,
    account: [auth.team, auth.user].filter(Boolean).join(" · ") || null,
    externalId: null,
    verifyToken: null,
    ownerChatId: null,
    sessionId: null,
    sessionStartedAt: null,
    state: "connected",
    message: null,
  });
}

async function connectWhatsApp(agentId: string, input: ConnectInput): Promise<void> {
  const accessToken = required(input.accessToken, "Access token");
  const phoneNumberId = required(input.phoneNumberId, "Phone number ID");
  const appSecret = required(input.appSecret, "App secret");

  // Token and phone number id fail in different ways - a bad token is a 401, a phone number id
  // from another app is a 404 - and both have to be right for anything to work. One call here
  // catches either, at connect time rather than at the first message.
  let number: { display_phone_number?: string; verified_name?: string };
  try {
    number = await whatsapp.getPhoneNumber(phoneNumberId, accessToken);
  } catch (e) {
    throw new ApiError(400, "invalid_token", (e as Error).message);
  }

  await upsertChannel(agentId, "whatsapp", {
    botToken: accessToken,
    secret: appSecret,
    externalId: phoneNumberId,
    // Meta asks the student to paste this into its console, so unlike every other credential
    // here it has to be readable back. Generated rather than chosen, so it is not a password
    // they reuse.
    verifyToken: randomBytes(16).toString("hex"),
    account:
      [number.verified_name, number.display_phone_number].filter(Boolean).join(" · ") || null,
    ownerChatId: null,
    sessionId: null,
    sessionStartedAt: null,
    state: "connected",
    message: null,
  });
}

export async function connectChannel(
  agentId: string,
  channel: ChannelId,
  input: ConnectInput
): Promise<Channel> {
  if (!channelDef(channel)) throw new ApiError(400, "invalid_request", "Unknown channel.");

  if (channel === "telegram") await connectTelegram(agentId, input);
  else if (channel === "slack") await connectSlack(agentId, input);
  else await connectWhatsApp(agentId, input);

  const row = await getChannelRow(agentId, channel);
  if (!row) throw new ApiError(500, "db_error", "Channel did not save.");
  return toChannel(row);
}

/**
 * Disconnect: stop delivery where the provider supports it, then forget the credential.
 *
 * Webhook removal is best-effort and Telegram-only - Slack and Meta have no API for it, so
 * their deliveries stop being answered rather than stopping. If the provider is unreachable or
 * the token was already revoked we still drop our row: leaving a student unable to disconnect
 * because a third party is down is the worse failure, and a delivery for an agent with no
 * channel row is answered and ignored.
 */
export async function disconnectChannel(agentId: string, channel: ChannelId): Promise<void> {
  if (channel === "telegram") {
    const config = await getChannelConfig(agentId, "telegram").catch(() => null);
    if (config?.token) await telegram.deleteWebhook(config.token).catch(() => {});
  }
  await deleteChannel(agentId, channel);
}

/** Every channel for this agent, browser-safe. */
export async function getChannels(agentId: string): Promise<Channel[]> {
  return listChannels(agentId);
}
