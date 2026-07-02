import { agent37 } from "@/lib/agent37";
import { requireUser, requireEntitled } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_AGENT, shapeForHosting } from "@/config/agents";
import { usdToMicros } from "@/lib/format";
import { ApiError, json, route } from "@/lib/http";
import { configureAgentFromIntake, readProvisioningIntake } from "@/lib/provisioning";
import { sendWelcomeEmail } from "@/lib/email/welcome";

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
  // The welcome email only fires the FIRST time we hit this path, so repeated calls don't
  // spam the student.
  const { data: existing } = await db
    .from("agents")
    .select("agent37_id")
    .eq("workspace_id", workspaceId)
    .limit(1);
  if (existing && existing.length > 0) {
    return json({ ok: true, agent37_id: existing[0].agent37_id, already: true });
  }

  // Onboarding is the only hard prerequisite (it drives the persona / SOUL.md). Telegram is
  // OPTIONAL: if it's missing we still provision the agent — configureAgentFromIntake just
  // leaves it unconfigured rather than failing, and the student can connect Telegram later.
  const { onboard, setup } = await readProvisioningIntake(db, user.id);
  if (!onboard) throw new ApiError(400, "onboard_incomplete", "Finish onboarding first");

  // Machine shape follows the hosting plan the student bought (Basic vs Pro). Read the most
  // recent paid order; shapeForHosting falls back to the Basic floor if none is found.
  const { data: paidOrders } = await db
    .from("orders")
    .select("hosting")
    .eq("user_id", user.id)
    .eq("status", "paid")
    .order("created_at", { ascending: false })
    .limit(1);
  const shape = shapeForHosting(paidOrders?.[0]?.hosting as string | undefined);

  // Create the Hermes instance, tagged to the student, at the default monthly cap.
  const agent = await agent37.createAgent({
    template: DEFAULT_AGENT.template,
    resources: { cpu: shape.cpu, memory: shape.memory, disk: shape.disk },
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

  // One-time starter credits included with the plan. The ledger's partial unique index
  // (one 'starter' row per user, ever) makes this idempotent: deleting and rebuilding an
  // agent doesn't mint another grant. A failed grant stays on the ledger as status
  // 'failed' with the error recorded, and the next provision retries it.
  const { data: starterRow, error: starterInsErr } = await db
    .from("wallet_transactions")
    .insert({
      user_id: user.id,
      amount_cents: DEFAULT_AGENT.starterCreditsUsd * 100,
      type: "starter",
      status: "pending",
    })
    .select("id")
    .maybeSingle();
  // Conflict → they already have a starter row; retry it only if it previously failed.
  let starterId = starterRow?.id as string | undefined;
  if (!starterId && starterInsErr) {
    const { data: existing } = await db
      .from("wallet_transactions")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("type", "starter")
      .maybeSingle();
    if (existing && existing.status !== "succeeded") starterId = existing.id as string;
  }
  if (starterId) {
    try {
      await agent37.setBudget(agent.id, { topup_micros: usdToMicros(DEFAULT_AGENT.starterCreditsUsd) });
      await db
        .from("wallet_transactions")
        .update({ status: "succeeded", failure_reason: null })
        .eq("id", starterId);
    } catch (e) {
      const reason = String((e as Error)?.message ?? e).slice(0, 500);
      console.error("[provision:starter-credits]", agent.id, reason);
      await db
        .from("wallet_transactions")
        .update({ status: "failed", failure_reason: reason })
        .eq("id", starterId);
    }
  }

  // Best-effort: install/config Hermes + Telegram + persona, then start the gateway.
  // If this fails the agent still exists (operator fallback finishes it in /admin).
  const { configured, detail: configDetail } = await configureAgentFromIntake(agent.id, onboard, setup);
  if (!configured) console.error("[provision:configure]", agent.id, configDetail);

  // Fire the student-facing welcome email. Best-effort: a delivery failure is logged
  // inside sendWelcomeEmail but never breaks this route — the agent is built either way.
  await sendWelcomeEmail({
    accountEmail: user.email ?? "",
    schoolEmail: (onboard.questionnaire?.schoolEmail as string | undefined) ?? null,
    firstName: onboard.first_name,
    agentName: onboard.agent_name || agent.name,
  });

  return json({ ok: true, agent37_id: agent.id, configured, configDetail }, 201);
});
