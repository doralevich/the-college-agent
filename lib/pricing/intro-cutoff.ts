// Flat subscription pricing: $25/month, or $250/year. Nothing is charged up front.
//
// The annual price IS the discount ("2 months free" = 10 x $25), not a trial.
//
// HISTORY, because two mechanisms have been retired through this file and their ghosts are
// still visible in the name:
//
//   1. An intro/regular price with an Aug-15 cutoff. Retired; introPromoActive() returns
//      false so promo banners vanish without touching each page.
//   2. A $599 one-time platform fee, and a $4,500 Professional build for faculty,
//      administration and athletic departments. Both retired - the staff segments moved to
//      ApolloClaw, and the student product is now a pure subscription with no setup fee.
//
// The filename is now wrong twice over and is left alone on purpose: renaming it touches
// every importer for no behaviour change. What matters is that this is the ONLY place the
// numbers live.

export const HOSTING_LOOKUP = "ca_hosting";
export const HOSTING_AMOUNT_CENTS = 2500;
export const HOSTING_ANNUAL_LOOKUP = "ca_hosting_annual";
export const HOSTING_ANNUAL_AMOUNT_CENTS = 25000;

// ---- Plan tiers ----
//
// Three plans, each a flat subscription that INCLUDES a monthly AI allowance - the credit the
// agent spends when it thinks. The allowance refills every billing period (see
// lib/plan-allowance.ts); use beyond it is covered by top-ups, as before.
//
// Annual is 10 x monthly on every tier ("2 months free"), the same deal the single plan had.
// An annual invoice arrives once a year, so it loads TWELVE months of allowance at once -
// refilling per invoice would otherwise hand an annual student one month's tokens a year.
//
// The $25 tier keeps the original lookup keys, so every existing subscriber is already on it
// and starts receiving its allowance at their next renewal with no migration.
//
// NOT MACHINE SIZE. A tier id must never be written to orders.hosting: that column picks the
// Agent37 box via HOSTING_SHAPES (config/agents.ts), whose keys include "plus" and "pro". A
// $100 plan buys more AI usage, not a bigger server - wiring the two together would quietly
// double the hosting bill on every upgrade.
//
// The new keys avoid "ca_plan_pro" and "ca_hosting_pro", which are ARCHIVED in the Stripe
// catalog - reusing either would get the price deactivated by the next catalog sync.

export type PlanTierId = "essentials" | "plus" | "pro";
export type BillingInterval = "monthly" | "annual";

export type PlanTier = {
  id: PlanTierId;
  name: string;
  /** One line under the name. */
  blurb: string;
  monthlyCents: number;
  annualCents: number;
  /** AI allowance loaded per MONTH of service. */
  allowanceCents: number;
  monthlyLookup: string;
  annualLookup: string;
  /** The card the pricing page highlights. */
  popular?: boolean;
};

export const PLAN_TIERS: readonly PlanTier[] = [
  {
    id: "essentials",
    name: "Essentials",
    blurb: "For staying on top of classes and deadlines.",
    monthlyCents: HOSTING_AMOUNT_CENTS,
    annualCents: HOSTING_ANNUAL_AMOUNT_CENTS,
    allowanceCents: 500,
    monthlyLookup: HOSTING_LOOKUP,
    annualLookup: HOSTING_ANNUAL_LOOKUP,
  },
  {
    id: "plus",
    name: "Plus",
    blurb: "For students who lean on their agent every day.",
    monthlyCents: 5000,
    annualCents: 50000,
    allowanceCents: 1500,
    monthlyLookup: "ca_tier_50",
    annualLookup: "ca_tier_50_annual",
    popular: true,
  },
  {
    id: "pro",
    name: "Pro",
    blurb: "For heavy research, long papers, and big semesters.",
    monthlyCents: 10000,
    annualCents: 100000,
    allowanceCents: 4000,
    monthlyLookup: "ca_tier_100",
    annualLookup: "ca_tier_100_annual",
  },
];

