import { agent37, Agent37Error } from "@/lib/agent37";
import { requireAgentAccess } from "@/lib/auth";
import { clearStudentIntake } from "@/lib/intake";
import { ApiError, json, readJson, requireTrimmed, route } from "@/lib/http";
import { createAdminClient } from "@/lib/supabase/admin";

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

export const DELETE = route(async (request: Request, { params }: Ctx) => {
  const { id } = await params;
  const { supabase, user, isPlatformAdmin } = await requireAgentAccess(id, "admin");

  // Self-service delete from the student's own "Your Agent" view sends ?reonboard=1.
  // That view always targets the CURRENT user's own agent, so clearing their intake is
  // always correct there — even for platform-admin accounts testing as students. The
  // /admin god-view omits the flag (the current user is the operator, not the owner).
  const reonboard = new URL(request.url).searchParams.get("reonboard") === "1";

  // Tear down the Agent37 instance first: if this throws we abort before touching any
  // DB rows, leaving a clean "nothing happened" state rather than a billed orphan.
  // EXCEPT for 404 — the instance is already gone, so swallow it and proceed with the
  // DB delete so admins aren't stuck with orphan rows blocking workspace cleanup.
  try {
    await agent37.deleteAgent(id);
  } catch (e) {
    if (e instanceof Agent37Error && e.status === 404) {
      console.warn("[agent:delete] upstream 404 — proceeding with DB cleanup", id);
    } else {
      throw e;
    }
  }

  // A student deleting their own agent re-enters the funnel. Clear ONLY the onboarding
  // intake (the "Tell the Agent About You" answers) so the dashboard requires them to
  // redo that step before a new agent can be provisioned — otherwise it would instantly
  // re-provision a billed agent from saved answers. The technical setup (Telegram /
  // BYO keys) is preserved so they don't have to re-paste those. Runs BEFORE the row
  // delete so a mid-failure keeps `hasAgent` true (no re-provision). Operators deleting
  // from /admin must NOT wipe that student's intake — unless this is the student's own
  // self-service "Your Agent" delete (reonboard=1), which always clears it.
  if (reonboard || !isPlatformAdmin) await clearStudentIntake(user.id, ["onboard"]);

  // Platform admins operate cross-tenant, so their session client cannot delete this row
  // through workspace RLS. Use the already-authorized service client for that case; keep
  // the RLS-scoped client for normal workspace admins.
  const db = isPlatformAdmin ? createAdminClient() : supabase;
  const { error } = await db.from("agents").delete().eq("agent37_id", id);
  if (error) throw new ApiError(500, "db_error", error.message);

  return json({ id, deleted: true });
});
