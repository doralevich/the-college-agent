import "server-only";
import { getStripe } from "./client";
import { ensureCatalogPrice } from "./seed-catalog";

// Resolve a catalog `lookupKey` (from lib/pricing.ts) to a live Stripe price id. Keeping
// the mapping in Stripe (via lookup_key) instead of hardcoding ids means the SAME code
// runs against test and live — each env just needs its catalog seeded
// (scripts/seed-stripe-catalog.mjs). Resolved ids are memoized for the process lifetime.
const cache = new Map<string, string>();

export async function priceIdFor(lookupKey: string): Promise<string> {
  const cached = cache.get(lookupKey);
  if (cached) return cached;

  const stripe = getStripe();
  const res = await stripe.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 });
  let priceId: string | null = res.data[0]?.id ?? null;
  if (!priceId) {
    // A price introduced by a fresh deploy may not exist yet in this Stripe account —
    // create it from the catalog rather than failing live checkouts until someone
    // clicks the admin sync.
    priceId = await ensureCatalogPrice(lookupKey);
  }
  if (!priceId) {
    throw new Error(
      `No active Stripe price for lookup_key '${lookupKey}'. Run: node --env-file=.env.local scripts/seed-stripe-catalog.mjs`
    );
  }
  cache.set(lookupKey, priceId);
  return priceId;
}

// Resolve many at once, preserving order. Used when assembling Checkout line items.
export async function priceIdsFor(lookupKeys: string[]): Promise<string[]> {
  return Promise.all(lookupKeys.map(priceIdFor));
}
