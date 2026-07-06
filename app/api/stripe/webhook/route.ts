import type Stripe from "stripe";
import { Agent37Error } from "@/lib/agent37";
import { fundCredits } from "@/lib/credits";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/client";
import { sendOrderSummaryEmail, type OrderForEmail } from "@/lib/email/order-summary";
import { sendAccountCreatedEmail } from "@/lib/email/account-created";
import { findOrCreateAuthUser } from "@/lib/auth/find-or-create-user";
import { ambassadorByPromoCode, ambassadorBySlug, AMBASSADOR_COUPON_OFF_CENTS, CLEARING_DAYS } from "@/lib/ambassador";
import { currentPlanAmountCents } from "@/lib/pricing/intro-cutoff";
import { syncToMailchimp } from "@/lib/newsletter";

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
      // Ambassador clawbacks: a refund inside the 7-day window kills a pending sale;
      // a refund or chargeback on an already-cleared sale writes a negative ledger
      // entry against the ambassador's future earnings and decrements their tier count.
      case "charge.refunded":
        await handleAmbassadorReversal(db, idOf((event.data.object as Stripe.Charge).payment_intent), "late_refund");
        break;
      case "charge.dispute.created":
        await handleAmbassadorReversal(db, idOf((event.data.object as Stripe.Dispute).payment_intent), "chargeback");
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

  // Ambassador attribution for plan purchases — best-effort; a failure here must
  // never block account fulfillment (the sale can be reconstructed by admin).
  if (session.metadata?.plan_lookup) {
    try {
      await recordAmbassadorSale(db, session);
    } catch (err) {
      console.error("[stripe webhook] ambassador sale", session.id, err);
    }
    // Demo-lead conversion: re-tag demo-lead -> paid-student in Mailchimp and flag the
    // lead rows, so nurture campaigns stop and onboarding campaigns start.
    try {
      const buyerEmail = (session.customer_details?.email ?? session.customer_email ?? "").toLowerCase();
      if (buyerEmail) {
        await db.from("demo_leads").update({ converted_to_paid: true }).eq("email", buyerEmail);
        await syncToMailchimp(buyerEmail, { tags: ["paid-student"] });
      }
    } catch (err) {
      console.error("[stripe webhook] paid-student retag", session.id, err);
    }
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

  // Extra AI credits bought at checkout (the optional add-on on /build). Recorded as a
  // pending top-up on the ledger; provisioning delivers it once the agent exists, and
  // the hourly cron reconciles any miss. The session-id lookup keeps webhook retries
  // from double-recording.
  const extraCents = Number(session.metadata?.extra_credits_cents ?? 0);
  if (userId && Number.isFinite(extraCents) && extraCents > 0) {
    const { data: existingTopup } = await db
      .from("wallet_transactions")
      .select("id")
      .eq("stripe_session_id", session.id)
      .eq("type", "topup")
      .maybeSingle();
    if (!existingTopup) {
      const { error: topupErr } = await db.from("wallet_transactions").insert({
        user_id: userId,
        amount_cents: Math.round(extraCents),
        type: "topup",
        status: "pending",
        stripe_session_id: session.id,
        stripe_payment_intent_id: paymentIntentId,
      });
      // They paid for these credits — throw so Stripe retries the webhook.
      if (topupErr) throw new Error(`extra-credits ledger insert failed: ${topupErr.message}`);
    }
  }

  // Referral reward: the friend already got their discount at checkout; credit the
  // referrer one hosting month. Throws on transient failures so Stripe retries —
  // the referrals row (unique per session) makes retries single-credit.
  await rewardReferrer(db, session, entEmail);

  // Best-effort post-payment notification — never let it fail the webhook.
  if (orderRow) {
    try {
      await sendOrderSummaryEmail(orderRow);
    } catch (err) {
      console.error("[stripe webhook] notify failed", err);
    }
  }
}

