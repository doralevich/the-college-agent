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

/**
 * What the $25 covers, in the student's words.
 *
 * Kept here rather than inline on each page so the pricing promise and the price itself
 * cannot drift apart - a fair-use clause that contradicts the page it sits next to is worse
 * than none. Terms, /build and the marketing pages all render this exact string.
 */
export const FAIR_USE_NOTE =
  "Your $25/month includes your own private agent, hosting, updates, and normal daily use. " +
  "Sustained usage well beyond typical student use may be reviewed.";

/** One line for cards and footers, where the full note is too long. */
export const INCLUDES_SHORT =
  "Hosting, monitoring, updates, and normal daily use, on your own private agent.";

// ---- Back-compat shims ----
//
// Retired: the intro/regular cutoff, and the one-time platform fee. These remain only so
// nothing importing them breaks at build time; they describe a charge that no longer exists.
// Do not use them in new code.

export const INTRO_CUTOFF_LABEL = "August 15";

export function introPromoActive(_now: Date = new Date()): boolean {
  return false;
}
