import { describe, expect, it } from "vitest";
import { categorize, friendlyChatError } from "../../lib/anthropic-chat";

describe("categorize", () => {
  it("maps a low-credit 400 to 'credits', not 'bad_request'", () => {
    // Anthropic returns an empty balance as HTTP 400 with a generic
    // invalid_request_error type and the real cause only in the message.
    // Before the fix this fell through to 'bad_request' -> the vague
    // "I hit a snag" copy. It must now surface as 'credits'.
    expect(
      categorize(
        400,
        "invalid_request_error",
        "Your credit balance is too low to access the Anthropic API. Please go to Plans & Billing to upgrade or purchase credits."
      )
    ).toBe("credits");
  });

  it("still detects credit/billing problems from the error type alone", () => {
    expect(categorize(0, "billing_error")).toBe("credits");
    expect(categorize(402, undefined)).toBe("credits");
  });

  it("keeps a genuine (non-credit) 400 as 'bad_request'", () => {
    expect(categorize(400, "invalid_request_error", "messages: at least one message is required")).toBe(
      "bad_request"
    );
  });

  it("maps the standard status codes", () => {
    expect(categorize(401)).toBe("auth");
    expect(categorize(403)).toBe("permission");
    expect(categorize(404)).toBe("not_found");
    expect(categorize(429)).toBe("rate_limit");
    expect(categorize(500)).toBe("overloaded");
    expect(categorize(529)).toBe("overloaded");
    expect(categorize(0)).toBe("unknown");
  });
});

describe("friendlyChatError", () => {
  it("gives a clear, credit-specific message for 'credits'", () => {
    const msg = friendlyChatError("credits");
    expect(msg).toMatch(/usage limit/i);
    expect(msg).not.toMatch(/i hit a snag/i);
  });

  it("falls back to the generic message for opaque failures", () => {
    expect(friendlyChatError("auth")).toMatch(/i hit a snag/i);
    expect(friendlyChatError("bad_request")).toMatch(/i hit a snag/i);
  });

  it("reassures on transient overload / rate limits", () => {
    expect(friendlyChatError("overloaded")).toMatch(/lot of people/i);
    expect(friendlyChatError("rate_limit")).toMatch(/lot of people/i);
  });
});
