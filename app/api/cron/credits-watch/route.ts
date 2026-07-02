import { agent37 } from "@/lib/agent37";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/client";
import { sendCreditsLowEmail } from "@/lib/email/credits-low";
import { sendTelegramMessage } from "@/lib/telegram";

// Hourly credits sweep (Vercel cron, see vercel.json), protected by CRON_SECRET — Vercel
// sends it as `Authorization: Bearer <CRON_SECRET>` automatically. For every active,
// platform-billed account with an agent:
//
//  1. AUTO-RECHARGE (when enabled): balance below the student's threshold → charge their
//     saved card off-session and top the box budget up. A 6-hour dedupe window and a
//     3-strike failure counter keep a broken card from looping.
//  2. ALERTS: balance crossing low ($5) / critical ($1) → one email + Telegram nudge per
//     stage; the stage marker clears once the balance recovers, so alerts don't repeat.
//
// BYO-key accounts are skipped entirely — their AI spend isn't ours to watch.

export const maxDuration = 300;

const LOW_CENTS = 500;
const CRITICAL_CENTS = 100;
const RECOVERED_CENTS = 600; // clear the alert stage once safely back above "low"
const MAX_RECHARGE_FAILURES = 3;
const RECHARGE_DEDUPE_HOURS = 6;

const STAGE_RANK: Record<string, number> = { low: 1, critical: 2 };

type DB = ReturnType<typeof createAdminClient>;

type EntRow = {
  email: string;
  user_id: string;
  last_alert_stage: "low" | "critical" | null;
  auto_recharge_enabled: boolean;
  auto_recharge_threshold_cents: number;
  auto_recharge_amount_cents: number;
  auto_recharge_failures: number;
  stripe_payment_method_id: string | null;
  stripe_customer_id: string | null;
};

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return new Response("cron secret not configured", { status: 503 });
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("unauthorized", { status: 401 });
  }

  const db = createAdminClient();
  const { data: ents, error } = await db
    .from("entitlements")
    .select(
      "email, user_id, last_alert_stage, auto_recharge_enabled, auto_recharge_threshold_cents, auto_recharge_amount_cents, auto_recharge_failures, stripe_payment_method_id, stripe_customer_id"
    )
    .eq("status", "active")
    .not("user_id", "is", null);
  if (error) return new Response(`entitlements query failed: ${error.message}`, { status: 500 });

  const summary = { checked: 0, alerts: 0, recharges: 0, rechargeFailures: 0, skipped: 0 };
  for (const ent of (ents ?? []) as EntRow[]) {
    try {
      await sweepOne(db, ent, summary);
    } catch (e) {
      // One student's hiccup (box briefly down, Stripe blip) must not stall the sweep.
      console.error("[credits-watch]", ent.email, e);
    }
  }
  return Response.json(summary);
}

