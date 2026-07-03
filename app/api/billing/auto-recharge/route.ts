import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/client";
import { ApiError, json, readJson, route } from "@/lib/http";

// Auto-recharge settings (Settings -> Usage Credits). Fixed preset values only — the
// hourly credits-watch cron does the actual charging. Enabling requires a saved card:
// normally captured from the hosting subscription by the webhook; older accounts get a
// lazy resolve from their Stripe customer here.
const THRESHOLD_PRESETS_CENTS = [500, 1000, 1500];
const AMOUNT_PRESETS_CENTS = [1000, 2500, 5000];

export const POST = route(async (req) => {
  const { user } = await requireUser();
  const body = await readJson<{
    enabled?: boolean;
    threshold_cents?: number;
    amount_cents?: number;
  }>(req);

  if (typeof body.enabled !== "boolean") {
    throw new ApiError(400, "invalid_request", "Provide enabled: true or false.");
  }
  const threshold = body.threshold_cents ?? 500;
  const amount = body.amount_cents ?? 2500;
  if (!THRESHOLD_PRESETS_CENTS.includes(threshold) || !AMOUNT_PRESETS_CENTS.includes(amount)) {
    throw new ApiError(400, "invalid_amount", "Pick one of the preset amounts.");
  }

  const email = (user.email ?? "").toLowerCase();
  if (!email) throw new ApiError(400, "no_email", "Your account has no email on file.");

  const db = createAdminClient();
  const { data: ent } = await db
    .from("entitlements")
    .select("stripe_customer_id, stripe_payment_method_id")
    .eq("email", email)
    .maybeSingle();
  if (!ent) throw new ApiError(400, "no_billing", "No billing account found for this email.");

  let paymentMethodId = (ent.stripe_payment_method_id as string | null) ?? null;

  if (body.enabled && !paymentMethodId) {
    paymentMethodId = await resolvePaymentMethod((ent.stripe_customer_id as string | null) ?? null);
    if (!paymentMethodId) {
      throw new ApiError(
        400,
        "no_payment_method",
        "We couldn't find a saved card. Open Manage subscription and add one, then try again."
      );
    }
  }

  const { error } = await db
    .from("entitlements")
    .update({
      auto_recharge_enabled: body.enabled,
      auto_recharge_threshold_cents: threshold,
      auto_recharge_amount_cents: amount,
      // Fresh consent resets the strike counter so a previously-failed card can retry.
      auto_recharge_failures: 0,
      ...(paymentMethodId ? { stripe_payment_method_id: paymentMethodId } : {}),
    })
    .eq("email", email);
  if (error) throw new ApiError(500, "db_error", error.message);

  return json({ enabled: body.enabled, threshold_cents: threshold, amount_cents: amount });
});

// The card on file, from the customer's default or their hosting subscription's default.
async function resolvePaymentMethod(customerId: string | null): Promise<string | null> {
  if (!customerId) return null;
  const stripe = getStripe();
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (!customer.deleted) {
      const fromCustomer = idOf(customer.invoice_settings?.default_payment_method ?? null);
      if (fromCustomer) return fromCustomer;
    }
    const subs = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 3 });
    for (const sub of subs.data) {
      const pm = idOf(sub.default_payment_method ?? null);
      if (pm) return pm;
    }
  } catch (err) {
    console.error("[billing:auto-recharge] payment method resolve failed", customerId, err);
  }
  return null;
}

function idOf(v: string | { id: string } | null | undefined): string | null {
  if (!v) return null;
  return typeof v === "string" ? v : v.id;
}
