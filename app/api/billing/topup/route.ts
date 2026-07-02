import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/client";
import { ApiError, json, readJson, route } from "@/lib/http";

// Preset AI-credit top-up amounts, in cents. A fixed set — the server never trusts a raw
// client-supplied amount.
const TOPUP_PRESETS_CENTS = [1000, 2500, 5000];

// Start a hosted Stripe Checkout (one-time payment) for AI credits. A pending
// wallet_transactions row is keyed to the session; the webhook settles it and credits the
// student's box budget on checkout.session.completed (metadata.type === 'credits_topup').
export const POST = route(async (req) => {
  const { user } = await requireUser();
  const body = await readJson<{ amount_cents?: number }>(req);
  const amountCents = body.amount_cents;
  if (typeof amountCents !== "number" || !TOPUP_PRESETS_CENTS.includes(amountCents)) {
    throw new ApiError(400, "invalid_amount", "Pick one of the preset amounts.");
  }

  const db = createAdminClient();

  // Credits land on the student's box budget, so there must be a box to credit.
  const { data: ms } = await db.from("memberships").select("workspace_id").eq("user_id", user.id).limit(1);
  const workspaceId = ms?.[0]?.workspace_id as string | undefined;
  const { data: agents } = workspaceId
    ? await db
        .from("agents")
        .select("agent37_id")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: true })
        .limit(1)
    : { data: null };
  const agentId = agents?.[0]?.agent37_id as string | undefined;
  if (!agentId) throw new ApiError(400, "no_agent", "Create your agent before adding credits.");

  // Reuse their existing Stripe customer when we have one so payments stay on one profile.
  const email = (user.email ?? "").toLowerCase();
  const { data: ent } = email
    ? await db.from("entitlements").select("stripe_customer_id").eq("email", email).maybeSingle()
    : { data: null };
  const customerId = (ent?.stripe_customer_id as string | null) ?? null;

  const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    ...(customerId ? { customer: customerId } : email ? { customer_email: email } : {}),
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: amountCents,
          product_data: {
            name: "The College Agent — AI credits",
            description: "Credits for your agent's AI usage",
          },
        },
      },
    ],
    metadata: {
      type: "credits_topup",
      user_id: user.id,
      agent37_id: agentId,
      amount_cents: String(amountCents),
    },
    success_url: `${origin}/dashboard/billing?topup=success`,
    cancel_url: `${origin}/dashboard/billing?topup=canceled`,
  });
  if (!session.url) throw new ApiError(502, "stripe_error", "Stripe did not return a checkout URL");

  const { error: txErr } = await db.from("wallet_transactions").insert({
    user_id: user.id,
    amount_cents: amountCents,
    type: "topup",
    status: "pending",
    stripe_session_id: session.id,
  });
  // The webhook can reconstruct the amount from session metadata, so a failed ledger insert
  // shouldn't block the payment — log it and continue.
  if (txErr) console.error("[billing:topup] ledger insert failed", session.id, txErr.message);

  return json({ url: session.url });
});
