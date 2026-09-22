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

  it("states the fair-use promise in the student's own terms", () => {
    // Quoted verbatim on /build and in Terms. Both render this constant rather than their
    // own copy, so the promise and the price cannot drift apart.
    expect(pricing.FAIR_USE_NOTE).toContain("$25/month");
    expect(pricing.FAIR_USE_NOTE).toContain("your own private agent");
    expect(pricing.FAIR_USE_NOTE).toMatch(/may be reviewed/i);
  });

  it("keeps the retired intro promo switched off", () => {
    expect(pricing.introPromoActive()).toBe(false);
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
