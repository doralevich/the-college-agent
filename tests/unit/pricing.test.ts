import { describe, expect, it } from "vitest";
import {
  dueToday,
  formatUSD,
  lineItemLookupKeys,
  monthlyRecurring,
  parseSelection,
  type Selection,
} from "../../lib/pricing";

// The /build catalog is the money path: the server resolves a student's keys to Stripe prices
// and computes the amount actually charged. These lock down that math so a catalog edit can't
// silently change what a student pays.

const GRAD_PRO_ALL: Selection = {
  plan: "graduate",
  hosting: "pro",
  support: "annual",
  onboarding: "whiteglove",
};

const UNDERGRAD_BASIC_FREE: Selection = {
  plan: "undergraduate",
  hosting: "basic",
  support: "none",
  onboarding: "standard",
};

describe("parseSelection", () => {
  it("accepts a valid selection of real catalog keys", () => {
    expect(parseSelection(GRAD_PRO_ALL)).toEqual(GRAD_PRO_ALL);
  });

  it("rejects an unknown plan key", () => {
    expect(() => parseSelection({ ...GRAD_PRO_ALL, plan: "phd" })).toThrow(/Unknown plan/);
  });

  it.each(["hosting", "support", "onboarding"] as const)(
    "rejects an unknown %s key",
    (field) => {
      expect(() => parseSelection({ ...GRAD_PRO_ALL, [field]: "bogus" })).toThrow(
        new RegExp(`Unknown ${field}`, "i"),
      );
    },
  );

  it("treats a null/garbage input as a missing plan", () => {
    expect(() => parseSelection(null)).toThrow(/Unknown plan/);
  });
});

describe("dueToday", () => {
  it("sums plan + support + onboarding + the first month of hosting", () => {
    // 39900 + 120000 + 65000 + 15900
    expect(dueToday(GRAD_PRO_ALL)).toBe(240800);
  });

  it("counts $0 support/onboarding as nothing", () => {
    // 19900 + 0 + 0 + 8900
    expect(dueToday(UNDERGRAD_BASIC_FREE)).toBe(28800);
  });
});

describe("monthlyRecurring", () => {
  it("is hosting only, independent of the one-time items", () => {
    expect(monthlyRecurring(GRAD_PRO_ALL)).toBe(15900);
    expect(monthlyRecurring(UNDERGRAD_BASIC_FREE)).toBe(8900);
  });
});

describe("lineItemLookupKeys", () => {
  it("lists hosting first, then plan, then any non-free add-ons", () => {
    expect(lineItemLookupKeys(GRAD_PRO_ALL)).toEqual([
      "hosting_pro",
      "plan_graduate",
      "support_annual",
      "onboarding_whiteglove",
    ]);
  });

  it("omits $0 items so Stripe never sees a null lookup_key", () => {
    expect(lineItemLookupKeys(UNDERGRAD_BASIC_FREE)).toEqual(["hosting_basic", "plan_undergraduate"]);
  });
});

describe("formatUSD", () => {
  it("renders whole-dollar, comma-grouped amounts from cents", () => {
    expect(formatUSD(108800)).toBe("$1,088");
    expect(formatUSD(8900)).toBe("$89");
    expect(formatUSD(0)).toBe("$0");
  });
});
