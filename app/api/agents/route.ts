import { agent37 } from "@/lib/agent37";
import { loadLiveAgentState, mergeAgent } from "@/lib/agents";
import { requireMember, requireUser } from "@/lib/auth";
import { requirePlatformAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { APP_ID, DEFAULT_AGENT, shapeForHosting } from "@/config/agents";
import { usdToMicros } from "@/lib/format";
import { ApiError, json, readJson, route } from "@/lib/http";
import { configureAgentFromIntake, readProvisioningIntake } from "@/lib/provisioning";
import { resolveTemplate } from "@/lib/agent-template";
import type { AgentRow, MergedAgent } from "@/lib/types";

// resolveTemplate moved to lib/agent-template.ts so the STUDENT path (/api/provision) gets the
// same guarantee this admin path always had. It never falls back to a stock template - only to a
// former NAME of the same build - because provisioning from the wrong image gives a paying
// student a box with no openable ports.

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

  // Match the student path: the machine shape follows the owner's purchased hosting plan
  // (Basic vs Pro). Falls back to the Basic floor when the owner has no paid order on file.
  const { data: ownerOrders } = await db
    .from("orders")
    .select("hosting")
    .eq("user_id", ownerId)
    .eq("status", "paid")
    .order("created_at", { ascending: false })
    .limit(1);
  const shape = shapeForHosting(ownerOrders?.[0]?.hosting as string | undefined);

  // One agent per workspace. The same cap ApolloClaw enforces (lib/provision.ts), and for the
  // same reason: a student has one agent, so a second one is a mistake every time.
  //
  // This used to allow the second box and merely SKIP configuring it — the reasoning was that
  // Telegram's getUpdates long-polling is exclusive per bot token, so a second in-box gateway
  // would fight the first. What that actually produced was a running, billable instance with no
  // name, no persona and no channel, sitting in a paying student's workspace looking deleted.
  // Refusing is the honest version of the same intent, and the gateway argument is gone anyway:
  // chat apps are app-side webhooks now, not a poller on the box.
  const { count: priorAgentCount, error: capError } = await db
    .from("agents")
    .select("agent37_id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);
  if (capError) throw new ApiError(500, "db_error", capError.message);
  if ((priorAgentCount ?? 0) > 0) {
    throw new ApiError(
      409,
      "conflict",
      "This workspace already has an agent. Delete it first if you need to rebuild."
    );
  }

  const template = await resolveTemplate();

  const agent = await agent37.createAgent({
    template,
    resources: {
      cpu: shape.cpu,
      memory: shape.memory,
      disk: shape.disk,
    },
    user: ownerId,
    metadata: { app: APP_ID, app_workspace: workspaceId },
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

  // Honor the owner's saved intake the same way the student path does: build the persona and
  // wire up whatever channel is on file. Unconditional now — the cap above means this is
  // always the workspace's first agent, so there is nothing to come up bare behind.
  // Best-effort; the agent already exists either way.
  const { onboard, setup } = await readProvisioningIntake(db, ownerId);
  const { configured, detail: configDetail } = await configureAgentFromIntake(
    agent.id,
    onboard,
    setup,
    { db, userId: ownerId }
  );
  if (!configured) console.error("[agents:configure]", agent.id, configDetail);

  return json({ ...agent, configured, config_detail: configDetail }, 201);
});
