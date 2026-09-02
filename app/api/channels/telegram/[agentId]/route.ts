import { after } from "next/server";
import { timingSafeEqual } from "crypto";
import * as telegram from "@/lib/channels/telegram";
import { getChannelConfig, upsertChannel } from "@/lib/channels/store";
import { answerFrom, incompleteReason, runTurn, sessionToContinue } from "@/lib/channels/turn";

type Ctx = { params: Promise<{ agentId: string }> };

// Telegram delivers here. One agent per URL.
//
// This is the whole channel: Telegram POSTs an update, we run a turn on the instance, and we send
// the answer back. NOTHING RUNS ON THE INSTANCE to make this work, which is the point — once the
// College Agent provisions from the Apollo (OpenClaw) template there is no Hermes gateway on the
// box to poll Telegram, and this keeps working regardless.
//
// PUBLIC BY NECESSITY. Telegram will not attach a credential, and this path is deliberately
// outside proxy.ts's auth matcher. Three things stand in for authentication:
//
//   1. The `secret_token` Telegram echoes in X-Telegram-Bot-Api-Secret-Token, compared in
//      constant time against the one generated at connect. Anyone can POST here; only Telegram
//      knows this.
//   2. The agent id in the URL has to name a channel that exists.
//   3. The first message binds an owner, and every later message from anyone else is dropped.
//
// Telegram is answered IMMEDIATELY and the turn runs in `after`. Telegram retries a delivery it
// considers failed, and an agent turn takes far longer than it is willing to wait — without this
// a slow answer becomes three copies of the same question.

// An agent turn is not a web request. The work is in `after`, so the worst case of a lower
// platform cap is a truncated turn rather than a duplicated one.
export const maxDuration = 300;

function secretMatches(sent: string | null, expected: string | null): boolean {
  if (!expected || !sent) return false;
  const a = Buffer.from(sent);
  const b = Buffer.from(expected);
  // timingSafeEqual throws on a length mismatch, which is itself a leak of length — check it
  // first and return the same false either way.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Pull the parts we care about out of a Telegram update. Anything else is ignored. */
function readUpdate(body: unknown): { chatId: string; text: string } | null {
  const message = (body as { message?: Record<string, unknown> } | null)?.message;
  if (!message) return null;
  const chat = message.chat as { id?: number | string } | undefined;
  const text = message.text;
  if (!chat?.id || typeof text !== "string" || !text.trim()) return null;
  return { chatId: String(chat.id), text: text.trim() };
}

export async function POST(request: Request, { params }: Ctx) {
  const { agentId } = await params;

  // Everything below answers 200 regardless. Telegram treats a non-2xx as a failed delivery and
  // retries it, and there is nothing here worth retrying — a wrong secret stays wrong.
  const ok = () => new Response("ok", { status: 200 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return ok();
  }

  const config = await getChannelConfig(agentId, "telegram").catch(() => null);
  if (!config) return ok();

  if (!secretMatches(request.headers.get("x-telegram-bot-api-secret-token"), config.secret)) {
    console.warn("[channels:telegram] rejected delivery with bad secret", { agentId });
    return ok();
  }

  const update = readUpdate(body);
  if (!update) return ok();

  // First message binds the owner. After that this agent answers one person and nobody else. A
  // bot added to a group, or found by a stranger, gets silence rather than someone else's
  // college agent — which would be handing out a student's schedule, grades and deadlines.
  if (config.ownerChatId && config.ownerChatId !== update.chatId) {
    return ok();
  }

  after(async () => {
    try {
      if (!config.ownerChatId) {
        await upsertChannel(agentId, "telegram", {
          ownerChatId: update.chatId,
          state: "connected",
          message: null,
        });
      }

      await telegram.sendTyping(config.token, update.chatId);

      const result = await runTurn(
        agentId,
        update.text,
        sessionToContinue(config.sessionId, config.updatedAt, config.sessionStartedAt)
      );

      // Remember the session so the next message continues the same conversation instead of
      // starting a fresh one that knows nothing about the last. A changed id means a fresh
      // session opened, so stamp its start time for the age cap in sessionToContinue.
      if (result.session_id && result.session_id !== config.sessionId) {
        await upsertChannel(agentId, "telegram", {
          sessionId: result.session_id,
          sessionStartedAt: new Date().toISOString(),
          state: "connected",
          message: null,
        });
      }

      // A turn can come back 200 yet carry no answer — status not "completed", or completed with
      // empty text, and no error to explain it. The student still gets a reply, but WHY would be
      // invisible: the fallback swallows it. Record the reason on the channel so a repeated
      // failure is a fact in the row rather than a guess.
      const reason = incompleteReason(result);
      if (reason) {
        console.error("[channels:telegram] turn produced no answer", { agentId, reason });
        await upsertChannel(agentId, "telegram", {
          state: "error",
          message: `no answer: ${reason}`,
        }).catch(() => {});
      }

      await telegram.sendMessage(config.token, update.chatId, answerFrom(result));
    } catch (e) {
      const message = (e as Error).message;
      console.error("[channels:telegram] turn failed", { agentId, message });
      // Say something rather than going quiet. Silence from a chat app is indistinguishable from
      // a broken product, and the student can't see our logs.
      await telegram
        .sendMessage(config.token, update.chatId, "Sorry — something went wrong on my end.")
        .catch(() => {});
      await upsertChannel(agentId, "telegram", { state: "error", message }).catch(() => {});
    }
  });

  return ok();
}
