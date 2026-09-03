import { requireAgentAccess } from "@/lib/auth";
import {
  channelWebhookUrl,
  connectChannel,
  disconnectChannel,
  getChannels,
  type ConnectInput,
} from "@/lib/channels/connect";
import { isChannelId } from "@/config/channels";
import { ApiError, json, readJson, route } from "@/lib/http";

type Ctx = { params: Promise<{ id: string; channel: string }> };

// A student's control over one chat app. One route for all three: the channels differ in which
// credentials they take, and that difference lives in config/channels.ts, not here.
//
// Under /api/agents/*, so proxy.ts authenticates it and requireAgentAccess enforces that this
// student owns THIS agent. The PUBLIC webhooks the providers post to live at
// /api/channels/{channel}/{agentId} and are a different thing entirely, guarded by a signature
// rather than a session.
//
// Nothing here ever returns a bot token or a signing secret: every response goes through
// toChannel(), which has no field for them. WhatsApp's verify token is the one exception, and
// deliberately so - Meta's console asks the student for it.

async function resolve(params: Ctx["params"]) {
  const { id, channel } = await params;
  if (!isChannelId(channel)) throw new ApiError(404, "not_found", "Unknown channel.");
  await requireAgentAccess(id, "member");
  return { id, channel };
}

/** Current state of every channel, plus this one's webhook URL for the cards that show it. */
export const GET = route(async (_request: Request, { params }: Ctx) => {
  const { id, channel } = await resolve(params);
  return json({
    channels: await getChannels(id),
    webhookUrl: channelWebhookUrl(channel, id),
  });
});

export const POST = route(async (request: Request, { params }: Ctx) => {
  const { id, channel } = await resolve(params);
  const body = await readJson<ConnectInput>(request);
  const connected = await connectChannel(id, channel, body);
  return json({ channel: connected, webhookUrl: channelWebhookUrl(channel, id) });
});

export const DELETE = route(async (_request: Request, { params }: Ctx) => {
  const { id, channel } = await resolve(params);
  await disconnectChannel(id, channel);
  return json({ ok: true });
});
