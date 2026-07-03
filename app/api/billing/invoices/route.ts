import { requireUser } from "@/lib/auth";
import { resolveStripeCustomerId } from "@/lib/billing/customer";
import { getStripe } from "@/lib/stripe/client";
import { json, route } from "@/lib/http";

// The student's Stripe invoices (the plan purchase and monthly hosting), newest first, for
// the Billing tab. Credit top-ups are one-time payments, not invoices — they show in the
// AI-credits history instead. No Stripe customer → empty list (comped/allowlist account).
export const GET = route(async () => {
  const { supabase, user } = await requireUser();

  const customerId = await resolveStripeCustomerId(supabase, user);
  if (!customerId) return json({ invoices: [] });

  const stripe = getStripe();
  const res = await stripe.invoices.list({ customer: customerId, limit: 12 });

  return json({
    invoices: res.data.map((inv) => ({
      id: inv.id,
      created: inv.created, // unix seconds
      amount_cents: inv.amount_paid || inv.amount_due,
      status: inv.status, // draft | open | paid | void | uncollectible
      number: inv.number,
      pdf: inv.invoice_pdf ?? null,
    })),
  });
});
