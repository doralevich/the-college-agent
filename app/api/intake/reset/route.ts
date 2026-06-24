import { requireUser } from "@/lib/auth";
import { getUserWorkspaces } from "@/lib/workspaces";
import { createAdminClient } from "@/lib/supabase/admin";
import { clearStudentIntake, type IntakeStep } from "@/lib/intake";
import { ApiError, json, readJson, route } from "@/lib/http";

// Reset a student's intake so they can refill it before their agent is created. Clears one
// step ({ step: "onboard" | "setup" }) or both (no/other value). Refuses once an agent
// exists — at that point the answers are baked into a running agent, so they should use the
// agent-delete flow (which clears intake on its own) instead of silently wiping it here.
export const POST = route(async (req) => {
  const { user } = await requireUser();

  const workspace = (await getUserWorkspaces(user.id))[0];
  if (workspace) {
    const db = createAdminClient();
    const { count } = await db
      .from("agents")
      .select("agent37_id", { count: "exact", head: true })
      .eq("workspace_id", workspace.id);
    if ((count ?? 0) > 0) {
      throw new ApiError(409, "agent_exists", "Delete your agent before resetting your answers.");
    }
  }

  const { step } = await readJson<{ step?: string }>(req);
  const steps: IntakeStep[] =
    step === "onboard" ? ["onboard"] : step === "setup" ? ["setup"] : ["onboard", "setup"];

  await clearStudentIntake(user.id, steps);
  return json({ ok: true });
});