// Credit the referrer $25 (one hosting month) on a completed referred signup. Stacking
// is deliberate and uncapped: each referral is its own Stripe customer-balance credit,
// and balances roll into future invoices automatically.
async function rewardReferrer(db: DB, session: Stripe.Checkout.Session, referredEmail: string) {
  const code = session.metadata?.referral_code;
  const referrerUserId = session.metadata?.referrer_user_id;
  if (!code || !referrerUserId) return;

  // Claim the reward slot for this session. A webhook retry that already rewarded
  // short-circuits on the existing row's status.
  await db
    .from("referrals")
    .upsert(
      [
        {
          code,
          referrer_user_id: referrerUserId,
          referred_email: referredEmail || "(unknown)",
          stripe_session_id: session.id,
        },
      ],
      { onConflict: "stripe_session_id", ignoreDuplicates: true }
    );
  const { data: row } = await db
    .from("referrals")
    .select("id, status")
    .eq("stripe_session_id", session.id)
    .maybeSingle();
  if (!row || row.status === "rewarded") return;

  // Find the referrer's Stripe customer through their entitlement (email-keyed).
  const { data: userRes } = await db.auth.admin.getUserById(referrerUserId);
  const referrerEmail = (userRes?.user?.email ?? "").toLowerCase();
  const { data: ent } = referrerEmail
    ? await db.from("entitlements").select("stripe_customer_id").eq("email", referrerEmail).maybeSingle()
    : { data: null };
  const customerId = (ent?.stripe_customer_id as string | null) ?? null;

  if (!customerId) {
    // Comped/allowlist referrer with no Stripe billing: nothing to credit against.
    // Mark it so the card still counts the signup; don't retry forever.
    await db.from("referrals").update({ status: "no_customer" }).eq("id", row.id);
    return;
  }

  // Negative amount = credit toward the customer's next invoice(s).
  await getStripe().customers.createBalanceTransaction(customerId, {
    amount: -2500,
    currency: "usd",
    description: "Referral reward: a friend joined The College Agent",
  });
  await db
    .from("referrals")
    .update({ status: "rewarded", rewarded_at: new Date().toISOString() })
    .eq("id", row.id);
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
      // 1 cent = 10,000 micros. fundCredits applies the operator markup (funds
      // amount/1.05 of real headroom, keeps the spread). The ledger row id (or checkout
      // session tail) is the idempotency key, so redelivered webhooks can't double-credit.
      await fundCredits(
        agentId,
        amountCents * 10_000,
        tx ? (tx.id as string) : session.id.slice(-64)
      );
    } catch (err) {
      // Record WHY on the ledger row either way — failures must be diagnosable from the
      // database, not just from function logs.
      const reason =
        err instanceof Agent37Error
          ? `agent37 ${err.status} ${err.code}: ${err.message}`.slice(0, 500)
          : String((err as Error)?.message ?? err).slice(0, 500);
      if (tx) {
        await db
          .from("wallet_transactions")
          .update({ failure_reason: reason, stripe_payment_intent_id: idOf(session.payment_intent) })
          .eq("id", tx.id);
      }
      // Box gone (agent deleted between checkout and webhook): settle the row as failed so
      // support can refund, instead of leaving Stripe retrying forever.
      if (err instanceof Agent37Error && err.status === 404) {
        console.error("[stripe webhook] credits topup: agent gone", agentId, session.id);
        if (tx) await db.from("wallet_transactions").update({ status: "failed" }).eq("id", tx.id);
        return;
      }
      console.error("[stripe webhook] credits topup: budget call failed", agentId, session.id, reason);
      throw err; // 500 so Stripe retries the delivery (row keeps the recorded reason)
    }
  }

  if (tx) {
    await db
      .from("wallet_transactions")
      .update({
        status: "succeeded",
        stripe_payment_intent_id: idOf(session.payment_intent),
        failure_reason: null,
      })
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

// ---- Ambassador program (July 2026 PRD) ----

// Record an attributed sale. Attribution: a promotion code entered at checkout wins;
// the /r/{slug} link cookie (carried on session metadata) attributes only when no code
// was entered. Self-referrals are rejected. Cluster signals (same card fingerprint,
// rapid bursts) hold the sale in `review` for admin instead of auto-paying.
async function recordAmbassadorSale(db: DB, session: Stripe.Checkout.Session) {
  const stripe = getStripe();
  const { data: existing } = await db
    .from("ambassador_sales")
    .select("id")
    .eq("stripe_session_id", session.id)
    .maybeSingle();
  if (existing) return; // replayed delivery

  const expanded = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ["discounts.promotion_code", "payment_intent.latest_charge"],
  });

  let couponCode: string | null = null;
  for (const d of expanded.discounts ?? []) {
    const pc = (d as { promotion_code?: string | Stripe.PromotionCode | null }).promotion_code;
    if (pc && typeof pc !== "string") {
      couponCode = pc.code;
      break;
    }
    if (typeof pc === "string") {
      couponCode = (await stripe.promotionCodes.retrieve(pc)).code;
      break;
    }
  }

  let amb = couponCode ? await ambassadorByPromoCode(couponCode) : null;
  const viaCode = !!amb;
  if (!amb && session.metadata?.ambassador_slug) {
    amb = await ambassadorBySlug(session.metadata.ambassador_slug);
  }
  if (!amb) return; // house / organic sale — the orders table already records it

  const purchaserEmail = (session.customer_details?.email ?? session.customer_email ?? "").toLowerCase();
  if (purchaserEmail && purchaserEmail === amb.email.toLowerCase()) {
    console.warn("[ambassador] self-referral blocked", amb.id, purchaserEmail);
    return;
  }

  const pi = expanded.payment_intent;
  const piObj = pi && typeof pi !== "string" ? pi : null;
  const charge = piObj?.latest_charge && typeof piObj.latest_charge !== "string" ? piObj.latest_charge : null;
  const fingerprint = charge?.payment_method_details?.card?.fingerprint ?? null;

  let status = "pending";
  let reviewReason: string | null = null;
  if (fingerprint) {
    const { data: dupes } = await db
      .from("ambassador_sales")
      .select("id")
      .eq("ambassador_id", amb.id)
      .eq("card_fingerprint", fingerprint)
      .limit(1);
    if (dupes && dupes.length > 0) {
      status = "review";
      reviewReason = "same card fingerprint as an earlier signup under this ambassador";
    }
  }
  if (status === "pending") {
    const hourAgo = new Date(Date.now() - 3600_000).toISOString();
    const { count } = await db
      .from("ambassador_sales")
      .select("id", { count: "exact", head: true })
      .eq("ambassador_id", amb.id)
      .gte("created_at", hourAgo);
    if ((count ?? 0) >= 3) {
      status = "review";
      reviewReason = "rapid signup burst";
    }
  }

  await db.from("ambassador_sales").insert({
    ambassador_id: amb.id,
    org_id: amb.org_id,
    purchaser_email: purchaserEmail || null,
    stripe_customer_id: idOf(session.customer),
    stripe_payment_intent_id: idOf(session.payment_intent),
    stripe_session_id: session.id,
    coupon_code_used: couponCode,
    card_fingerprint: fingerprint,
    gross_cents: currentPlanAmountCents() - (viaCode ? AMBASSADOR_COUPON_OFF_CENTS : 0),
    status,
    review_reason: reviewReason,
    clears_at: new Date(Date.now() + CLEARING_DAYS * 86_400_000).toISOString(),
  });
}

