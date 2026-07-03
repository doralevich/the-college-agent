import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

// Resolve the signed-in student's Stripe customer. Two shapes of paying customer:
//  - legacy configurator flow: their most recent `orders` row (read under RLS),
//  - current /build flow: the `entitlements` row keyed by their email (no orders row is
//    written; read via the service-role client, scoped to the caller's own email).
// null → a comped/allowlist account with no Stripe billing.
export async function resolveStripeCustomerId(supabase: SupabaseClient, user: User): Promise<string | null> {
  const { data: orders } = await supabase
    .from("orders")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .not("stripe_customer_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1);

  const fromOrder = (orders?.[0]?.stripe_customer_id as string | undefined) ?? null;
  if (fromOrder) return fromOrder;

  const email = (user.email ?? "").toLowerCase();
  if (!email) return null;
  const { data: ent } = await createAdminClient()
    .from("entitlements")
    .select("stripe_customer_id")
    .eq("email", email)
    .maybeSingle();
  return (ent?.stripe_customer_id as string | null) ?? null;
}
