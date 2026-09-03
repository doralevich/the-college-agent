import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

// Ported from ApolloClaw, where it runs in production.

// WhatsApp, through Meta's Cloud API.
//
// NOT DEVICE LINKING. The card used to promise Settings → Linked devices — scan a code and the
// agent answers on your own personal WhatsApp. That needs a process holding a socket open per
// student, which Vercel cannot do, and it leans on unofficial libraries Meta bans accounts for
// using. The Cloud API is Meta's own, it delivers over a webhook like everything else here, and
// the trade is honest: this is a dedicated business number for the agent, not the student's
// personal WhatsApp. David's call, made with that trade in front of him.

const GRAPH = "https://graph.facebook.com/v21.0";

class WhatsAppError extends Error {}

/**
 * Meta returns errors as { error: { message, type, code } } with a 4xx. The message is usually
 * written for a developer rather than a student, but it is specific, and specific beats a
 * sentence we invented.
 */
async function graph<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${GRAPH}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
      cache: "no-store",
    });
  } catch {
    throw new WhatsAppError("Couldn't reach WhatsApp. Try again in a moment.");
  }

  const data = (await res.json().catch(() => null)) as
    | ({ error?: { message?: string } } & T)
    | null;

  if (!res.ok || data?.error) {
    throw new WhatsAppError(
      data?.error?.message || `WhatsApp rejected the request (${res.status})`
    );
  }
  return data as T;
}

/**
 * Validates the token and the phone number id together, and tells us which number this is.
 *
 * Both have to be right for anything to work, and they fail in different ways — a bad token is a
 * 401, a phone number id from a different app is a 404. One call catches both at connect time
 * rather than at the first message.
 */
export async function getPhoneNumber(
  phoneNumberId: string,
  token: string
): Promise<{ display_phone_number?: string; verified_name?: string }> {
  return graph(
    `/${encodeURIComponent(phoneNumberId)}?fields=display_phone_number,verified_name`,
    token
  );
}

/**
 * Send the agent's answer back.
 *
 * Free-form text is only allowed inside 24 hours of the student's last message — outside that
 * window Meta requires a pre-approved template. Every send here is a reply to a message that just
 * arrived, so we are always inside the window. Worth knowing before anyone adds a "notify me
 * later" feature on top of this.
 */
export async function sendMessage(
  phoneNumberId: string,
  token: string,
  to: string,
  text: string
): Promise<void> {
  // Meta's limit is 4096 characters for a text body.
  const chunks = text.match(/[\s\S]{1,3900}/g) ?? [];
  for (const chunk of chunks) {
    await graph(`/${encodeURIComponent(phoneNumberId)}/messages`, token, {
      method: "POST",
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { body: chunk },
      }),
    });
  }
}

/**
 * Is this delivery really from Meta?
 *
 * X-Hub-Signature-256 is `sha256=` plus an HMAC of the RAW body under the app secret. As with
 * Slack, the bytes have to be the ones received — parse after verifying, never before.
 */
export function verifySignature(opts: {
  appSecret: string;
  signature: string | null;
  rawBody: string;
}): boolean {
  const { appSecret, signature, rawBody } = opts;
  if (!signature) return false;

  const expected = "sha256=" + createHmac("sha256", appSecret).update(rawBody).digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export { WhatsAppError };
