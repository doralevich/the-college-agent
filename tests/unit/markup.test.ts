import { describe, expect, it } from "vitest";
import type { Budget, Usage } from "../../lib/types";
import {
  MARKUP_RATE,
  displayBudget,
  displayMicros,
  displayUsage,
  fundedMicros,
  markupMicros,
} from "../../lib/markup";

const TEN_USD = 10_000_000; // $10 in micros

describe("fundedMicros / displayMicros (the hidden exchange rate)", () => {
  it("funds a $10 payment as ~$9.52 of real headroom (operator keeps the spread)", () => {
    // 10_000_000 / 1.05 = 9_523_809.52 -> 9_523_810
    expect(fundedMicros(TEN_USD)).toBe(9_523_810);
    expect(displayMicros(9_523_810)).toBeCloseTo(TEN_USD, -1);
  });

  it("is a round-trip: what the student paid is what the student sees", () => {
    for (const paid of [500_000, 2_500_000, 5_000_000, TEN_USD, 20_000_000]) {
      // funding then displaying returns the payment within a micro of rounding
      expect(Math.abs(displayMicros(fundedMicros(paid)) - paid)).toBeLessThanOrEqual(2);
    }
  });

  it("zero stays zero on both conversions", () => {
    expect(fundedMicros(0)).toBe(0);
    expect(displayMicros(0)).toBe(0);
  });

  it("coerces missing/NaN inputs to 0 instead of propagating NaN", () => {
    expect(displayMicros(undefined)).toBe(0);
    expect(displayMicros(null)).toBe(0);
    expect(displayMicros(Number.NaN)).toBe(0);
  });
});

describe("markupMicros (what the operator earns)", () => {
  it("is exactly the rate applied to the raw bill", () => {
    expect(markupMicros(TEN_USD)).toBe(500_000); // 5% of $10 = $0.50
    expect(markupMicros(0)).toBe(0);
    expect(MARKUP_RATE).toBe(0.05);
  });

  it("markup collected on a sale equals markup earned once that credit is fully consumed", () => {
    // Student pays P; we fund F. If they burn all F of raw usage, we earn markupMicros(F),
    // which must match the spread P - F we banked at sale time (within rounding).
    for (const paid of [500_000, 2_500_000, 5_000_000, TEN_USD]) {
      const funded = fundedMicros(paid);
      expect(Math.abs(markupMicros(funded) - (paid - funded))).toBeLessThanOrEqual(2);
    }
  });
});

describe("displayBudget", () => {
  const raw: Budget = {
    monthly_cap_micros: 1_000_000,
    monthly_consumed_micros: 400_000,
    monthly_remaining_micros: 600_000,
    monthly_period: "2026-07",
    credit_remaining_micros: 9_523_810,
    updated_at: 1234,
  };

  it("marks up every micros leg and preserves cap = consumed + remaining", () => {
    const shown = displayBudget(raw);
    expect(shown.monthly_cap_micros).toBe(displayMicros(1_000_000));
    expect(shown.credit_remaining_micros).toBe(displayMicros(9_523_810));
    expect(shown.monthly_consumed_micros + shown.monthly_remaining_micros).toBe(
      shown.monthly_cap_micros
    );
  });

  it("leaves the period and timestamp untouched", () => {
    const shown = displayBudget(raw);
    expect(shown.monthly_period).toBe("2026-07");
    expect(shown.updated_at).toBe(1234);
  });
});

describe("displayUsage", () => {
  const raw: Usage = {
    period: "2026-07",
    total_micros: 2_000_000,
    by_integration: {
      llm: { cost_micros: 1_500_000, calls: 42, input_tokens: 1000, output_tokens: 500 },
      brave: { cost_micros: 300_000, calls: 7 },
      composio: { cost_micros: 200_000, calls: 3 },
    },
  };

  it("marks up the total and every per-integration cost", () => {
    const shown = displayUsage(raw);
    expect(shown.total_micros).toBe(displayMicros(2_000_000));
    expect(shown.by_integration.llm.cost_micros).toBe(displayMicros(1_500_000));
    expect(shown.by_integration.brave.cost_micros).toBe(displayMicros(300_000));
    expect(shown.by_integration.composio.cost_micros).toBe(displayMicros(200_000));
  });

  it("never touches call counts or token counts", () => {
    const shown = displayUsage(raw);
    expect(shown.by_integration.llm.calls).toBe(42);
    expect(shown.by_integration.llm.input_tokens).toBe(1000);
    expect(shown.by_integration.llm.output_tokens).toBe(500);
    expect(shown.period).toBe("2026-07");
  });

  it("degrades gracefully on a partial/legacy shape instead of throwing", () => {
    // Agent37 can hand back a usage object with no by_integration (fresh agent, empty month).
    const partial = { period: "2026-07", total_micros: 0 } as unknown as Usage;
    const shown = displayUsage(partial);
    expect(shown.total_micros).toBe(0);
    expect(shown.by_integration.llm.cost_micros).toBe(0);
    expect(shown.by_integration.brave.cost_micros).toBe(0);
    expect(shown.by_integration.composio.cost_micros).toBe(0);
  });
});
