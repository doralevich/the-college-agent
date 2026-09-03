import { after } from "next/server";
import * as whatsapp from "@/lib/channels/whatsapp";
import { getChannelConfig, upsertChannel } from "@/lib/channels/store";
import { answerFrom, incompleteReason, runTurn, sessionToContinue } from "@/lib/channels/turn";

type Ctx = { params: Promise<{ agentId: string }> };

// Meta delivers here. One agent per URL.
//
// PUBLIC BY NECESSITY, and outside proxy.ts's auth matcher on purpose. What stands in for a
// session is Meta's X-Hub-Signature-256 over the RAW body, checked before anything is parsed.
//
// Meta retries a delivery it considers failed, so it is answered IMMEDIATELY and the turn runs
// in `after`.
export const maxDuration = 300;

/**
 * The one-time handshake, when the student saves the callback URL in Meta's console.
 *
 * Meta GETs with hub.challenge and the verify token they pasted; echoing the challenge back is
 * what makes the webhook save. This is the only reason verify_token is readable by the student.
 */
export async function GET(request: Request, { params }: Ctx) {
  const { agentId } = await params;
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const config = await getChannelConfig(agentId, "whatsapp").catch(() => null);
  if (mode === "subscribe" && challenge && config?.verifyToken && token === config.verifyToken) {
    return new Response(challenge, { status: 200, headers: { "content-type": "text/plain" } });
  }
  // 403 here on purpose, unlike every other path in this file: Meta shows the student a clear
  // "could not validate" in its console, which is what tells them the token is wrong.
  return new Response("forbidden", { status: 403 });
}

export async function POST(request: Request, { params }: Ctx) {
  const { agentId } = await params;
  const ok = () => new Response("ok", { status: 200 });

  const rawBody = await request.text().catch(() => "");
  if (!rawBody) return ok();

  const config = await getChannelConfig(agentId, "whatsapp").catch(() => null);
  if (!config?.secret || !config.externalId) return ok();

  if (
    !whatsapp.verifySignature({
      appSecret: config.secret,
      signature: request.headers.get("x-hub-signature-256"),
      rawBody,
    })
  ) {
    console.warn("[channels:whatsapp] rejected delivery with bad signature", { agentId });
    return ok();
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return ok();
  }

  // Meta nests the interesting part four levels down, and sends status callbacks (delivered,
  // read) through the same webhook - those have `statuses` instead of `messages` and must be
  // ignored, or the agent answers its own delivery receipts.
  const entry = (body.entry as Record<string, unknown>[] | undefined)?.[0];
  const change = (entry?.changes as Record<string, unknown>[] | undefined)?.[0];
  const value = change?.value as Record<string, unknown> | undefined;
  const message = (value?.messages as Record<string, unknown>[] | undefined)?.[0];
  if (!message) return ok();

  const from = typeof message.from === "string" ? message.from : "";
  const text =
    typeof (message.text as { body?: unknown } | undefined)?.body === "string"
      ? ((message.text as { body: string }).body ?? "").trim()
      : "";
  if (!from || !text) return ok();

  // First number to message binds the owner; everyone else gets silence.
  if (config.ownerChatId && config.ownerChatId !== from) return ok();

  after(async () => {
    try {
      if (!config.ownerChatId) {
        await upsertChannel(agentId, "whatsapp", {
          ownerChatId: from,
          state: "connected",
          message: null,
        });
      }

      const result = await runTurn(
        agentId,
        text,
        sessionToContinue(config.sessionId, config.updatedAt, config.sessionStartedAt)
      );

      if (result.session_id && result.session_id !== config.sessionId) {
        await upsertChannel(agentId, "whatsapp", {
          sessionId: result.session_id,
          sessionStartedAt: new Date().toISOString(),
          state: "connected",
          message: null,
        });
      }

      const reason = incompleteReason(result);
      if (reason) {
        console.error("[channels:whatsapp] turn produced no answer", { agentId, reason });
        await upsertChannel(agentId, "whatsapp", {
          state: "error",
          message: `no answer: ${reason}`,
        }).catch(() => {});
      }

      await whatsapp.sendMessage(config.externalId!, config.token, from, answerFrom(result));
    } catch (e) {
      const msg = (e as Error).message;
      console.error("[channels:whatsapp] turn failed", { agentId, message: msg });
      await whatsapp
        .sendMessage(config.externalId!, config.token, from, "Sorry — something went wrong on my end.")
        .catch(() => {});
      await upsertChannel(agentId, "whatsapp", { state: "error", message: msg }).catch(() => {});
    }
  });

  return ok();
}
