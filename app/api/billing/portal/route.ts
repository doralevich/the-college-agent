import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/client";
import { ApiError, json, route } from "@/lib/http";

// Open the Stripe billing portal for the signed-in student so they can update the card on
// file, view invoices, or cancel their hosting. The Stripe customer lives in one of two
// places depending on how they bought:
//  - legacy configurator flow: their most recent `orders` row (RLS scopes the read),
//  - current /build flow: the `entitlements` row keyed by their email (no orders row is
//    written; read via the service-role client, scoped to the caller's own email).
// Neither → a comped/allowlist account with no Stripe billing, so there's nothing to manage.
export const POST = route(async (req) => {
  const { supabase, user } = await requireUser();

  const { data: orders } = await supabase
    .from("orders")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .not("stripe_customer_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1);

  let customerId = (orders?.[0]?.stripe_customer_id as string | undefined) ?? null;

  if (!customerId) {
    const email = (user.email ?? "").toLowerCase();
    if (email) {
      const { data: ent } = await createAdminClient()
        .from("entitlements")
        .select("stripe_customer_id")
        .eq("email", email)
        .maybeSingle();
      customerId = (ent?.stripe_customer_id as string | null) ?? null;
    }
  }

  if (!customerId) {
    throw new ApiError(400, "no_billing", "No billing account is attached to your subscription.");
  }

  // Prefer the request Origin so local dev returns to localhost, not the prod site.
  const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/dashboard/billing`,
  });

  if (!session.url) throw new ApiError(502, "stripe_error", "Stripe did not return a portal URL");
  return json({ url: session.url });
});
