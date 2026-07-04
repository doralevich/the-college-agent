import { agent37 } from "@/lib/agent37";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/client";
import { sendCreditsLowEmail } from "@/lib/email/credits-low";
import { sendTelegramMessage } from "@/lib/telegram";
import { syncToMailchimp } from "@/lib/newsletter";
import { bountyForClearedCount } from "@/lib/ambassador";

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
  alert_threshold_cents: number | null;
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
      "email, user_id, last_alert_stage, alert_threshold_cents, auto_recharge_enabled, auto_recharge_threshold_cents, auto_recharge_amount_cents, auto_recharge_failures, stripe_payment_method_id, stripe_customer_id"
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
  // Newsletter stragglers: rows that missed their Mailchimp mirror (key not yet
  // configured, Mailchimp blip) get retried here until they land.
  let newsletterSynced = 0;
  try {
    const { data: pending } = await db
      .from("newsletter_signups")
      .select("email")
      .eq("mailchimp_synced", false)
      .limit(50);
    for (const row of pending ?? []) {
      if (await syncToMailchimp(row.email as string)) {
        await db.from("newsletter_signups").update({ mailchimp_synced: true }).eq("email", row.email);
        newsletterSynced++;
      }
    }
  } catch (e) {
    console.error("[credits-watch] newsletter resync", e);
  }

  // Lead stragglers, same deal: build-flow leads that missed their Mailchimp mirror
  // (including every lead captured before the sync existed) retry here until both of
  // their addresses land.
  let leadsSynced = 0;
  try {
    const { data: pendingLeads } = await db
      .from("leads")
      .select("id, first_name, last_name, school_email, personal_email")
      .eq("mailchimp_synced", false)
      .limit(50);
    for (const lead of pendingLeads ?? []) {
      const member = {
        firstName: lead.first_name as string | null,
        lastName: lead.last_name as string | null,
        tags: ["build-lead"],
      };
      const school = String(lead.school_email ?? "").trim().toLowerCase();
      const personal = String(lead.personal_email ?? "").trim().toLowerCase();
      const oks = await Promise.all([
        school ? syncToMailchimp(school, member) : Promise.resolve(true),
        personal ? syncToMailchimp(personal, member) : Promise.resolve(true),
      ]);
      if (oks.every(Boolean) && (school || personal)) {
        await db.from("leads").update({ mailchimp_synced: true }).eq("id", lead.id);
        leadsSynced++;
      }
    }
  } catch (e) {
    console.error("[credits-watch] leads resync", e);
  }

  // ---- Ambassador program (July 2026 PRD) ----

  // Clearing: sales past their 7-day hold clear ONE AT A TIME, oldest first, so the
  // $75/$100 escalator counts sequentially — two sales clearing in the same run must
  // not both read the same lifetime count. The bounty tier locks at this moment and is
  // never recomputed. Review-flagged sales sit until an admin releases them.
  let salesCleared = 0;
  try {
    const { data: due } = await db
      .from("ambassador_sales")
      .select("id, ambassador_id")
      .eq("status", "pending")
      .lte("clears_at", new Date().toISOString())
      .order("clears_at", { ascending: true })
      .limit(200);
    for (const sale of due ?? []) {
      const ambassadorId = sale.ambassador_id as string | null;
      if (!ambassadorId) continue;
      const { data: amb } = await db
        .from("ambassadors")
        .select("cleared_referral_count")
        .eq("id", ambassadorId)
        .maybeSingle();
      const before = (amb?.cleared_referral_count as number | undefined) ?? 0;
      const bounty = bountyForClearedCount(before);
      const { error: updErr } = await db
        .from("ambassador_sales")
        .update({ status: "cleared", bounty_cents: bounty })
        .eq("id", sale.id)
        .eq("status", "pending"); // guard against a concurrent state change
      if (updErr) continue;
      await db.from("ambassadors").update({ cleared_referral_count: before + 1 }).eq("id", ambassadorId);
      salesCleared++;
    }
  } catch (e) {
    console.error("[credits-watch] ambassador clearing", e);
  }

  // Bi-weekly payout run (Fridays of even ISO weeks, once per run date): assembles the
  // exact amounts, nets clawbacks against new earnings, applies org splits, and QUEUES.
  // Releasing funds is a human action (PRD automation boundary) — admin marks paid.
  let payoutsQueued = 0;
  try {
    const now = new Date();
    if (now.getUTCDay() === 5 && isoWeek(now) % 2 === 0) {
      const runDate = now.toISOString().slice(0, 10);
      const { data: already } = await db.from("ambassador_payouts").select("id").eq("run_date", runDate).limit(1);
      if (!already || already.length === 0) {
        payoutsQueued = await runAmbassadorPayouts(db, runDate);
      }
    }
  } catch (e) {
    console.error("[credits-watch] ambassador payout run", e);
  }

  // Demo sandbox hygiene: sessions carry expires_at (created + 12h); this delete is the
  // enforcer. Cost control is the per-session message cap, not this.
  try {
    await db.from("demo_sessions").delete().lt("expires_at", new Date().toISOString());
  } catch (e) {
    console.error("[credits-watch] demo session cleanup", e);
  }

  return Response.json({ ...summary, newsletterSynced, leadsSynced, salesCleared, payoutsQueued });
}

