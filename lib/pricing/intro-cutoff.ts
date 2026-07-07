// Flat pricing (business numbers locked): one-time platform fee $599, hosting
// $25/month or $250/year. The annual price IS the discount ("2 months free" = 10 x $25),
// not a trial. The ambassador coupon ($50 off) takes the one-time fee to $549 at checkout.
//
// This module used to carry the intro/regular Aug-15 cutoff. The intro mechanism is
// retired; the old exports remain as aliases so every page that imported the pair
// renders the same flat price, and introPromoActive() is simply false so promo
// banners and "intro pricing" copy vanish everywhere without touching each page.

export const PLAN_LOOKUP = "ca_plan";
export const PLAN_AMOUNT_CENTS = 59900;

export const HOSTING_LOOKUP = "ca_hosting";
export const HOSTING_AMOUNT_CENTS = 2500;
export const HOSTING_ANNUAL_LOOKUP = "ca_hosting_annual";
export const HOSTING_ANNUAL_AMOUNT_CENTS = 25000;

// ---- Back-compat aliases (old intro/regular model) ----
export const INTRO_PLAN_LOOKUP = PLAN_LOOKUP;
export const REGULAR_PLAN_LOOKUP = PLAN_LOOKUP;
export const INTRO_PLAN_AMOUNT_CENTS = PLAN_AMOUNT_CENTS;
export const REGULAR_PLAN_AMOUNT_CENTS = PLAN_AMOUNT_CENTS;
export const INTRO_CUTOFF_LABEL = "August 15";

export function introPromoActive(_now: Date = new Date()): boolean {
  return false;
}

export function currentPlanLookup(_now: Date = new Date()): string {
  return PLAN_LOOKUP;
}

export function currentPlanAmountCents(_now: Date = new Date()): number {
  return PLAN_AMOUNT_CENTS;
}
