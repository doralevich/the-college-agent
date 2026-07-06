import { agent37 } from "@/lib/agent37";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { json, route } from "@/lib/http";

// Everything the Billing tab's AI-credits card needs in one call:
//  - byo: non-null when the student runs on their own API key (we neither bill nor meter
//    that usage; the card shows a pointer to their provider console instead)
//  - credits: live balance + this month's spend, read from the box budget/usage (null when
//    there's no agent yet or Agent37 is briefly unreachable — the UI degrades gracefully)
//  - transactions: the student's credit ledger (starter grant, top-ups), most recent first
export const GET = route(async () => {
  const { supabase, user } = await requireUser();
  const db = createAdminClient();

  const email = (user.email ?? "").toLowerCase();
  const [setupRes, msRes, txRes, entRes] = await Promise.all([
    db.from("setup_submissions").select("anthropic_key, openai_key").eq("user_id", user.id).maybeSingle(),
    db.from("memberships").select("workspace_id").eq("user_id", user.id).limit(1),
    // RLS-scoped read — the self-select policy limits this to the caller's own rows.
    supabase
      .from("wallet_transactions")
      .select("id, amount_cents, type, status, created_at")
      .order("created_at", { ascending: false })
      .limit(12),
    email
      ? db
          .from("entitlements")
          .select("auto_recharge_enabled, auto_recharge_threshold_cents, auto_recharge_amount_cents, alert_threshold_cents")
          .eq("email", email)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const setup = setupRes.data as { anthropic_key: string | null; openai_key: string | null } | null;
  const byo = setup?.anthropic_key
    ? { provider: "anthropic" as const }
    : setup?.openai_key
      ? { provider: "openai" as const }
      : null;

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

  let credits: {
    remaining_micros: number;
    spent_micros: number;
    llm_micros: number;
    search_micros: number;
    tools_micros: number;
  } | null = null;

  if (agentId && !byo) {
    // Fetched separately on purpose: a usage read failing (fresh agent with no usage
    // rows yet, legacy budget shapes) must not blank the balance too — that's how the
    // Credits tab ends up showing a bare dash. Budget is the balance; usage is garnish.
    const [budgetRes, usageRes] = await Promise.allSettled([
      agent37.getBudget(agentId),
      agent37.getUsage(agentId),
    ]);
    if (budgetRes.status === "fulfilled") {
      const budget = budgetRes.value;
      const usage = usageRes.status === "fulfilled" ? usageRes.value : null;
      credits = {
        // Spendable now: what's left of the monthly floor plus remaining top-up credits.
        // Legacy (pre-credits) budgets can miss fields — default each leg to 0 rather
        // than let a single undefined turn the whole balance into NaN.
        remaining_micros: (budget.monthly_remaining_micros ?? 0) + (budget.credit_remaining_micros ?? 0),
        spent_micros: usage?.total_micros ?? 0,
        llm_micros: usage?.by_integration?.llm?.cost_micros ?? 0,
        search_micros: usage?.by_integration?.brave?.cost_micros ?? 0,
        tools_micros: usage?.by_integration?.composio?.cost_micros ?? 0,
      };
    } else {
      console.error("[billing:credits] budget", agentId, budgetRes.reason);
    }
    if (usageRes.status === "rejected") {
      console.error("[billing:credits] usage", agentId, usageRes.reason);
    }
  }

  const ent = entRes.data as {
    auto_recharge_enabled: boolean;
    auto_recharge_threshold_cents: number;
    auto_recharge_amount_cents: number;
    alert_threshold_cents: number | null;
  } | null;
  const autoRecharge = ent
    ? {
        enabled: ent.auto_recharge_enabled,
        threshold_cents: ent.auto_recharge_threshold_cents,
        amount_cents: ent.auto_recharge_amount_cents,
      }
    : null;
  const alerts = ent ? { threshold_cents: ent.alert_threshold_cents ?? 500 } : null;

  return json({ byo, credits, transactions: txRes.data ?? [], autoRecharge, alerts });
});
