import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { HOSTING_AMOUNT_CENTS } from "@/lib/pricing/intro-cutoff";
import { json, route } from "@/lib/http";

// The student's current subscription, for Settings → Billing. Two shapes of paying customer:
//
//  1. Legacy configurator flow — an `orders` row with the Stripe customer attached. Returns the
//     full order breakdown (plan/hosting/support/onboarding).
//  2. Current /build flow — checkout writes NO orders row; the webhook records the Stripe
//     customer + subscription on the `entitlements` row (keyed by email). Returns a slim
//     `subscription` summary (status + hosting price) instead.
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
          .select("status, stripe_customer_id")
          .eq("email", email)
          .maybeSingle()
      ).data
    : null;

  if (!ent?.stripe_customer_id) return json({ order: null, subscription: null, canManage: false });

  return json({
    order: null,
    subscription: { status: ent.status as string, hostingAmount: HOSTING_AMOUNT_CENTS },
    canManage: true,
  });
});