async function sweepOne(db: DB, ent: EntRow, summary: Record<string, number>) {
  const [msRes, setupRes, onboardRes] = await Promise.all([
    db.from("memberships").select("workspace_id").eq("user_id", ent.user_id).limit(1),
    db
      .from("setup_submissions")
      .select("anthropic_key, openai_key, telegram_token, telegram_user_id")
      .eq("user_id", ent.user_id)
      .maybeSingle(),
    db.from("onboard_submissions").select("first_name").eq("user_id", ent.user_id).maybeSingle(),
  ]);

  const setup = setupRes.data;
  if (setup?.anthropic_key || setup?.openai_key) {
    summary.skipped += 1; // BYO — self-monitored by agreement
    return;
  }

  const workspaceId = msRes.data?.[0]?.workspace_id as string | undefined;
  const { data: agents } = workspaceId
    ? await db
        .from("agents")
        .select("agent37_id")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: true })
        .limit(1)
    : { data: null };
  const agentId = agents?.[0]?.agent37_id as string | undefined;
  if (!agentId) {
    summary.skipped += 1;
    return;
  }

  summary.checked += 1;
  const budget = await agent37.getBudget(agentId);
  let remainingCents = Math.floor(
    (budget.monthly_remaining_micros + budget.topup_remaining_micros) / 10_000
  );

  // --- Auto-recharge (runs first so a successful charge can prevent the alert) ---
  if (
    ent.auto_recharge_enabled &&
    ent.stripe_payment_method_id &&
    ent.stripe_customer_id &&
    ent.auto_recharge_failures < MAX_RECHARGE_FAILURES &&
    remainingCents < ent.auto_recharge_threshold_cents
  ) {
    const since = new Date(Date.now() - RECHARGE_DEDUPE_HOURS * 3600_000).toISOString();
    const { data: recent } = await db
      .from("wallet_transactions")
      .select("id")
      .eq("user_id", ent.user_id)
      .eq("type", "auto_recharge")
      .gte("created_at", since)
      .limit(1);

    if (!recent || recent.length === 0) {
      const amount = ent.auto_recharge_amount_cents;
      try {
        const pi = await getStripe().paymentIntents.create({
          amount,
          currency: "usd",
          customer: ent.stripe_customer_id,
          payment_method: ent.stripe_payment_method_id,
          off_session: true,
          confirm: true,
          description: "The College Agent — AI credits auto-recharge",
          receipt_email: ent.email,
          metadata: { type: "credits_auto_recharge", user_id: ent.user_id },
        });
        if (pi.status === "succeeded") {
          await db.from("wallet_transactions").insert({
            user_id: ent.user_id,
            amount_cents: amount,
            type: "auto_recharge",
            status: "succeeded",
            stripe_payment_intent_id: pi.id,
          });
          await agent37.setBudget(agentId, { topup_micros: amount * 10_000 });
          if (ent.auto_recharge_failures > 0) {
            await db.from("entitlements").update({ auto_recharge_failures: 0 }).eq("email", ent.email);
          }
          remainingCents += amount;
          summary.recharges += 1;
        }
      } catch (err) {
        console.error("[credits-watch] auto-recharge failed", ent.email, err);
        summary.rechargeFailures += 1;
        const failures = ent.auto_recharge_failures + 1;
        await db.from("wallet_transactions").insert({
          user_id: ent.user_id,
          amount_cents: amount,
          type: "auto_recharge",
          status: "failed",
        });
        // Three strikes disables it — a dead card shouldn't retry forever. The low-credit
        // alert below still tells the student something needs attention.
        await db
          .from("entitlements")
          .update({
            auto_recharge_failures: failures,
            ...(failures >= MAX_RECHARGE_FAILURES ? { auto_recharge_enabled: false } : {}),
          })
          .eq("email", ent.email);
      }
    }
  }

  // --- Alerts (one per stage; only fires when severity increases) ---
  const stage: "low" | "critical" | null =
    remainingCents < CRITICAL_CENTS ? "critical" : remainingCents < LOW_CENTS ? "low" : null;

  if (!stage) {
    if (ent.last_alert_stage && remainingCents >= RECOVERED_CENTS) {
      await db.from("entitlements").update({ last_alert_stage: null }).eq("email", ent.email);
    }
    return;
  }

  const prevRank = ent.last_alert_stage ? STAGE_RANK[ent.last_alert_stage] : 0;
  if (STAGE_RANK[stage] <= prevRank) return; // already told them at this severity

  const remainingUsd = `$${(Math.max(remainingCents, 0) / 100).toFixed(2)}`;
  const firstName = (onboardRes.data?.first_name as string | undefined) ?? null;

  try {
    await sendCreditsLowEmail({
      email: ent.email,
      firstName,
      remainingUsd,
      critical: stage === "critical",
    });
  } catch (err) {
    console.error("[credits-watch] alert email failed", ent.email, err);
  }

  if (setup?.telegram_token && setup?.telegram_user_id) {
    const text =
      stage === "critical"
        ? `Your College Agent is almost out of AI credits (${remainingUsd} left). When they run out, I pause until you add more: https://thecollegeagent.ai/dashboard/credits`
        : `Heads up: your College Agent has ${remainingUsd} of AI credits left. Add more anytime: https://thecollegeagent.ai/dashboard/credits`;
    await sendTelegramMessage(setup.telegram_token, setup.telegram_user_id, text);
  }

  await db
    .from("entitlements")
    .update({ last_alert_stage: stage, last_alert_at: new Date().toISOString() })
    .eq("email", ent.email);
  summary.alerts += 1;
}
