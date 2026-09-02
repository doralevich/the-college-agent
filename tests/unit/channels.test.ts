import { describe, expect, it } from "vitest";
import { answerFrom, incompleteReason, sessionToContinue } from "@/lib/channels/turn";
import { toChannel, type ChannelRow } from "@/lib/channels/store";

// The Telegram channel is the one surface here that is PUBLIC and carries a credential. These
// cover the rules that decide whether a student's agent answers, and whether their bot token can
// ever leave the server.

const row = (over: Partial<ChannelRow> = {}): ChannelRow => ({
  agent37_id: "abc123",
  channel: "telegram",
  bot_token: "12345:super-secret-bot-token",
  account: "@bens_agent",
  secret: "deadbeef".repeat(8),
  session_id: "sess_1",
  session_started_at: "2026-09-02T10:00:00Z",
  owner_chat_id: "555",
  state: "connected",
  message: null,
  updated_at: "2026-09-02T11:00:00Z",
  ...over,
});

describe("toChannel", () => {
  // The single rule lib/channels/store.ts exists to enforce. If this ever fails, a student's bot
  // token is one JSON response away from the browser, and anyone holding it can read and send
  // every message in their chat with their agent.
  it("never exposes the bot token or the webhook secret", () => {
    const out = toChannel(row()) as unknown as Record<string, unknown>;
    const serialised = JSON.stringify(out);
    expect(serialised).not.toContain("super-secret-bot-token");
    expect(serialised).not.toContain("deadbeef");
    expect(Object.keys(out)).toEqual(
      expect.not.arrayContaining(["bot_token", "botToken", "secret"])
    );
  });

  it("reports whether the student has actually messaged the bot yet", () => {
    // A token with no owner_chat_id is "connected" but has no address to send to — the state a
    // student lands in between pasting the token and saying anything to the bot.
    expect(toChannel(row()).linked).toBe(true);
    expect(toChannel(row({ owner_chat_id: null })).linked).toBe(false);
  });

  it("passes through the state and the last error for the dashboard", () => {
    const errored = toChannel(row({ state: "error", message: "no answer: status=failed" }));
    expect(errored.state).toBe("error");
    expect(errored.message).toBe("no answer: status=failed");
    expect(toChannel(row({ state: "" })).state).toBe("disconnected");
  });
});

describe("sessionToContinue", () => {
  const started = Date.parse("2026-09-02T10:00:00Z");
  const now = Date.parse("2026-09-02T11:00:00Z");

  it("continues a live thread", () => {
    expect(sessionToContinue("sess_1", now - 60_000, started, now)).toBe("sess_1");
  });

  it("starts fresh when there is no session or no start time", () => {
    expect(sessionToContinue(null, now, started, now)).toBeNull();
    // No start time means we cannot age it, and an unbounded session would drag a semester of
    // context into every reply.
    expect(sessionToContinue("sess_1", now, null, now)).toBeNull();
  });

  it("starts fresh once the thread is older than 12h", () => {
    const old = Date.parse("2026-09-01T20:00:00Z"); // 15h before `now`
    expect(sessionToContinue("sess_1", now - 60_000, old, now)).toBeNull();
  });

  it("starts fresh after 2h idle, even in a young thread", () => {
    const idle = Date.parse("2026-09-02T08:00:00Z"); // 3h before `now`
    expect(sessionToContinue("sess_1", idle, started, now)).toBeNull();
  });
});

describe("answerFrom", () => {
  it("returns the agent's text when the turn completed", () => {
    expect(answerFrom({ status: "completed", output_text: "  Your essay is due Friday.  " })).toBe(
      "Your essay is due Friday."
    );
  });

  it("never returns empty - silence reads as a broken product", () => {
    expect(answerFrom({ status: "failed" })).not.toBe("");
    expect(answerFrom({ status: "completed", output_text: "   " })).not.toBe("");
    expect(answerFrom({})).not.toBe("");
  });

  it("surfaces the upstream error rather than a generic apology when there is one", () => {
    expect(answerFrom({ status: "failed", error: { message: "rate limited" } })).toContain(
      "rate limited"
    );
  });
});

describe("incompleteReason", () => {
  it("is empty for a good turn, and explains every other case", () => {
    expect(incompleteReason({ status: "completed", output_text: "hi" })).toBe("");
    expect(incompleteReason({ status: "failed", error: { message: "boom" } })).toBe("boom");
    // The case answerFrom papers over: 200, completed, and no text at all. Without a reason
    // recorded, a bot failing every message leaves nothing to diagnose from.
    expect(incompleteReason({ status: "completed", output_text: "" })).toContain("no output text");
    expect(incompleteReason({})).toContain("unknown");
  });
});