function isoWeek(d: Date): number {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t.getTime() - y0.getTime()) / 86_400_000 + 1) / 7);
}

// Assemble one bi-weekly payout run. Per ambassador: sum bounties of cleared, unswept
// sales; net unapplied negative ledger adjustments (clawbacks) against them; split the
// org's share out per the org's config (or all of it when the student donates theirs).
// W-9 gate: a positive net with no W-9 on file is queued as held_no_w9 and not released.
// A negative net is recorded as-is (documents the carryover; nothing is sent).
async function runAmbassadorPayouts(db: DB, runDate: string): Promise<number> {
  const { data: salesRows } = await db
    .from("ambassador_sales")
    .select("id, ambassador_id, org_id, bounty_cents")
    .eq("status", "cleared")
    .is("payout_id", null);
  const { data: adjRows } = await db
    .from("ambassador_ledger_adjustments")
    .select("id, ambassador_id, amount_cents")
    .is("applied_to_payout_id", null);

  type Sale = { id: string; ambassador_id: string | null; org_id: string | null; bounty_cents: number | null };
  type Adj = { id: string; ambassador_id: string; amount_cents: number };
  const sales = (salesRows ?? []) as Sale[];
  const adjustments = (adjRows ?? []) as Adj[];
  if (sales.length === 0 && adjustments.length === 0) return 0;

  const ambIds = [...new Set([...sales.map((s) => s.ambassador_id), ...adjustments.map((a) => a.ambassador_id)])].filter(
    Boolean
  ) as string[];
  const { data: ambRows } = await db
    .from("ambassadors")
    .select("id, w9_on_file, payout_method, payout_handle, donate_share, org_id")
    .in("id", ambIds);
  const ambById = new Map((ambRows ?? []).map((a) => [a.id as string, a]));

  const orgIds = [...new Set(sales.map((s) => s.org_id).filter(Boolean))] as string[];
  const { data: orgRows } = orgIds.length
    ? await db.from("orgs").select("id, org_split_cents, payout_method, payout_handle").in("id", orgIds)
    : { data: [] };
  const orgById = new Map((orgRows ?? []).map((o) => [o.id as string, o]));

  let created = 0;
  for (const ambassadorId of ambIds) {
    const amb = ambById.get(ambassadorId);
    if (!amb) continue;
    const mySales = sales.filter((s) => s.ambassador_id === ambassadorId);
    const myAdjs = adjustments.filter((a) => a.ambassador_id === ambassadorId);

    let studentTotal = 0;
    const orgTotals = new Map<string, number>();
    for (const s of mySales) {
      const bounty = s.bounty_cents ?? 0;
      const org = s.org_id ? orgById.get(s.org_id) : null;
      if (org) {
        const orgShare = amb.donate_share ? bounty : Math.min((org.org_split_cents as number) ?? 0, bounty);
        orgTotals.set(s.org_id as string, (orgTotals.get(s.org_id as string) ?? 0) + orgShare);
        studentTotal += bounty - orgShare;
      } else {
        studentTotal += bounty;
      }
    }
    const adjTotal = myAdjs.reduce((sum, a) => sum + a.amount_cents, 0); // negative
    const net = studentTotal + adjTotal;

    const status = net > 0 && !amb.w9_on_file ? "held_no_w9" : "queued";
    const { data: payout, error } = await db
      .from("ambassador_payouts")
      .insert({
        ambassador_id: ambassadorId,
        payee_type: "ambassador",
        run_date: runDate,
        total_cents: net,
        status,
        method: amb.payout_method,
        handle: amb.payout_handle,
      })
      .select("id")
      .single();
    if (error || !payout) {
      console.error("[credits-watch] payout insert failed", ambassadorId, error);
      continue;
    }
    created++;

    const saleIds = mySales.map((s) => s.id);
    if (saleIds.length) await db.from("ambassador_sales").update({ payout_id: payout.id }).in("id", saleIds);
    const adjIds = myAdjs.map((a) => a.id);
    if (adjIds.length)
      await db.from("ambassador_ledger_adjustments").update({ applied_to_payout_id: payout.id }).in("id", adjIds);

    for (const [orgId, cents] of orgTotals) {
      if (cents <= 0) continue;
      const org = orgById.get(orgId);
      await db.from("ambassador_payouts").insert({
        ambassador_id: ambassadorId,
        org_id: orgId,
        payee_type: "org",
        run_date: runDate,
        total_cents: cents,
        status: "queued",
        method: org?.payout_method ?? null,
        handle: org?.payout_handle ?? null,
      });
      created++;
    }
  }
  return created;
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

  // Self-heal: a starter grant that failed at provisioning retries here every sweep until
  // it lands, recording the live error each time it doesn't.
  const { data: starterRows } = await db
    .from("wallet_transactions")
    .select("id, amount_cents")
    .eq("user_id", ent.user_id)
    .eq("type", "starter")
    .neq("status", "succeeded")
    .limit(1);
  const starter = starterRows?.[0] as { id: string; amount_cents: number } | undefined;
  if (starter) {
    try {
      await agent37.topUpBudget(agentId, starter.amount_cents * 10_000, starter.id);
      await db
        .from("wallet_transactions")
        .update({ status: "succeeded", failure_reason: null })
        .eq("id", starter.id);
      summary.recharges += 1;
    } catch (e) {
      const reason = String((e as Error)?.message ?? e).slice(0, 500);
      console.error("[credits-watch] starter retry failed", ent.email, reason);
      await db
        .from("wallet_transactions")
        .update({ status: "failed", failure_reason: reason })
        .eq("id", starter.id);
    }
  }

  // Reconcile paid-but-pending top-ups (a webhook delivery that kept failing): verify the
  // payment with Stripe directly, then deliver the credits and settle the row. Abandoned
  // checkouts expire out to 'failed' once Stripe says the session expired unpaid.
  const fifteenMinAgo = new Date(Date.now() - 15 * 60_000).toISOString();
  const { data: pendingTopups } = await db
    .from("wallet_transactions")
    .select("id, amount_cents, stripe_session_id")
    .eq("user_id", ent.user_id)
    .eq("type", "topup")
    .eq("status", "pending")
    .not("stripe_session_id", "is", null)
    .lt("created_at", fifteenMinAgo)
    .limit(3);
  for (const t of pendingTopups ?? []) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(t.stripe_session_id as string);
      if (session.payment_status === "paid") {
        await agent37.topUpBudget(agentId, (t.amount_cents as number) * 10_000, t.id as string);
        await db
          .from("wallet_transactions")
          .update({
            status: "succeeded",
            failure_reason: null,
            stripe_payment_intent_id:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : (session.payment_intent?.id ?? null),
          })
          .eq("id", t.id);
        summary.recharges += 1;
      } else if (session.status === "expired") {
        await db
          .from("wallet_transactions")
          .update({ status: "failed", failure_reason: "checkout expired unpaid" })
          .eq("id", t.id);
      }
    } catch (e) {
      const reason = String((e as Error)?.message ?? e).slice(0, 500);
      console.error("[credits-watch] pending topup reconcile failed", ent.email, reason);
      await db.from("wallet_transactions").update({ failure_reason: reason }).eq("id", t.id);
    }
  }

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
          await agent37.topUpBudget(agentId, amount * 10_000, pi.id);
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

  // --- Alerts (one per stage; only fires when severity increases). The low line is the
  // student's own threshold (Settings -> Usage Credits); critical stays fixed. ---
  const lowCents = ent.alert_threshold_cents ?? LOW_CENTS;
  const stage: "low" | "critical" | null =
    remainingCents < CRITICAL_CENTS ? "critical" : remainingCents < lowCents ? "low" : null;

  if (!stage) {
    if (ent.last_alert_stage && remainingCents >= Math.max(RECOVERED_CENTS, lowCents + 100)) {
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
