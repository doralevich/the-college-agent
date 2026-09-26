import { cookies } from "next/headers";
import { ApiError, json, readJson, route } from "@/lib/http";
import { AMBASSADOR_PROGRAM_ENABLED, ambassadorBySlug } from "@/lib/ambassador";
import { getStripe } from "@/lib/stripe/client";
import { priceIdFor } from "@/lib/stripe/prices";
import { lookupFor, planTier, type BillingInterval } from "@/lib/pricing/intro-cutoff";
import { getOptionalUserId } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureReferralCoupon, resolveReferralCode } from "@/lib/referral";
import { limit, tooManyRequests } from "@/lib/rate-limit";

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
  // Referral share code from /build?ref=... — friend's first hosting month free,
  // referrer gets a $25 credit when this checkout completes.
  ref?: string;
  // Explicit Terms & Conditions acceptance from the /build checkbox. Required:
  // the acceptance timestamp is recorded on the session + subscription metadata.
  termsAccepted?: boolean;
  // Optional extra AI credits picked on the plan card ($10/$25/$50). Added as a
  // one-time line item; the webhook records it and provisioning delivers it.
  extraCreditsCents?: number;
  // Hosting billing choice from the plan card: monthly (default) or annual (10 x monthly).
  hostingInterval?: "monthly" | "annual";
  // Plan tier from /pricing or the /build plan card: "essentials" | "plus" | "pro". Missing or
  // unknown falls back to Essentials, so an older client still checks out on the $25 plan.
  plan?: string;
  // Audience picked on /build. Only "Student" now - faculty, administration and athletics
  // moved to ApolloClaw - but it is still carried so the webhook keeps stamping a role and
  // older in-flight checkouts do not 400 on an unexpected field.
  buyerRole?: string;
};

// Only these add-on amounts exist in the UI; anything else is ignored, never billed.
const EXTRA_CREDITS_ALLOWED_CENTS = [1000, 2500, 5000];

export const POST = route(async (req) => {
  // Each call mints a Stripe Checkout session; cap per IP so the endpoint can't be scripted
  // to spam Stripe objects. A real buyer clicks Pay a handful of times at most.
  if (!(await limit(req, "build-checkout", { max: 8, windowSeconds: 60 }))) return tooManyRequests();

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

  if (body.termsAccepted !== true) {
    throw new ApiError(400, "terms_not_accepted", "Please agree to the Terms & Conditions to continue.");
  }

  const firstName = (body.firstName ?? "").trim();
  const lastName = (body.lastName ?? "").trim();

  // One line item: the subscription for the chosen tier and interval. There is no one-time
  // fee, so nothing is due today beyond the first period. The tier's monthly AI allowance is
  // not a line item - it is granted by the webhook when the invoice is paid.
  const hostingInterval: BillingInterval = body.hostingInterval === "annual" ? "annual" : "monthly";
  const tier = planTier(body.plan);
  const hostingLookup = lookupFor(tier, hostingInterval);

  let hostingPriceId: string;
  try {
    hostingPriceId = await priceIdFor(hostingLookup);
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
  const metadata: Record<string, string> = {
    // Marks this session as ours. The Stripe account is shared with ApolloClaw and every
    // endpoint on it sees every event, so our webhook fulfils only sessions carrying this.
    product: "college-agent",
    plan_lookup: hostingLookup,
    plan_type: "student",
    // For humans reading the Stripe dashboard. The webhook resolves the tier from the price's
    // own lookup key instead, which stays true if the plan is later changed in the portal.
    plan_tier: tier.id,
  };
  const buyerRole = (body.buyerRole ?? "").trim().slice(0, 60);
  if (buyerRole) metadata.buyer_role = buyerRole;
  if (userId) metadata.user_id = userId;
  if (firstName) metadata.first_name = firstName;
  if (lastName) metadata.last_name = lastName;
  metadata.hosting_interval = hostingInterval;
  // Proof of clickwrap acceptance, kept alongside the order in Stripe.
  metadata.terms_accepted_at = new Date().toISOString();
  metadata.terms_version = "2026-09-26";

  // Ambassador link attribution (/r/{slug} cookie). Rides the metadata so the webhook
  // can attribute the sale; a promotion code entered on the Stripe page still wins.
  try {
    const ambSlug = AMBASSADOR_PROGRAM_ENABLED ? (await cookies()).get("ca_amb")?.value ?? "" : "";
    if (ambSlug && (await ambassadorBySlug(ambSlug))) metadata.ambassador_slug = ambSlug;
  } catch {
    /* attribution is best-effort; never block checkout on it */
  }

  const extraCreditsCents = EXTRA_CREDITS_ALLOWED_CENTS.includes(Number(body.extraCreditsCents))
    ? Number(body.extraCreditsCents)
    : 0;
  if (extraCreditsCents > 0) metadata.extra_credits_cents = String(extraCreditsCents);

  const stripe = getStripe();

  // Referred signup: validate the code, refuse self-referrals, and swap the promo-code
  // box for the referral coupon (Stripe won't allow both). Invalid/expired codes are
  // silently ignored — never block a paying student over a bad ref.
  let referralCoupon: string | null = null;
  const refCode = (body.ref ?? "").trim();
  if (refCode) {
    const owner = await resolveReferralCode(refCode);
    if (owner && owner.email !== email && owner.userId !== userId) {
      try {
        referralCoupon = await ensureReferralCoupon(stripe);
        metadata.referral_code = refCode.toUpperCase();
        metadata.referrer_user_id = owner.userId;
      } catch (err) {
        console.error("[build/checkout] referral coupon failed, continuing without", err);
      }
    }
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    ...(referralCoupon
      ? { discounts: [{ coupon: referralCoupon }] }
      : { allow_promotion_codes: true }),
    payment_method_collection: "if_required",
    line_items: [
      { price: hostingPriceId, quantity: 1 },
      // One-time add-on billed on the first invoice alongside the subscription.
      ...(extraCreditsCents > 0
        ? [
            {
              price_data: {
                currency: "usd",
                product_data: { name: "Extra AI usage credits" },
                unit_amount: extraCreditsCents,
              },
              quantity: 1,
            },
          ]
        : []),
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
