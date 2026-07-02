import type Stripe from "stripe";
import { agent37, Agent37Error } from "@/lib/agent37";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/client";
import { sendOrderSummaryEmail, type OrderForEmail } from "@/lib/email/order-summary";
import { sendAccountCreatedEmail } from "@/lib/email/account-created";
import { findOrCreateAuthUser } from "@/lib/auth/find-or-create-user";

// Stripe webhook. This is the ONLY thing that flips entitlements to 'active' (never a
// user-facing button). It MUST stay out of the proxy.ts auth matcher (no redirects) and
// MUST read the RAW body for signature verification — so it does NOT use the route()/
// readJson helpers. Idempotent via the stripe_events table (Stripe retries deliveries).

type DB = ReturnType<typeof createAdminClient>;
type EntStatus = "active" | "past_due" | "canceled";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) return new Response("Missing signature or secret", { status: 400 });

  const raw = await req.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    return new Response(`Signature verification failed: ${(err as Error).message}`, { status: 400 });
  }

  const db = createAdminClient();

  // Idempotency: first delivery inserts the event id; replays hit the PK and are acked.
  const { error: dupErr } = await db.from("stripe_events").insert({ id: event.id, type: event.type });
  if (dupErr) return Response.json({ received: true, duplicate: true });

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(db, event.data.object as Stripe.Checkout.Session);
        break;
      case "invoice.paid":
      case "invoice.payment_succeeded":
        await syncBySubscription(db, subIdFromInvoice(event.data.object), "active");
        break;
      case "invoice.payment_failed":
        await syncBySubscription(db, subIdFromInvoice(event.data.object), "past_due");
        break;
      case "customer.subscription.deleted":
        await syncBySubscription(db, (event.data.object as Stripe.Subscription).id, "canceled");
        break;
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const mapped = mapSubStatus(sub.status);
        if (mapped) await syncBySubscription(db, sub.id, mapped);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("[stripe webhook]", event.type, err);
    // 500 → Stripe retries. The event id row stays, so a retry would be deduped; remove it
    // so the retry can re-run the handler.
    await db.from("stripe_events").delete().eq("id", event.id);
    return new Response("handler error", { status: 500 });
  }

  return Response.json({ received: true });
}

