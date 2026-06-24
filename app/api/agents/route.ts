import { agent37 } from "@/lib/agent37";
import { loadLiveAgentState, mergeAgent } from "@/lib/agents";
import { requireMember, requireUser } from "@/lib/auth";
import { requirePlatformAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_AGENT } from "@/config/agents";
import { usdToMicros } from "@/lib/format";
import { ApiError, json, readJson, route } from "@/lib/http";
import { configureAgentFromIntake, readProvisioningIntake } from "@/lib/provisioning";
import type { AgentRow, MergedAgent } from "@/lib/types";

async function resolveTemplate(): Promise<string | undefined> {
  try {
    const { data } = await agent37.listTemplates();
    const preferred = data.find((t) => t.name === DEFAULT_AGENT.template);
    if (preferred) return preferred.name;
    const builtin = data.find((t) => t.scope === "system");
    return (builtin ?? data[0])?.name;
  } catch {
    return DEFAULT_AGENT.template;
  }
}

export const GET = route(async (request: Request) => {
  const { supabase, user } = await requireUser();
  const workspaceId = new URL(request.url).searchParams.get("workspace");
  if (!workspaceId) throw new ApiError(400, "invalid_request", "workspace query param is required");

  const role = await requireMember(supabase, workspaceId, user.id);

  const { data: rows, error } = await supabase
    .from("agents")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (error) throw new ApiError(500, "db_error", error.message);

  const { live, templateImages } = await loadLiveAgentState();

  const agents: MergedAgent[] = (rows as AgentRow[]).map((row) => {
    const l = live.get(row.agent37_id);
    if (l && l.status !== row.status) {
      void supabase
        .rpc("set_agent_status", { p_agent37_id: row.agent37_id, p_status: l.status })
        .then(undefined, (err: unknown) => console.error("[agents:set_agent_status]", err));
    }
    return mergeAgent(row, l, templateImages);
  });

  return json({ agents, role });
});

export const POST = route(async (request: Request) => {
  // Agents are only ever provisioned by platform admins (for any workspace, on a user's
  // behalf). Regular users can no longer create their own — the dashboard button is gone
  // and this endpoint enforces it server-side.
  const { user } = await requirePlatformAdmin();

  // Shape is fixed server-side (DEFAULT_AGENT); the caller only picks the workspace.
  const body = await readJson<{ workspace_id?: string }>(request);

  const workspaceId = body.workspace_id;
  if (!workspaceId) throw new ApiError(400, "invalid_request", "workspace_id is required");

  // Service-role client: the admin is provisioning into a workspace they're not a member
  // of, so RLS (agents_insert checks is_workspace_admin) would reject a user-scoped insert.
  const db = createAdminClient();

  // Validate the target workspace exists and resolve its owner — the agent is tagged to
  // the end user in agent37, while created_by records the admin who provisioned it.
  const { data: workspace, error: wsError } = await db
    .from("workspaces")
    .select("owner_id")
    .eq("id", workspaceId)
    .maybeSingle();
  if (wsError) throw new ApiError(500, "db_error", wsError.message);
  if (!workspace) throw new ApiError(404, "not_found", "Workspace not found");
  const ownerId = (workspace.owner_id as string) ?? user.id;

  // Only the FIRST agent in a workspace gets wired to Telegram: getUpdates long-polling is
  // exclusive per bot token, so a second gateway on the owner's token would 409 against the
  // first and split/drop the student's messages. Admins can still create extra boxes (that's
  // intentional) — they just come up bare instead of fighting the live gateway.
  const { count: priorAgentCount } = await db
    .from("agents")
    .select("agent37_id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);
  const workspaceHadAgent = (priorAgentCount ?? 0) > 0;

  const template = await resolveTemplate();

  const agent = await agent37.createAgent({
    template,
    resources: {
      cpu: DEFAULT_AGENT.cpu,
      memory: DEFAULT_AGENT.memory,
      disk: DEFAULT_AGENT.disk,
    },
    user: ownerId,
    metadata: { app_workspace: workspaceId },
    budget: { monthly_cap_micros: usdToMicros(DEFAULT_AGENT.monthlyCapUsd) },
  });

  const { error } = await db.from("agents").insert({
    agent37_id: agent.id,
    workspace_id: workspaceId,
    name: agent.name || null,
    status: agent.status,
    template: agent.template,
    cpu: agent.resources.cpu,
    memory: agent.resources.memory,
    disk: agent.resources.disk,
    created_by: user.id,
  });
  if (error) {
    // Roll back the orphaned agent so we never bill for an untracked box.
    try {
      await agent37.deleteAgent(agent.id);
    } catch (rollbackErr) {
      console.error("[agents:rollback-failed]", agent.id, rollbackErr);
    }
    throw new ApiError(500, "db_error", error.message);
  }

  // Honor the owner's saved intake the same way the student path does — build the persona +
  // wire up Telegram if on file — but ONLY for the workspace's first agent (a second gateway
  // on the same bot token would conflict). Best-effort; the agent already exists either way.
  let configured = false;
  let configDetail =
    "workspace already has an agent — new box left bare to avoid a Telegram gateway conflict";
  if (!workspaceHadAgent) {
    const { onboard, setup } = await readProvisioningIntake(db, ownerId);
    const r = await configureAgentFromIntake(agent.id, onboard, setup);
    configured = r.configured;
    configDetail = r.detail;
    if (!configured) console.error("[agents:configure]", agent.id, configDetail);
  }

  return json({ ...agent, configured, config_detail: configDetail }, 201);
});
