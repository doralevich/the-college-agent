import { after } from "next/server";
import * as slack from "@/lib/channels/slack";
import { getChannelConfig, upsertChannel } from "@/lib/channels/store";
import { answerFrom, incompleteReason, runTurn, sessionToContinue } from "@/lib/channels/turn";

type Ctx = { params: Promise<{ agentId: string }> };

// Slack delivers here. One agent per URL.
//
// PUBLIC BY NECESSITY, and outside proxy.ts's auth matcher on purpose. What stands in for a
// session is Slack's own signature over the RAW body, checked before anything is parsed.
//
// Slack retries a delivery it considers failed, and an agent turn takes far longer than the 3
// seconds it waits - so it is answered IMMEDIATELY and the turn runs in `after`. Without that,
// one slow answer becomes three copies of the same question.
export const maxDuration = 300;

export async function POST(request: Request, { params }: Ctx) {
  const { agentId } = await params;
  const ok = () => new Response("ok", { status: 200 });

  // The RAW bytes, because the signature is over exactly what was sent. Parsing and
  // re-serialising changes them and the check would fail for every honest request.
  const rawBody = await request.text().catch(() => "");
  if (!rawBody) return ok();

  const config = await getChannelConfig(agentId, "slack").catch(() => null);
  if (!config?.secret) return ok();

  if (
    !slack.verifySignature({
      signingSecret: config.secret,
      signature: request.headers.get("x-slack-signature"),
      timestamp: request.headers.get("x-slack-request-timestamp"),
      rawBody,
    })
  ) {
    console.warn("[channels:slack] rejected delivery with bad signature", { agentId });
    return ok();
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return ok();
  }

  // The one-time handshake when the student pastes the Request URL into Slack. Answering the
  // challenge is what turns their Event Subscriptions box green.
  if (body.type === "url_verification" && typeof body.challenge === "string") {
    return new Response(body.challenge, {
      status: 200,
      headers: { "content-type": "text/plain" },
    });
  }

  const event = body.event as Record<string, unknown> | undefined;
  if (!event || event.type !== "message") return ok();
  // Ignore the agent's own messages, edits and deletions, and anything from another bot -
  // without this the app answers itself in a loop.
  if (event.bot_id || event.subtype) return ok();
  // DMs only. `message.im` is the only event subscribed, but a workspace can be configured to
  // send more, and an agent answering in a public channel would leak a student's schedule.
  if (event.channel_type !== "im") return ok();

  const text = typeof event.text === "string" ? event.text.trim() : "";
  const channelId = typeof event.channel === "string" ? event.channel : "";
  const user = typeof event.user === "string" ? event.user : "";
  if (!text || !channelId || !user) return ok();

  // First DM binds the owner. After that this agent answers one person and nobody else in the
  // workspace - a colleague who finds the app gets silence rather than someone's grades.
  if (config.ownerChatId && config.ownerChatId !== user) return ok();

  after(async () => {
    try {
      if (!config.ownerChatId) {
        await upsertChannel(agentId, "slack", {
          ownerChatId: user,
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
        await upsertChannel(agentId, "slack", {
          sessionId: result.session_id,
          sessionStartedAt: new Date().toISOString(),
          state: "connected",
          message: null,
        });
      }

      const reason = incompleteReason(result);
      if (reason) {
        console.error("[channels:slack] turn produced no answer", { agentId, reason });
        await upsertChannel(agentId, "slack", {
          state: "error",
          message: `no answer: ${reason}`,
        }).catch(() => {});
      }

      // Reply into the conversation it came from, not the user id: a DM's channel is its own id.
      await slack.postMessage(config.token, channelId, answerFrom(result));
    } catch (e) {
      const message = (e as Error).message;
      console.error("[channels:slack] turn failed", { agentId, message });
      await slack
        .postMessage(config.token, channelId, "Sorry — something went wrong on my end.")
        .catch(() => {});
      await upsertChannel(agentId, "slack", { state: "error", message }).catch(() => {});
    }
  });

  return ok();
}
