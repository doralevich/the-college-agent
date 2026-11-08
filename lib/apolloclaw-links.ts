// Where this site hands people off.
//
// Since Nov 2026 this site is the storefront only (David: "let's make this a simpler
// infrastructure"). Checkout, sign-in, the questionnaire, the agent build and the dashboard all
// run on ApolloClaw, the same path every other agent in the family uses. The college agent is
// `?agent=college` there, and the three student plans carry the same names they have here.
//
// Every "Build My Agent" button, the pricing cards, and the Log In link read from this file, so
// a change of address is one edit. The old routes on this domain (/build, /login, /dashboard,
// /setup) redirect to these in next.config.ts, so a link printed before the cutover still lands.

export const APOLLOCLAW_ORIGIN = "https://apolloclaw.ai";

/** The student checkout and questionnaire. */
export const BUILD_URL = `${APOLLOCLAW_ORIGIN}/onboard?agent=college`;

/** Sign in to an existing agent. */
export const LOGIN_URL = `${APOLLOCLAW_ORIGIN}/login`;

/** The dashboard, which asks for a sign-in on its own when there is none. */
export const DASHBOARD_URL = `${APOLLOCLAW_ORIGIN}/dashboard`;

/** The checkout with a plan already picked: `essentials`, `plus` or `pro` here is
 *  `college_essentials`, `college_plus` or `college_pro` there, and the paywall goes straight to
 *  Stripe with it. */
export function buildUrlForPlan(tierId: string): string {
  return `${BUILD_URL}&plan=college_${encodeURIComponent(tierId)}`;
}
