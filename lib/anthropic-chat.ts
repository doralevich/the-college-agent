import Anthropic from "@anthropic-ai/sdk";

// Shared brain for the public marketing chats (/api/ask and /api/demo/chat). Both were
// failing opaquely with a generic "I hit a snag" whenever the Anthropic call threw, giving
// no way to tell an expired key from a missing model grant from an empty credit balance.
//
// This wrapper does two things:
//   1. Tries the primary model, and on a problem that a DIFFERENT model could fix
//      (model not found / not granted / upstream overloaded), transparently retries on a
//      broadly-available fallback model, so the widget keeps working even if the account
//      hasn't been granted the newest model.
//   2. Categorizes the failure and logs a single, precise line (status + type) so the real
//      cause is obvious in the server logs instead of a bare stack trace.

const PRIMARY_MODEL = "claude-opus-4-8";
const FALLBACK_MODEL = "claude-sonnet-5";

export type ChatErrorCategory =
  | "auth" // 401 — key missing/expired/invalid
  | "permission" // 403 — key lacks access (possibly to the model)
  | "not_found" // 404 — model not available to this account
  | "credits" // 402 / billing — out of credits
  | "rate_limit" // 429
  | "overloaded" // 500 / 503 / 529 — upstream trouble
  | "bad_request" // 400
  | "unknown";

export type ChatResult =
  | { ok: true; reply: string; model: string; usage?: Anthropic.Usage }
  | { ok: false; status: number; category: ChatErrorCategory; detail: string };

type MinimalMessage = { role: "user" | "assistant"; content: string };

function categorize(status: number, type?: string): ChatErrorCategory {
  if (status === 401) return "auth";
  if (status === 403) return "permission";
  if (status === 404) return "not_found";
  if (status === 402) return "credits";
  if (status === 429) return "rate_limit";
  if (status === 500 || status === 503 || status === 529) return "overloaded";
  if (status === 400) return "bad_request";
  if (type && /credit|billing|quota|payment/i.test(type)) return "credits";
  return "unknown";
}

// A different model can only rescue these; auth/credits/rate/bad-request would fail the same
// way on any model, so we stop and surface them instead of doubling latency.
function worthFallback(category: ChatErrorCategory): boolean {
  return category === "not_found" || category === "permission" || category === "overloaded";
}

export async function chatComplete(
  apiKey: string,
  opts: { system: string; messages: MinimalMessage[]; maxTokens: number; tag?: string }
): Promise<ChatResult> {
  const client = new Anthropic({ apiKey });
  const tag = opts.tag ?? "chat";
  const chain = [PRIMARY_MODEL, FALLBACK_MODEL];
  let last: { status: number; category: ChatErrorCategory; detail: string } | null = null;

  for (let i = 0; i < chain.length; i++) {
    const model = chain[i];
    try {
      const res = await client.messages.create({
        model,
        max_tokens: opts.maxTokens,
        system: opts.system,
        messages: opts.messages,
      });
      const reply = res.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("")
        .trim();
      if (i > 0) console.warn(`[${tag}] served by fallback model ${model} (primary ${PRIMARY_MODEL} unavailable)`);
      return { ok: true, reply, model, usage: res.usage };
    } catch (e) {
      const err = e as { status?: number; error?: { error?: { type?: string }; type?: string }; message?: string };
      const status = typeof err.status === "number" ? err.status : 0;
      const type = err.error?.error?.type ?? err.error?.type;
      const category = categorize(status, type);
      const detail = [status || "?", type, err.message].filter(Boolean).join(" ").trim();
      console.error(`[${tag}] ${model} failed: status=${status || "?"} type=${type ?? "?"} category=${category} :: ${err.message ?? ""}`);
      last = { status: status || 502, category, detail };
      if (!worthFallback(category)) break;
    }
  }

  return { ok: false, ...(last ?? { status: 502, category: "unknown" as const, detail: "no response" }) };
}

// A visitor-safe message per failure category. Never leaks internals.
export function friendlyChatError(category: ChatErrorCategory): string {
  switch (category) {
    case "rate_limit":
    case "overloaded":
      return "A lot of people are chatting right now. Give it a few seconds and try again.";
    case "credits":
      return "Our assistant is briefly over its usage limit. Please try again shortly, or book a quick call.";
    default:
      return "I hit a snag on that one. Try again in a moment, or book a quick call.";
  }
}
