import "server-only";
import { instanceFetch } from "@/lib/agent37";

// One agent turn, run from the server on behalf of a chat channel.
//
// This is what makes a channel runtime-agnostic: it goes through Agent37's per-instance Agents
// API (/v1/responses), which every template serves, rather than through a runtime's own gateway.
// Nothing has to be running inside the box for a student's Telegram message to be answered.

export interface TurnResult {
  status?: string;
  output_text?: string;
  session_id?: string;
  error?: { message?: string };
}

// How long a chat thread stays one conversation. Past these, the next message opens a fresh
// session rather than continuing one from last week — which would drag a semester of unrelated
// context into every reply and cost tokens for the privilege.
const SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000; // 12h since it opened
const SESSION_MAX_IDLE_MS = 2 * 60 * 60 * 1000; // 2h since the last message

/**
 * The session id to continue, or null to start fresh.
 *
 * Pure, so the age/idle rules are testable without a box or a clock to wait on.
 */
export function sessionToContinue(
  sessionId: string | null,
  lastActivityMs: number | null,
  sessionStartedMs: number | null,
  now: number = Date.now()
): string | null {
  if (!sessionId) return null;
  if (sessionStartedMs == null) return null;
  if (now - sessionStartedMs > SESSION_MAX_AGE_MS) return null;
  if (lastActivityMs != null && now - lastActivityMs > SESSION_MAX_IDLE_MS) return null;
  return sessionId;
}

/**
 * Run one turn on the instance.
 *
 * NO `model` is sent, deliberately. The metered gateway on some builds rejects a vendor model id
 * ("Invalid model. Use openclaw...") and returns HTTP 200 with that refusal wrapped INSIDE a
 * failed turn — so naming a model breaks those instances in a way a status-code check never
 * sees. Omitting it lets each instance use its own default, which works on every build.
 */
export async function runTurn(
  agentId: string,
  input: string,
  sessionId: string | null
): Promise<TurnResult> {
  const res = await instanceFetch(agentId, "/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input,
      stream: false,
      ...(sessionId ? { session_id: sessionId } : {}),
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`agent turn failed: HTTP ${res.status}${body ? ` ${body.slice(0, 200)}` : ""}`);
  }
  return (await res.json()) as TurnResult;
}

/** What to actually send the student. Never empty — silence reads as a broken product. */
export function answerFrom(result: TurnResult): string {
  if (result.status === "completed" && result.output_text?.trim()) return result.output_text.trim();
  if (result.error?.message) return `Sorry — that didn't work: ${result.error.message}`;
  return "Sorry, I couldn't finish that one. Try again?";
}

/**
 * Why a turn produced no answer, in a few words, or "" when it completed with text.
 *
 * The 200-but-no-answer case — status not "completed", or completed with empty output, and no
 * error message to explain it — is the one answerFrom papers over: the student gets "I couldn't
 * finish that one" and our records get nothing. Storing this on the channel row means a repeated
 * failure is a fact we can read rather than a guess.
 */
export function incompleteReason(result: TurnResult): string {
  if (result.status === "completed" && result.output_text?.trim()) return "";
  if (result.error?.message) return result.error.message;
  return `status=${result.status ?? "unknown"}, no output text`;
}
