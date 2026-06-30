import { requireUser } from "@/lib/auth";
import { ApiError, json, route } from "@/lib/http";
import { getStripe } from "@/lib/stripe/client";
import { priceIdFor } from "@/lib/stripe/prices";
import { currentPlanLookup, HOSTING_LOOKUP } from "@/lib/pricing/intro-cutoff";

// Creates a Stripe Checkout Session for The College Agent.
// Two line items in one subscription:
//   1. one-time plan fee  ($499 intro thru Aug 15 / $599 regular thereafter)
//   2. recurring monthly hosting ($25/mo)
// The webhook (app/api/stripe/webhook) reads `metadata.user_id` to upsert the
// entitlement once Stripe says the payment cleared — that's the trigger the
// dashboard waits on, NOT this route.

export const POST = route(async (req) => {
  const { user } = await requireUser();
  const email = (user.email ?? "").toLowerCase();
  if (!email) throw new ApiError(400, "invalid_request", "No email on account");

  const planLookup = currentPlanLookup();

  let planPriceId: string;
  let hostingPriceId: string;
  try {
    [planPriceId, hostingPriceId] = await Promise.all([
      priceIdFor(planLookup),
      priceIdFor(HOSTING_LOOKUP),
    ]);
  } catch (e) {
    // priceIdFor throws when the lookup_key isn't an active Stripe Price — usually
    // because the catalog hasn't been synced after a pricing change.
    throw new ApiError(
      503,
      "catalog_not_synced",
      `Stripe catalog out of sync. An admin must run the catalog sync at /admin/stripe. (${(e as Error).message})`
    );
  }

  // Prefer the request Origin so local dev redirects to localhost, not the prod site.
  const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    allow_promotion_codes: true,
    payment_method_collection: "if_required",
    // Order matters in Stripe Checkout: the FIRST line item must be the recurring
    // subscription line. The one-time plan rides along on the first invoice only.
    line_items: [
      { price: hostingPriceId, quantity: 1 },
      { price: planPriceId, quantity: 1 },
    ],
    customer_email: email,
    metadata: { user_id: user.id, plan_lookup: planLookup },
    subscription_data: { metadata: { user_id: user.id, plan_lookup: planLookup } },
    success_url: `${origin}/build/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/build?canceled=1`,
  });

  if (!session.url) throw new ApiError(502, "stripe_error", "Stripe did not return a checkout URL");
  return json({ url: session.url });
});
