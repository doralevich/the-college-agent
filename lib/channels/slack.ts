import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

// Ported from ApolloClaw, where it runs in production.

// Slack's Web API and request signing, the parts a channel needs.
//
// NOT SOCKET MODE. The setup copy used to say to turn Socket Mode on, which needs a process
// holding a WebSocket open — there is nothing on Vercel to hold one. The Events API does the same
// job the way Telegram does: Slack POSTs to a URL. That is the whole reason Slack is buildable
// here at all, and why the instructions on the card changed.

const API = "https://slack.com/api";

class SlackError extends Error {}

async function call<T>(token: string, method: string, body?: Record<string, unknown>): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API}/${method}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(body ?? {}),
      cache: "no-store",
    });
  } catch {
    throw new SlackError("Couldn't reach Slack. Try again in a moment.");
  }

  // Slack answers 200 with { ok: false, error } for application errors — the HTTP status says
  // almost nothing, so branch on `ok`.
  const data = (await res.json().catch(() => null)) as ({ ok: boolean; error?: string } & T) | null;
  if (!data?.ok) {
    throw new SlackError(slackErrorText(data?.error) || `Slack rejected the request (${res.status})`);
  }
  return data;
}

/**
 * Slack's error codes are terse identifiers. The common ones get a sentence a student can act
 * on; anything else falls through as-is, which is still better than inventing a guess.
 */
function slackErrorText(code?: string): string | null {
  if (!code) return null;
  switch (code) {
    case "invalid_auth":
    case "not_authed":
      return "That bot token isn't valid. Check you copied the one starting xoxb- from OAuth & Permissions.";
    case "account_inactive":
      return "That token belongs to a deactivated app. Reinstall the app in your workspace and copy the new token.";
    case "missing_scope":
      return "The app is missing a permission. Add the chat:write and im:history scopes, reinstall it, then copy the new token.";
    case "channel_not_found":
      return "Slack wouldn't accept the conversation this message came from.";
    default:
      return code;
  }
}

/** Validates the token and tells us which workspace and bot it belongs to. */
export async function authTest(
  token: string
): Promise<{ team?: string; user?: string; bot_id?: string; user_id?: string }> {
  return call(token, "auth.test");
}

/** Send the agent's answer back to the conversation it came from. */
export async function postMessage(token: string, channel: string, text: string): Promise<void> {
  // Slack's practical limit is 4000 characters per message; longer text is silently truncated
  // rather than rejected, which is worse than splitting it ourselves.
  const chunks = text.match(/[\s\S]{1,3800}/g) ?? [];
  for (const chunk of chunks) {
    await call(token, "chat.postMessage", { channel, text: chunk });
  }
}

/**
 * Is this request really from Slack?
 *
 * Slack signs the RAW body with the app's signing secret: v0=HMAC-SHA256 over
 * `v0:{timestamp}:{body}`. The body has to be the exact bytes received — parsing and
 * re-serialising changes them and the signature stops matching, which is why the route reads
 * text() first and parses afterwards.
 *
 * The timestamp check is what stops a captured request being replayed later; Slack's own
 * guidance is five minutes.
 */
export function verifySignature(opts: {
  signingSecret: string;
  signature: string | null;
  timestamp: string | null;
  rawBody: string;
}): boolean {
  const { signingSecret, signature, timestamp, rawBody } = opts;
  if (!signature || !timestamp) return false;

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 60 * 5) return false;

  const expected =
    "v0=" + createHmac("sha256", signingSecret).update(`v0:${timestamp}:${rawBody}`).digest("hex");

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export { SlackError };
