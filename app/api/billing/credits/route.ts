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
          .select("auto_recharge_enabled, auto_recharge_threshold_cents, auto_recharge_amount_cents")
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
    try {
      const [budget, usage] = await Promise.all([agent37.getBudget(agentId), agent37.getUsage(agentId)]);
      credits = {
        // Spendable now: what's left of the monthly floor plus remaining top-up credits.
        remaining_micros: budget.monthly_remaining_micros + budget.topup_remaining_micros,
        spent_micros: usage.total_micros,
        llm_micros: usage.by_integration.llm.cost_micros,
        search_micros: usage.by_integration.brave.cost_micros,
        tools_micros: usage.by_integration.composio.cost_micros,
      };
    } catch (e) {
      // Balance is a nice-to-have on this screen; don't fail the whole payload over it.
      console.error("[billing:credits]", agentId, e);
    }
  }

  const ent = entRes.data as {
    auto_recharge_enabled: boolean;
    auto_recharge_threshold_cents: number;
    auto_recharge_amount_cents: number;
  } | null;
  const autoRecharge = ent
    ? {
        enabled: ent.auto_recharge_enabled,
        threshold_cents: ent.auto_recharge_threshold_cents,
        amount_cents: ent.auto_recharge_amount_cents,
      }
    : null;

  return json({ byo, credits, transactions: txRes.data ?? [], autoRecharge });
});
