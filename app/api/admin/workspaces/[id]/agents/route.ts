import { agent37 } from "@/lib/agent37";
import { requirePlatformAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { ApiError, json, route } from "@/lib/http";
import type { AdminAgentDetail, Agent, AgentRow } from "@/lib/types";

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

  // One account-wide listAgents() for live status/resources, then per-instance
  // budget+usage in parallel. Any agent37 failure degrades to nulls rather than 500.
  const live = await agent37.listAgents().then(
    (r) => new Map(r.data.map((a) => [a.id, a])),
    () => new Map<string, Agent>()
  );

  const agents: AdminAgentDetail[] = await Promise.all(
    agentRows.map(async (row) => {
      const l = live.get(row.agent37_id);
      const [budgetRes, usageRes] = await Promise.allSettled([
        agent37.getBudget(row.agent37_id),
        agent37.getUsage(row.agent37_id),
      ]);
      return {
        ...row,
        cpu: l?.resources.cpu ?? row.cpu,
        memory: l?.resources.memory ?? row.memory,
        disk: l?.resources.disk ?? row.disk,
        template: l?.template ?? row.template,
        live_status: l?.status ?? row.status,
        status_reason: l?.status_reason ?? null,
        past_due: l?.past_due ?? false,
        budget: budgetRes.status === "fulfilled" ? budgetRes.value : null,
        usage: usageRes.status === "fulfilled" ? usageRes.value : null,
      };
    })
  );

  return json({ agents });
});
