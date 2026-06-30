import { ApiError, json, readJson, route } from "@/lib/http";
import { getStripe } from "@/lib/stripe/client";
import { priceIdFor } from "@/lib/stripe/prices";
import { currentPlanLookup, HOSTING_LOOKUP } from "@/lib/pricing/intro-cutoff";
import { getOptionalUserId } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

// Anonymous-friendly Stripe Checkout entrypoint.
// - Logged-in students: we pass user_id metadata so the webhook flips their
//   entitlement directly.
// - Anonymous students: we accept email + first/last name from the body, ship them
//   to Stripe, and the webhook (app/api/stripe/webhook) creates the auth user on
//   payment success and emails them a magic-link sign-in. This kills the old
//   "Pay" -> login-wall UX where students had to create an account before paying.

type Body = {
  email?: string;
  firstName?: string;
  lastName?: string;
};

export const POST = route(async (req) => {
  const body = await readJson<Body>(req);

  // Prefer the authenticated session if there is one — that's still the cleanest path
  // (no account-creation flow to walk through on the webhook side). Fall back to the
  // body-provided email for anonymous /build → Pay traffic.
  const sessionUserId = await getOptionalUserId();
  let email = (body.email ?? "").trim().toLowerCase();
  let userId: string | null = sessionUserId;

  if (sessionUserId) {
    const db = createAdminClient();
    const { data } = await db.auth.admin.getUserById(sessionUserId);
    email = (data?.user?.email ?? email).toLowerCase();
  }

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new ApiError(400, "invalid_request", "Valid email is required");
  }

  const firstName = (body.firstName ?? "").trim();
  const lastName = (body.lastName ?? "").trim();

  const planLookup = currentPlanLookup();

  let planPriceId: string;
  let hostingPriceId: string;
  try {
    [planPriceId, hostingPriceId] = await Promise.all([
      priceIdFor(planLookup),
      priceIdFor(HOSTING_LOOKUP),
    ]);
  } catch (e) {
    throw new ApiError(
      503,
      "catalog_not_synced",
      `Stripe catalog out of sync. An admin must run the catalog sync at /admin/stripe. (${(e as Error).message})`
    );
  }

  const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;

  // Metadata travels back on the webhook (subscription_data is what we read on
  // invoice.paid; metadata is what we read on checkout.session.completed). Carry
  // names so the webhook can stamp them on the freshly-created auth user.
  const metadata: Record<string, string> = { plan_lookup: planLookup };
  if (userId) metadata.user_id = userId;
  if (firstName) metadata.first_name = firstName;
  if (lastName) metadata.last_name = lastName;

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    allow_promotion_codes: true,
    payment_method_collection: "if_required",
    line_items: [
      { price: hostingPriceId, quantity: 1 },
      { price: planPriceId, quantity: 1 },
    ],
    customer_email: email,
    metadata,
    subscription_data: { metadata },
    success_url: `${origin}/build/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/build?canceled=1`,
  });

  if (!session.url) throw new ApiError(502, "stripe_error", "Stripe did not return a checkout URL");
  return json({ url: session.url });
});
