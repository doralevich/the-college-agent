import { describe, expect, it } from "vitest";
import * as pricing from "@/lib/pricing/intro-cutoff";
import { buildSoul } from "@/lib/hermes";

// The live money path: what a student is actually charged at /build.
//
// Distinct from tests/unit/pricing.test.ts, which covers lib/pricing.ts - the older
// multi-tier configurator catalog. Nothing sells from that any more; it survives only to
// render past orders and to map a hosting key to a machine size. THIS is the one that
// describes what somebody pays today.

describe("subscription pricing", () => {
  it("is $25/month and $250/year", () => {
    expect(pricing.HOSTING_AMOUNT_CENTS).toBe(2500);
    expect(pricing.HOSTING_ANNUAL_AMOUNT_CENTS).toBe(25000);
  });

  it("prices the year at ten months, so annual really is two months free", () => {
    // The page says "2 months free". If someone edits one number and not the other, the
    // claim becomes false in a way no type error catches.
    expect(pricing.HOSTING_ANNUAL_AMOUNT_CENTS).toBe(pricing.HOSTING_AMOUNT_CENTS * 10);
  });

  it("has no setup fee of any kind", () => {
    // The $599 platform fee and the $4,500 professional build are both gone. A re-added
    // export here would be a charge no page renders and no student expects.
    const exported = Object.keys(pricing);
    for (const gone of [
      "PLAN_AMOUNT_CENTS",
      "PLAN_LOOKUP",
      "INTRO_PLAN_AMOUNT_CENTS",
      "REGULAR_PLAN_AMOUNT_CENTS",
      "currentPlanAmountCents",
      "PRO_PLAN_AMOUNT_CENTS",
      "PRO_HOSTING_AMOUNT_CENTS",
      "PRO_PLAN_LOOKUP",
      "PRO_HOSTING_LOOKUP",
    ]) {
      expect(exported, `${gone} is a retired charge and must not come back`).not.toContain(gone);
    }
  });

  it("states what every plan covers in the student's own terms", () => {
    // Rendered on /build and in Terms from this one constant. With usage metered by a
    // monthly allowance, the old "normal daily use ... may be reviewed" promise would
    // contradict every plan card, so it must not come back.
    expect(pricing.FAIR_USE_NOTE).toContain("your own private agent");
    expect(pricing.FAIR_USE_NOTE).toMatch(/monthly AI allowance/i);
    expect(pricing.FAIR_USE_NOTE).not.toMatch(/may be reviewed/i);
  });

  it("keeps the retired intro promo switched off", () => {
    expect(pricing.introPromoActive()).toBe(false);
  });
});

describe("plan tiers", () => {
  const byId = (id: string) => pricing.PLAN_TIERS.find((t) => t.id === id)!;

  it("sells $25, $50 and $100 a month with $5, $15 and $40 of AI usage", () => {
    expect(pricing.PLAN_TIERS.map((t) => [t.id, t.monthlyCents, t.allowanceCents])).toEqual([
      ["essentials", 2500, 500],
      ["plus", 5000, 1500],
      ["pro", 10000, 4000],
    ]);
  });

  it("prices every year at ten months", () => {
    for (const t of pricing.PLAN_TIERS) expect(t.annualCents, t.id).toBe(t.monthlyCents * 10);
  });

  it("keeps Essentials on the original lookup keys so existing subscribers map to it", () => {
    expect(byId("essentials").monthlyLookup).toBe(pricing.HOSTING_LOOKUP);
    expect(byId("essentials").annualLookup).toBe(pricing.HOSTING_ANNUAL_LOOKUP);
    expect(byId("essentials").monthlyCents).toBe(pricing.HOSTING_AMOUNT_CENTS);
  });

  it("gives every tier and interval its own lookup key", () => {
    const keys = pricing.PLAN_TIERS.flatMap((t) => [t.monthlyLookup, t.annualLookup]);
    expect(new Set(keys).size).toBe(keys.length);
    // Archived in Stripe. A lookup key can't be reused once its price is archived.
    expect(keys).not.toContain("ca_hosting_pro");
    expect(keys).not.toContain("ca_plan_pro");
  });

  it("round-trips every lookup key back to its tier and interval", () => {
    for (const t of pricing.PLAN_TIERS) {
      for (const interval of ["monthly", "annual"] as const) {
        const key = pricing.lookupFor(t, interval);
        expect(pricing.tierForLookup(key)).toEqual({ tier: t, interval });
      }
    }
  });

  it("ignores lookup keys that are not a plan (ApolloClaw shares the Stripe account)", () => {
    expect(pricing.tierForLookup(null)).toBeNull();
    expect(pricing.tierForLookup("")).toBeNull();
    expect(pricing.tierForLookup("ca_credits_1000")).toBeNull();
    expect(pricing.tierForLookup("apolloclaw_hosting")).toBeNull();
  });

  it("loads a month of allowance per monthly invoice and twelve per annual one", () => {
    expect(pricing.allowanceCentsFor(byId("essentials"), "monthly")).toBe(500);
    expect(pricing.allowanceCentsFor(byId("plus"), "annual")).toBe(1500 * 12);
    expect(pricing.allowanceCentsFor(byId("pro"), "annual")).toBe(4000 * 12);
  });

  it("falls back to Essentials for a missing or unknown plan", () => {
    expect(pricing.planTier(undefined).id).toBe("essentials");
    expect(pricing.planTier("platinum").id).toBe("essentials");
    expect(pricing.planTier("pro").id).toBe("pro");
  });

  it("quotes every plan in the one-line summary", () => {
    const summary = pricing.plansSummary();
    expect(summary).toContain("Essentials $25/month ($5 of AI usage included)");
    expect(summary).toContain("Plus $50/month ($15 of AI usage included)");
    expect(summary).toContain("Pro $100/month ($40 of AI usage included)");
    expect(pricing.PLANS_FROM).toBe("$25");
  });
});

describe("one persona, no staff branch", () => {
  const soul = (questionnaire: Record<string, unknown>) =>
    buildSoul({
      agentName: "Dash",
      firstName: "Ada",
      lastName: null,
      school: "Rutgers",
      year: null,
      major: null,
      questionnaire,
    });

  it("builds the student persona", () => {
    expect(soul({})).toContain("a personal AI agent for a college student");
  });

  it("still builds the student persona from a legacy staff intake", () => {
    // Faculty, administration and athletics moved to ApolloClaw. No College Agent instance
    // was ever provisioned from a staff intake, but a stored questionnaire could still
    // carry these answers - it must not resurrect the professional persona.
    const legacy = soul({ role: "Athletic Department", roleTitle: "Head Coach", department: "Basketball" });
    expect(legacy).toContain("a personal AI agent for a college student");
    expect(legacy).not.toMatch(/compliance dates/i);
    expect(legacy).not.toMatch(/Head Coach/);
  });
});
