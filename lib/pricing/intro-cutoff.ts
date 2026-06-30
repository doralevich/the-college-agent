// Intro-pricing cutoff for The College Agent one-time plan fee.
// Through Aug 15 (inclusive, end-of-day Eastern) the plan is $499; from Aug 16
// onwards it's $599. The server picks the lookup_key based on this at checkout
// time, and the /build page mirrors the same logic for what to render.
//
// Implemented as end-of-day Aug 15 in America/New_York (the US college timezone
// most users will read it in) converted to UTC. ET ↔ UTC offset varies with
// daylight-saving; mid-August always lands inside EDT (UTC-4) so end of Aug 15
// ET = Aug 16 04:00:00 UTC.

const INTRO_CUTOFF_UTC = Date.UTC(2026, 7 /* August (0-indexed) */, 16, 4, 0, 0);

export const INTRO_PLAN_LOOKUP = "ca_plan_intro";
export const REGULAR_PLAN_LOOKUP = "ca_plan_regular";

export const INTRO_PLAN_AMOUNT_CENTS = 49900;
export const REGULAR_PLAN_AMOUNT_CENTS = 59900;
export const HOSTING_AMOUNT_CENTS = 2500;
export const HOSTING_LOOKUP = "ca_hosting";

// True while the intro promo is still live. Pass a clock for deterministic tests.
export function introPromoActive(now: Date = new Date()): boolean {
  return now.getTime() < INTRO_CUTOFF_UTC;
}

export function currentPlanLookup(now: Date = new Date()): string {
  return introPromoActive(now) ? INTRO_PLAN_LOOKUP : REGULAR_PLAN_LOOKUP;
}

export function currentPlanAmountCents(now: Date = new Date()): number {
  return introPromoActive(now) ? INTRO_PLAN_AMOUNT_CENTS : REGULAR_PLAN_AMOUNT_CENTS;
}

// Human-readable date for the marketing banner (e.g. "August 15").
export const INTRO_CUTOFF_LABEL = "August 15";
