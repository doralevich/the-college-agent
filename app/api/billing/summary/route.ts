import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { tierForLookup } from "@/lib/pricing/intro-cutoff";
import { getStripe } from "@/lib/stripe/client";
import { json, route } from "@/lib/http";

// The student's current subscription, for Settings → Billing. Two shapes of paying customer:
//
//  1. Legacy configurator flow — an `orders` row with the Stripe customer attached. Returns the
//     full order breakdown (plan/hosting/support/onboarding).
//  2. Current /build flow — checkout writes NO orders row; the webhook records the Stripe
//     customer + subscription on the `entitlements` row (keyed by email). Returns a slim
//     `subscription` summary: status, plus the plan read from the live Stripe subscription.
//
// The plan comes from Stripe rather than a constant. This used to return a hardcoded $25 for
// every subscriber, which was already wrong for anyone on the $250 annual price and would have
// told every Plus and Pro student they paid $25/month. The subscription's own price is the
// truth, including after a plan change in the billing portal.
//
// Neither → a comped/allowlist account with nothing to self-manage; the UI shows the
// "managed by our team" note.
export const GET = route(async () => {
  const { supabase, user } = await requireUser();

  const { data: orders } = await supabase
    .from("orders")
    .select("plan, hosting, support, onboarding, status, hosting_amount, stripe_customer_id")
    .eq("user_id", user.id)
    .not("stripe_customer_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1);

  const o = orders?.[0];
  if (o) {
    return json({
      order: {
        plan: o.plan,
        hosting: o.hosting,
        support: o.support,
        onboarding: o.onboarding,
        status: o.status,
        hosting_amount: o.hosting_amount,
      },
      subscription: null,
      canManage: true,
    });
  }

  // Entitlements has no self-select RLS policy, so read with the service-role client —
  // scoped hard to the caller's own email (the row's natural key, set by the webhook).
  const email = (user.email ?? "").toLowerCase();
  const ent = email
    ? (
        await createAdminClient()
          .from("entitlements")
          .select("status, stripe_customer_id, stripe_subscription_id")
          .eq("email", email)
          .maybeSingle()
      ).data
    : null;

  if (!ent?.stripe_customer_id) return json({ order: null, subscription: null, canManage: false });

  return json({
    order: null,
    subscription: { status: ent.status as string, plan: await planFor(ent.stripe_subscription_id) },
    canManage: true,
  });
});

export type PlanSummary = {
  /** "Essentials" / "Plus" / "Pro", or null for a price that is not one of the current tiers. */
  name: string | null;
  amountCents: number;
  interval: "month" | "year";
  /** Monthly AI allowance, or null when the price is not a current tier. */
  allowanceCents: number | null;
};

// Best-effort: a Stripe hiccup should cost the plan line, not the whole Billing page. Null
// means "show the status and point at the billing portal".
async function planFor(subscriptionId: string | null | undefined): Promise<PlanSummary | null> {
  if (!subscriptionId) return null;
  try {
    const sub = await getStripe().subscriptions.retrieve(subscriptionId);
    const price = sub.items.data[0]?.price;
    if (!price) return null;
    const tier = tierForLookup(price.lookup_key)?.tier ?? null;
    return {
      name: tier?.name ?? null,
      amountCents: price.unit_amount ?? 0,
      interval: price.recurring?.interval === "year" ? "year" : "month",
      allowanceCents: tier?.allowanceCents ?? null,
    };
  } catch (e) {
    console.error("[billing/summary] plan lookup failed", subscriptionId, e);
    return null;
  }
}
