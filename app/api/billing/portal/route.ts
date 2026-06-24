import { requireUser } from "@/lib/auth";
import { getStripe } from "@/lib/stripe/client";
import { ApiError, json, route } from "@/lib/http";

// Open the Stripe billing portal for the signed-in student so they can view invoices, update
// the card on file, or cancel. We resolve their Stripe customer from their most recent order
// with one attached (RLS scopes the read to their own rows). No customer → a comped/allowlist
// account with no Stripe billing, so there's nothing to manage.
export const POST = route(async (req) => {
  const { supabase, user } = await requireUser();

  const { data: orders } = await supabase
    .from("orders")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .not("stripe_customer_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1);

  const customerId = orders?.[0]?.stripe_customer_id as string | undefined;
  if (!customerId) {
    throw new ApiError(400, "no_billing", "No billing account is attached to your subscription.");
  }

  // Prefer the request Origin so local dev returns to localhost, not the prod site.
  const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/dashboard`,
  });

  if (!session.url) throw new ApiError(502, "stripe_error", "Stripe did not return a portal URL");
  return json({ url: session.url });
});
