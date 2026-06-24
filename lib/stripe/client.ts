import "server-only";
import Stripe from "stripe";

// Server-only Stripe client. The secret key never reaches the browser (this module is
// `server-only`). Memoized — the client is stateless and reusable across requests.
//
// apiVersion is intentionally omitted so we ride the version pinned to the installed SDK
// (stripe@22.x), which is exactly what the bundled TS types describe — avoids drift.
let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return (stripe ??= new Stripe(key));
}
