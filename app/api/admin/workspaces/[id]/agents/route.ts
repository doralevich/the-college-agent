import { agent37 } from "@/lib/agent37";
import { loadLiveAgentState, mergeAgent } from "@/lib/agents";
import { requirePlatformAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { ApiError, json, route } from "@/lib/http";
import type { AdminAgentDetail, AgentRow } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

// Expanded detail for one workspace's instances. Fetched lazily when an admin expands a
// row, because budget/usage are per-instance agent37 calls — doing them for all 50
// workspaces upfront would be hundreds of calls on every page load.
export const GET = route(async (_request: Request, { params }: Ctx) => {
  await requirePlatformAdmin();
  const { id: workspaceId } = await params;
  const admin = createAdminClient();

  const { data: rows, error } = await admin
    .from("agents")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (error) throw new ApiError(500, "db_error", error.message);

  const agentRows = (rows ?? []) as AgentRow[];

  // One account-wide listAgents()/listTemplates() for live status + update flags, then
  // per-instance budget+usage in parallel. Any agent37 failure degrades to nulls/empty
  // rather than 500.
  const { live, templateImages } = await loadLiveAgentState();

  const agents: AdminAgentDetail[] = await Promise.all(
    agentRows.map(async (row) => {
      const [budgetRes, usageRes] = await Promise.allSettled([
        agent37.getBudget(row.agent37_id),
        agent37.getUsage(row.agent37_id),
      ]);
      return {
        ...mergeAgent(row, live.get(row.agent37_id), templateImages),
        budget: budgetRes.status === "fulfilled" ? budgetRes.value : null,
        usage: usageRes.status === "fulfilled" ? usageRes.value : null,
      };
    })
  );

  return json({ agents });
});
