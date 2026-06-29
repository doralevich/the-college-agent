import { agent37 } from "@/lib/agent37";
import { requireAgentAccess } from "@/lib/auth";
import { clearStudentIntake } from "@/lib/intake";
import { ApiError, json, readJson, requireTrimmed, route } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = route(async (request: Request, { params }: Ctx) => {
  const { id } = await params;
  const { supabase } = await requireAgentAccess(id, "admin");

  const { name } = await readJson<{ name?: string }>(request);
  const trimmed = requireTrimmed(name, "name is required");

  const { error } = await supabase.from("agents").update({ name: trimmed }).eq("agent37_id", id);
  if (error) throw new ApiError(500, "db_error", error.message);

  return json({ id, name: trimmed });
});

export const DELETE = route(async (_request: Request, { params }: Ctx) => {
  const { id } = await params;
  const { supabase, user, isPlatformAdmin } = await requireAgentAccess(id, "admin");

  // Tear down the Agent37 instance first: if this throws we abort before touching any
  // DB rows, leaving a clean "nothing happened" state rather than a billed orphan.
  await agent37.deleteAgent(id);

  // A student deleting their own agent re-enters the funnel. Clear ONLY the onboarding
  // intake (the "Tell the Agent About You" answers) so the dashboard requires them to
  // redo that step before a new agent can be provisioned — otherwise it would instantly
  // re-provision a billed agent from saved answers. The technical setup (Telegram /
  // BYO keys) is preserved so they don't have to re-paste those. Runs BEFORE the row
  // delete so a mid-failure keeps `hasAgent` true (no re-provision). Operators deleting
  // from /admin must NOT wipe that student's intake.
  if (!isPlatformAdmin) await clearStudentIntake(user.id, ["onboard"]);

  await supabase.from("agents").delete().eq("agent37_id", id);

  return json({ id, deleted: true });
});
