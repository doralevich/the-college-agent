import { ApiError, json, readJson, route } from "@/lib/http";
import { chatComplete, friendlyChatError } from "@/lib/anthropic-chat";
import { createAdminClient } from "@/lib/supabase/admin";
import { limit, tooManyRequests } from "@/lib/rate-limit";

// The demo chat brain. Shared read-only premise, per-session isolation: each visitor's
// session row carries their school + grad year, which seed the persona so the demo
// feels like THEIR agent with zero provisioning. The hard message cap on the session
// row is the cost control; when it's spent, the client shows the sign-up nudge.
// (Runs on the Claude API today; swappable for an Agent 37 ephemeral session later.)

export const maxDuration = 60;

const MAX_CHARS = 1500;

function systemPrompt(school: string, gradYear: number): string {
  const year = new Date().getFullYear();
  const stage =
    gradYear - year >= 4 ? "an incoming student" : gradYear - year <= 0 ? "a graduating senior" : "a current student";
  return `You are a live DEMO of The College Agent: a personal AI agent for college students, built by Apollo Claw. You are talking to ${stage} at ${school} (expected graduation ${gradYear}). Treat them as if you were already THEIR agent.

HOW TO BEHAVE
- Be warm, sharp, and concrete. Reference ${school} naturally when relevant. Plain text only, no markdown or em-dashes. Two to five sentences per answer.
- Showcase what the real agent does by DOING it in miniature: sketch a study plan, draft a professor email in their voice, break a syllabus into deadlines, plan a week, quiz them on a topic, plan a trip or budget.
- In this demo you cannot actually connect to Canvas, Gmail, or calendars, and nothing is saved after the session ends. When integrations come up, say the real agent connects to those tools and does it for real.
- The real product: $599 one-time to build their personalized agent, $25/month or $250/year hosting, $20 of AI credits included, live within 30 minutes of a five-minute intake, 7-day money-back guarantee. Sign up at thecollegeagent.ai/build.
- Mention signing up only when it fits naturally or when they ask. Never invent other prices or features.
- Stay on college life and The College Agent. For anything else, steer back kindly.`;
}

type Body = { sessionId?: string; messages?: Array<{ role?: string; content?: string }> };

export const POST = route(async (req) => {
  // Per-session message cap (below) is the real cost control; this per-IP cap stops one
  // client from spinning many sessions to keep burning the platform Anthropic key.
  if (!(await limit(req, "demo-chat", { max: 15, windowSeconds: 60 }))) return tooManyRequests();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new ApiError(503, "not_configured", "The demo is warming up. Try again in a minute.");

  const body = await readJson<Body>(req);
  const sessionId = (body.sessionId ?? "").trim();
  if (!sessionId) throw new ApiError(400, "invalid_request", "Missing demo session.");

  const db = createAdminClient();
  const { data: session } = await db
    .from("demo_sessions")
    .select("id, school, grad_year, message_count, token_count, expires_at")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) throw new ApiError(404, "no_session", "This demo session has ended. Start a new one!");
  if (new Date(session.expires_at as string).getTime() < Date.now()) {
    throw new ApiError(410, "expired", "This demo session has expired. Start a new one!");
  }

  const cap = Number(process.env.DEMO_MESSAGE_CAP ?? 20);
  if ((session.message_count as number) >= cap) {
    throw new ApiError(402, "cap_reached", "Demo limit reached. Sign up to keep going!");
  }

  const incoming = Array.isArray(body.messages) ? body.messages.slice(-16) : [];
  const messages = incoming
    .map((m) => ({
      role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: String(m.content ?? "").slice(0, MAX_CHARS).trim(),
    }))
    .filter((m) => m.content.length > 0);
  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    throw new ApiError(400, "invalid_request", "Send a message.");
  }

  const result = await chatComplete(apiKey, {
    system: systemPrompt(String(session.school ?? "your school"), Number(session.grad_year ?? 2028)),
    messages,
    maxTokens: 600,
    tag: "demo:chat",
  });
  if (!result.ok) {
    throw new ApiError(502, "chat_failed", friendlyChatError(result.category));
  }
  if (!result.reply) throw new ApiError(502, "empty_reply", "No answer came back. Try rephrasing?");

  const used = (session.message_count as number) + 1;
  const tokens =
    (session.token_count as number) +
    (result.usage?.input_tokens ?? 0) +
    (result.usage?.output_tokens ?? 0);
  await db.from("demo_sessions").update({ message_count: used, token_count: tokens }).eq("id", sessionId);

  return json({ reply: result.reply, remaining: Math.max(0, cap - used) });
});