export const DEFAULT_PLAN_TIER: PlanTierId = "essentials";

/** The tier for an id, falling back to the default for anything unknown or missing. */
export function planTier(id: string | null | undefined): PlanTier {
  return PLAN_TIERS.find((t) => t.id === id) ?? PLAN_TIERS.find((t) => t.id === DEFAULT_PLAN_TIER)!;
}

/** The Stripe lookup key for a tier and interval. */
export function lookupFor(tier: PlanTier, interval: BillingInterval): string {
  return interval === "annual" ? tier.annualLookup : tier.monthlyLookup;
}

/**
 * Which tier and interval a Stripe price lookup key belongs to, or null if it is not one of
 * ours. The webhook resolves allowances from this rather than from session metadata, because
 * the subscription's own price is the truth: metadata is written once at checkout and would
 * go stale the moment a plan changed in the Stripe portal.
 */
export function tierForLookup(
  lookupKey: string | null | undefined
): { tier: PlanTier; interval: BillingInterval } | null {
  if (!lookupKey) return null;
  for (const tier of PLAN_TIERS) {
    if (tier.monthlyLookup === lookupKey) return { tier, interval: "monthly" };
    if (tier.annualLookup === lookupKey) return { tier, interval: "annual" };
  }
  return null;
}

/** Allowance for one invoice: a month's worth, or twelve for an annual invoice. */
export function allowanceCentsFor(tier: PlanTier, interval: BillingInterval): number {
  return tier.allowanceCents * (interval === "annual" ? 12 : 1);
}

/**
 * What every plan covers, in the student's words.
 *
 * Kept here rather than inline on each page so the pricing promise and the price itself
 * cannot drift apart - a fair-use clause that contradicts the page it sits next to is worse
 * than none. Terms, /build and the marketing pages all render this exact string.
 *
 * Rewritten for the tiered plans. The previous wording ("Your $25/month includes ... normal
 * daily use. Sustained usage well beyond typical student use may be reviewed.") promised
 * open-ended use on one price; with usage now metered by an allowance, that sentence would
 * contradict every card on the pricing page.
 */
export const FAIR_USE_NOTE =
  "Every plan includes your own private agent, hosting, updates, and a monthly AI allowance " +
  "that refills each billing period. If you use it all before then, you can top up anytime.";

/** One line for cards and footers, where the full note is too long. */
export const INCLUDES_SHORT =
  "Your own private agent, hosting, updates, and a monthly AI allowance.";

function usd(cents: number): string {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

/**
 * The plans in one sentence, for FAQ answers, the site chatbot and legal copy. Derived from
 * PLAN_TIERS so a price change updates every page that quotes it.
 * "Essentials $25/month ($5 of AI usage included), Plus $50/month ($15 ...), ..."
 */
export function plansSummary(): string {
  return PLAN_TIERS.map(
    (t) => `${t.name} ${usd(t.monthlyCents)}/month (${usd(t.allowanceCents)} of AI usage included)`
  ).join(", ");
}

/** "$25", the cheapest monthly price, for "plans from ..." lines. */
export const PLANS_FROM = usd(Math.min(...PLAN_TIERS.map((t) => t.monthlyCents)));

// Referral: the friend gets this much off their first payment and the referrer gets the same
// off their next bill. Lives here (not lib/referral.ts, which is server-only) so /build can
// say exactly what the coupon is worth on the plan being picked.
export const REFERRAL_REWARD_CENTS = 2500;

// ---- Back-compat shims ----
//
// Retired: the intro/regular cutoff, and the one-time platform fee. These remain only so
// nothing importing them breaks at build time; they describe a charge that no longer exists.
// Do not use them in new code.

export const INTRO_CUTOFF_LABEL = "August 15";

export function introPromoActive(_now: Date = new Date()): boolean {
  return false;
}