// Refunds/chargebacks. Pending (or review) sales just flip status — no payout was ever
// owed. Cleared sales additionally write a negative ledger adjustment (netted against
// the ambassador's FUTURE earnings on the next payout run) and decrement the lifetime
// cleared count so the $75/$100 tier stays honest. Already-paid sales are not reopened.
async function handleAmbassadorReversal(db: DB, paymentIntentId: string | null, reason: "late_refund" | "chargeback") {
  if (!paymentIntentId) return;
  const { data } = await db
    .from("ambassador_sales")
    .select("id, ambassador_id, status, bounty_cents")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle();
  if (!data) return;
  const sale = data as { id: string; ambassador_id: string | null; status: string; bounty_cents: number | null };
  if (sale.status === "refunded" || sale.status === "reversed") return;
  const newStatus = reason === "chargeback" ? "reversed" : "refunded";

  await db.from("ambassador_sales").update({ status: newStatus }).eq("id", sale.id);
  if (sale.status !== "cleared") return; // never cleared → nothing owed, nothing to claw back

  if (sale.ambassador_id && sale.bounty_cents) {
    await db.from("ambassador_ledger_adjustments").insert({
      ambassador_id: sale.ambassador_id,
      sale_id: sale.id,
      amount_cents: -sale.bounty_cents,
      reason,
    });
    const { data: amb } = await db
      .from("ambassadors")
      .select("cleared_referral_count")
      .eq("id", sale.ambassador_id)
      .maybeSingle();
    const next = Math.max(0, ((amb?.cleared_referral_count as number | undefined) ?? 1) - 1);
    await db.from("ambassadors").update({ cleared_referral_count: next }).eq("id", sale.ambassador_id);
  }
}

// findOrCreateAuthUser lives in lib/auth/find-or-create-user.ts so both the
// webhook and /build/success can use the same idempotent lookup.
