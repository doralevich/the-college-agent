import type Stripe from "stripe";
import { requireUser } from "@/lib/auth";
import { resolveStripeCustomerId } from "@/lib/billing/customer";
import { getStripe } from "@/lib/stripe/client";
import { planSubscriptionFor, portalConfigurationFor } from "@/lib/stripe/portal";
import { ApiError, json, readJson, route } from "@/lib/http";

// Open the Stripe billing portal for the signed-in student so they can switch plans, update
// the card on file, view invoices, or cancel. Customer resolution (legacy orders row or the
// current flow's entitlements row) lives in lib/billing/customer. No customer → a
// comped/allowlist account with no Stripe billing, so there's nothing to manage.
//
// Students on one of the three plans get the College Agent portal (lib/stripe/portal.ts),
// which lists only our plans. { flow: "change_plan" } opens it straight on the plan picker.
// Anyone else - or any failure building that portal - gets the default portal as before, so
// "Manage subscription" never breaks because plan switching could not be set up.

type Body = { flow?: string };

export const POST = route(async (req) => {
  const { supabase, user } = await requireUser();
  const body = await readJson<Body>(req);

  const customerId = await resolveStripeCustomerId(supabase, user);
  if (!customerId) {
    throw new ApiError(400, "no_billing", "No billing account is attached to your subscription.");
  }

  // Prefer the request Origin so local dev returns to localhost, not the prod site.
  const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  const returnUrl = `${origin}/dashboard/billing`;

  const stripe = getStripe();
  const fallback: Stripe.BillingPortal.SessionCreateParams = { customer: customerId, return_url: returnUrl };

  let session: Stripe.BillingPortal.Session;
  try {
    const params = { ...fallback };
    const sub = await planSubscriptionFor(customerId);
    if (sub) {
      params.configuration = await portalConfigurationFor(sub.interval);
      if (body.flow === "change_plan") {
        params.flow_data = {
          type: "subscription_update",
          subscription_update: { subscription: sub.id },
          after_completion: { type: "redirect", redirect: { return_url: returnUrl } },
        };
      }
    }
    session = await stripe.billingPortal.sessions.create(params);
  } catch (err) {
    console.error("[billing/portal] plan portal unavailable, using default", err);
    session = await stripe.billingPortal.sessions.create(fallback);
  }

  if (!session.url) throw new ApiError(502, "stripe_error", "Stripe did not return a portal URL");
  return json({ url: session.url });
});
