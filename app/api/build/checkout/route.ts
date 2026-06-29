import { requireUser } from "@/lib/auth";
import { ApiError, json, readJson, route } from "@/lib/http";
import { getStripe } from "@/lib/stripe/client";
import { priceIdFor } from "@/lib/stripe/prices";

// Creates a Stripe Checkout Session for the single-plan College Agent subscription
// (monthly $29.99 or school-year $299.99). Replaces the per-tier configurator session
// that used to live here. The webhook (app/api/stripe/webhook) reads `metadata.user_id`
// to upsert the entitlement once Stripe says the payment cleared — that's the trigger
// the dashboard waits on, NOT this route.

const PLAN_LOOKUPS = {
  monthly: "ca_monthly",
  annual: "ca_annual",
} as const;

type PlanKey = keyof typeof PLAN_LOOKUPS;

export const POST = route(async (req) => {
  const { user } = await requireUser();
  const email = (user.email ?? "").toLowerCase();
  if (!email) throw new ApiError(400, "invalid_request", "No email on account");

  const body = await readJson<{ plan?: string }>(req);
  const plan = body.plan as PlanKey | undefined;
  if (!plan || !(plan in PLAN_LOOKUPS)) {
    throw new ApiError(400, "invalid_request", `Invalid plan: ${String(body.plan)}`);
  }

  let priceId: string;
  try {
    priceId = await priceIdFor(PLAN_LOOKUPS[plan]);
  } catch (e) {
    // priceIdFor throws when the lookup_key isn't an active Stripe Price — usually
    // because the catalog hasn't been synced yet for ca_monthly / ca_annual.
    throw new ApiError(
      503,
      "catalog_not_synced",
      `Stripe catalog out of sync for '${PLAN_LOOKUPS[plan]}'. An admin must run the Stripe catalog sync at /admin/stripe. (${(e as Error).message})`
    );
  }

  // Prefer the request Origin so local dev redirects to localhost, not the prod site.
  const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    allow_promotion_codes: true,
    payment_method_collection: "if_required",
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: email,
    metadata: { user_id: user.id, plan },
    subscription_data: { metadata: { user_id: user.id, plan } },
    success_url: `${origin}/build/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/build?canceled=1`,
  });

  if (!session.url) throw new ApiError(502, "stripe_error", "Stripe did not return a checkout URL");
  return json({ url: session.url });
});