async function handleCheckoutCompleted(db: DB, session: Stripe.Checkout.Session) {
  // Only fulfill genuinely-paid sessions.
  if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") return;

  // AI-credits top-up (mode: payment, started by /api/billing/topup): credit the box
  // budget and settle the ledger row. Nothing else about the account changes.
  if (session.metadata?.type === "credits_topup") {
    await handleCreditsTopup(db, session);
    return;
  }

  const orderId = session.metadata?.order_id ?? session.client_reference_id ?? null;
  const email = (session.customer_details?.email ?? session.customer_email ?? "").toLowerCase();
  const customerId = idOf(session.customer);
  const subscriptionId = idOf(session.subscription);
  const paymentIntentId = idOf(session.payment_intent);

  // Coerce empty string → null (an empty user_id would be an invalid uuid).
  let userId: string | null = session.metadata?.user_id || null;
  let orderRow: OrderForEmail | null = null;

  if (orderId) {
    const { data } = await db
      .from("orders")
      .update({
        status: "paid",
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        stripe_payment_intent_id: paymentIntentId,
        paid_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select("id, email, plan, hosting, support, onboarding, amount_subtotal, student_info, user_id")
      .maybeSingle();
    if (data) {
      orderRow = data as unknown as OrderForEmail;
      userId = userId || ((data as { user_id: string | null }).user_id ?? null);
    }
  }

  const entEmail = (email || orderRow?.email || "").toLowerCase();

  // Anonymous /build → Pay flow: no user_id metadata, no order row with one.
  // Find-or-create the auth user by email so the entitlement attaches to a real
  // account, then email them a magic link so they can sign in without picking a
  // password. Logged-in students short-circuit through the existing userId.
  let createdAccount = false;
  if (entEmail && !userId) {
    const firstName = (session.metadata?.first_name as string | undefined) || null;
    const lastName = (session.metadata?.last_name as string | undefined) || null;
    const { userId: resolvedId, isNew } = await findOrCreateAuthUser(db, entEmail, firstName, lastName);
    userId = resolvedId;
    createdAccount = isNew;
  }

  if (entEmail) {
    const { error: entErr } = await db.from("entitlements").upsert(
      {
        email: entEmail,
        status: "active",
        source: "stripe",
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" }
    );
    // A paid student MUST get access — never swallow this. Throwing makes the webhook 500
    // so Stripe retries (the order is already marked paid; re-running is idempotent).
    if (entErr) throw new Error(`entitlement upsert failed: ${entErr.message}`);
  }

  // Capture the card saved with the hosting subscription so credits auto-recharge can
  // charge it off-session later. Best-effort: without it, auto-recharge just stays
  // unavailable until the student re-saves a card in the billing portal.
  if (entEmail && subscriptionId) {
    try {
      const sub = await getStripe().subscriptions.retrieve(subscriptionId);
      const pm = idOf(sub.default_payment_method as string | { id: string } | null);
      if (pm) {
        await db.from("entitlements").update({ stripe_payment_method_id: pm }).eq("email", entEmail);
      }
    } catch (err) {
      console.error("[stripe webhook] payment method capture failed", err);
    }
  }

  // For freshly-auto-created accounts, ship a magic-link sign-in email. Best-effort —
  // the entitlement is already active and the student could sign in normally (password
  // reset) if delivery hiccups.
  if (createdAccount && entEmail) {
    try {
      const firstName = (session.metadata?.first_name as string | undefined) || null;
      // Skip Supabase's verify-endpoint redirect (which hash-encodes the
      // token onto an unauthenticated /dashboard render). Instead, build a
      // URL pointing straight at our /auth/callback Route Handler with the
      // server-friendly ?token_hash + ?type query params it already knows
      // how to verifyOtp + redirect with cookies set.
      const { data: linkData } = await db.auth.admin.generateLink({
        type: "magiclink",
        email: entEmail,
      });
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thecollegeagent.ai";
      const tokenHash = linkData?.properties?.hashed_token;
      const magicLink = tokenHash
        ? `${siteUrl}/auth/callback?token_hash=${encodeURIComponent(tokenHash)}&type=magiclink&next=${encodeURIComponent("/dashboard")}`
        : `${siteUrl}/auth/sign-in`;
      await sendAccountCreatedEmail({ email: entEmail, firstName, magicLink });
    } catch (err) {
      console.error("[stripe webhook] account-created email failed", err);
    }
  }

  // Best-effort post-payment notification — never let it fail the webhook.
  if (orderRow) {
    try {
      await sendOrderSummaryEmail(orderRow);
    } catch (err) {
      console.error("[stripe webhook] notify failed", err);
    }
  }
}

// Settle an AI-credits top-up: push the credit onto the student's box budget, then mark
// the pending ledger row succeeded. Ordered so a replay after a partial failure is safe:
// an already-succeeded row short-circuits before re-crediting.
async function handleCreditsTopup(db: DB, session: Stripe.Checkout.Session) {
  const { data: tx } = await db
    .from("wallet_transactions")
    .select("id, status, amount_cents")
    .eq("stripe_session_id", session.id)
    .maybeSingle();
  if (tx?.status === "succeeded") return; // replayed after the credit already landed

  // Ledger row may be missing (its insert failed at checkout time) — fall back to metadata.
  const amountCents = tx?.amount_cents ?? Number(session.metadata?.amount_cents ?? 0);
  const agentId = session.metadata?.agent37_id || null;

  if (agentId && amountCents > 0) {
    try {
      // 1 cent = 10,000 micros.
      await agent37.setBudget(agentId, { topup_micros: amountCents * 10_000 });
    } catch (err) {
      // Box gone (agent deleted between checkout and webhook): settle the row as failed so
      // support can refund, instead of leaving Stripe retrying forever.
      if (err instanceof Agent37Error && err.status === 404) {
        console.error("[stripe webhook] credits topup: agent gone", agentId, session.id);
        if (tx) {
          await db
            .from("wallet_transactions")
            .update({ status: "failed", stripe_payment_intent_id: idOf(session.payment_intent) })
            .eq("id", tx.id);
        }
        return;
      }
      throw err; // transient — 500 so Stripe retries the delivery
    }
  }

  if (tx) {
    await db
      .from("wallet_transactions")
      .update({ status: "succeeded", stripe_payment_intent_id: idOf(session.payment_intent) })
      .eq("id", tx.id);
  }
}

// Keep orders + entitlements in sync with subscription lifecycle (renewals, failures,
// cancellations).
async function syncBySubscription(db: DB, subscriptionId: string | null, status: EntStatus) {
  if (!subscriptionId) return;
  const orderStatus = status === "active" ? "paid" : status; // orders enum: pending|paid|past_due|canceled
  await db
    .from("orders")
    .update({ status: orderStatus, updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subscriptionId);
  await db
    .from("entitlements")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subscriptionId);
}

function mapSubStatus(s: Stripe.Subscription.Status): EntStatus | null {
  if (s === "active" || s === "trialing") return "active";
  if (s === "past_due" || s === "unpaid") return "past_due";
  if (s === "canceled" || s === "incomplete_expired") return "canceled";
  return null;
}

// Stripe fields are `string | { id } | null`; expand-agnostic id extraction.
function idOf(v: string | { id: string } | null | undefined): string | null {
  if (!v) return null;
  return typeof v === "string" ? v : v.id;
}

// `Invoice.subscription` typing varies across API versions — read defensively.
function subIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const sub = (invoice as unknown as { subscription?: string | { id: string } | null }).subscription;
  return idOf(sub ?? null);
}

// findOrCreateAuthUser lives in lib/auth/find-or-create-user.ts so both the
// webhook and /build/success can use the same idempotent lookup.
