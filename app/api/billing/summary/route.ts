import { requireUser } from "@/lib/auth";
import { json, route } from "@/lib/http";

// The student's current subscription, for the dashboard Billing tab. Reads their most recent
// order that has a Stripe customer attached (that's the live subscription) under RLS — the
// orders_self_select policy already scopes this to the caller's own rows. Returns null when
// there's no Stripe order (e.g. a comped/allowlist account), in which case the UI shows a
// "managed by our team" note instead of a Manage-subscription button.
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
  if (!o) return json({ order: null, canManage: false });

  return json({
    order: {
      plan: o.plan,
      hosting: o.hosting,
      support: o.support,
      onboarding: o.onboarding,
      status: o.status,
      hosting_amount: o.hosting_amount,
    },
    canManage: true,
  });
});
