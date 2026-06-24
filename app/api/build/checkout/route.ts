import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ApiError, json, readJson, route } from "@/lib/http";
import { getStripe } from "@/lib/stripe/client";
import { priceIdFor } from "@/lib/stripe/prices";
import { PLANS, HOSTING, SUPPORT, ONBOARDING, parseSelection, dueToday } from "@/lib/pricing";

// Creates a Stripe Checkout Session for a /build order. The student must be signed in
// (account-before-checkout). We persist the order (pending) BEFORE creating the session
// so fulfillment never depends on the browser surviving the redirect — the webhook
// reconciles by metadata.order_id. NEVER trusts client amounts: prices come from Stripe,
// the selection is validated against the catalog (parseSelection).
export const POST = route(async (req) => {
  const { user } = await requireUser();
  const email = (user.email ?? "").toLowerCase();
  if (!email) throw new ApiError(400, "invalid_request", "No email on account");

  const body = await readJson<{ selection?: unknown; integrations?: unknown; studentInfo?: unknown }>(req);

  let selection;
  try {
    selection = parseSelection(body.selection);
  } catch (e) {
    throw new ApiError(400, "invalid_request", (e as Error).message);
  }

  const integrations = Array.isArray(body.integrations)
    ? body.integrations.filter((x): x is string => typeof x === "string").slice(0, 24)
    : [];
  const studentInfo =
    body.studentInfo && typeof body.studentInfo === "object" ? (body.studentInfo as Record<string, unknown>) : null;

  // Resolve Stripe prices (hosting recurring first, then one-time items).
  const hostingPriceId = await priceIdFor(HOSTING[selection.hosting].lookupKey);
  const planPriceId = await priceIdFor(PLANS[selection.plan].lookupKey);
  const supportLookup = SUPPORT[selection.support].lookupKey;
  const onboardingLookup = ONBOARDING[selection.onboarding].lookupKey;
  const supportPriceId = supportLookup ? await priceIdFor(supportLookup) : null;
  const onboardingPriceId = onboardingLookup ? await priceIdFor(onboardingLookup) : null;

  const db = createAdminClient();

  const { data: order, error } = await db
    .from("orders")
    .insert({
      user_id: user.id,
      email,
      status: "pending",
      plan: selection.plan,
      plan_price_id: planPriceId,
      plan_amount: PLANS[selection.plan].amount,
      hosting: selection.hosting,
      hosting_price_id: hostingPriceId,
      hosting_amount: HOSTING[selection.hosting].amount,
      support: selection.support,
      support_price_id: supportPriceId,
      support_amount: SUPPORT[selection.support].amount,
      onboarding: selection.onboarding,
      onboarding_price_id: onboardingPriceId,
      onboarding_amount: ONBOARDING[selection.onboarding].amount,
      integrations,
      amount_subtotal: dueToday(selection),
      student_info: studentInfo,
      config: selection,
    })
    .select("id")
    .single();
  if (error || !order) throw new ApiError(500, "db_error", error?.message ?? "Could not create order");

  const lineItems = [
    { price: hostingPriceId, quantity: 1 }, // recurring monthly
    { price: planPriceId, quantity: 1 }, // one-time → first invoice
  ];
  if (supportPriceId) lineItems.push({ price: supportPriceId, quantity: 1 });
  if (onboardingPriceId) lineItems.push({ price: onboardingPriceId, quantity: 1 });

  // Prefer the request Origin so local dev redirects to localhost, not the prod site.
  const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: lineItems,
    customer_email: email,
    client_reference_id: order.id,
    metadata: { order_id: order.id, user_id: user.id },
    subscription_data: { metadata: { order_id: order.id, user_id: user.id } },
    success_url: `${origin}/build/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/build?canceled=1`,
  });

  await db.from("orders").update({ stripe_session_id: session.id }).eq("id", order.id);

  if (!session.url) throw new ApiError(502, "stripe_error", "Stripe did not return a checkout URL");
  return json({ url: session.url });
});
