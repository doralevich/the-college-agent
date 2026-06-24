import { agent37 } from "@/lib/agent37";
import { requireUser, requireEntitled } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_AGENT } from "@/config/agents";
import { usdToMicros } from "@/lib/format";
import { ApiError, json, route } from "@/lib/http";
import { configureAgentFromIntake, readProvisioningIntake } from "@/lib/provisioning";

// Auto-provision the student's Hermes agent. Triggered by the dashboard once they've
// PAID (entitlement active) and completed BOTH onboarding steps. This is the system
// path (no platform-admin) — the business gate (paid + onboarded) authorizes the spend.
export const maxDuration = 300;

export const POST = route(async () => {
  const { supabase, user } = await requireUser();

  // Paid gate (entitlements.status === 'active' via can_create_agent RPC).
  await requireEntitled(supabase);

  const db = createAdminClient();

  // The student's personal workspace (the dashboard layout guarantees one exists).
  const { data: ms } = await db.from("memberships").select("workspace_id").eq("user_id", user.id).limit(1);
  const workspaceId = ms?.[0]?.workspace_id as string | undefined;
  if (!workspaceId) throw new ApiError(400, "no_workspace", "No workspace for this account yet");

  // Already provisioned? Return it (idempotent — the checklist may fire more than once).
  const { data: existing } = await db
    .from("agents")
    .select("agent37_id")
    .eq("workspace_id", workspaceId)
    .limit(1);
  if (existing && existing.length > 0) {
    return json({ ok: true, agent37_id: existing[0].agent37_id, already: true });
  }

  // The student path REQUIRES both onboarding artifacts (the dashboard only enables the
  // create button once both are done). Admin-create is the lenient path (bare if missing).
  const { onboard, setup } = await readProvisioningIntake(db, user.id);
  if (!setup?.telegram_token || !setup?.telegram_user_id) {
    throw new ApiError(400, "setup_incomplete", "Finish Telegram setup first");
  }
  if (!onboard) throw new ApiError(400, "onboard_incomplete", "Finish onboarding first");

  // Create the Hermes instance, tagged to the student, at the default monthly cap.
  const agent = await agent37.createAgent({
    template: DEFAULT_AGENT.template,
    resources: { cpu: DEFAULT_AGENT.cpu, memory: DEFAULT_AGENT.memory, disk: DEFAULT_AGENT.disk },
    user: user.id,
    name: onboard.agent_name || "Hermes",
    metadata: { app_workspace: workspaceId, provisioned_for: user.id },
    budget: { monthly_cap_micros: usdToMicros(DEFAULT_AGENT.monthlyCapUsd) },
  });

  const { error: insErr } = await db.from("agents").insert({
    agent37_id: agent.id,
    workspace_id: workspaceId,
    name: agent.name || onboard.agent_name || "Hermes",
    status: agent.status,
    template: agent.template,
    cpu: agent.resources.cpu,
    memory: agent.resources.memory,
    disk: agent.resources.disk,
    created_by: user.id,
  });
  if (insErr) {
    // Roll back so we never bill for an untracked box.
    try {
      await agent37.deleteAgent(agent.id);
    } catch (e) {
      console.error("[provision:rollback-failed]", agent.id, e);
    }
    throw new ApiError(500, "db_error", insErr.message);
  }

  // Best-effort: install/config Hermes + Telegram + persona, then start the gateway.
  // If this fails the agent still exists (operator fallback finishes it in /admin).
  const { configured, detail: configDetail } = await configureAgentFromIntake(agent.id, onboard, setup);
  if (!configured) console.error("[provision:configure]", agent.id, configDetail);

  return json({ ok: true, agent37_id: agent.id, configured, configDetail }, 201);
});
