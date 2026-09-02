import { requireAgentAccess } from "@/lib/auth";
import { connectTelegram, disconnectTelegram, getTelegramChannel } from "@/lib/channels/connect";
import { json, readJson, route } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

// The student's own control over their Telegram connection.
//
// Under /api/agents/*, so proxy.ts authenticates it and requireAgentAccess enforces that this
// student owns THIS agent — the ownership gate every per-agent route shares. The public webhook
// that Telegram itself posts to lives at /api/channels/telegram/{agentId} and is a different
// thing entirely, guarded by the secret rather than by a session.
//
// Nothing here ever returns the bot token or the webhook secret: every response goes through
// toChannel(), which has no field for either.

/** Current state, so the dashboard can show connected / not / errored. */
export const GET = route(async (_request: Request, { params }: Ctx) => {
  const { id } = await params;
  await requireAgentAccess(id, "member");
  return json({ channel: await getTelegramChannel(id) });
});

/** Connect: validate the token with Telegram, register the webhook, store the credential. */
export const POST = route(async (request: Request, { params }: Ctx) => {
  const { id } = await params;
  await requireAgentAccess(id, "member");
  const body = await readJson<{ botToken?: string }>(request);
  const channel = await connectTelegram(id, { botToken: body.botToken ?? "" });
  return json({ channel });
});

/** Disconnect: stop Telegram delivering, then forget the credential. */
export const DELETE = route(async (_request: Request, { params }: Ctx) => {
  const { id } = await params;
  await requireAgentAccess(id, "member");
  await disconnectTelegram(id);
  return json({ ok: true });
});
