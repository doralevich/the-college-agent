import { requirePlatformAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { ApiError, json, route } from "@/lib/http";
import { logAudit } from "@/lib/audit";

type Ctx = { params: Promise<{ id: string }> };

// Delete a workspace outright (platform-admin only). The DB cascades the row's memberships
// and invitations, but we deliberately refuse when any agent rows still reference it: the
// cascade would drop our `agents` records while leaving the live agent37 instances running
// and billed. The admin must delete the instances first (which tears down agent37), then
// the now-empty workspace can go. This matches the UI, which only enables Delete at 0 agents.
export const DELETE = route(async (request: Request, { params }: Ctx) => {
  const { user: adminUser } = await requirePlatformAdmin();
  const { id } = await params;
  const admin = createAdminClient();

  const { data: ws, error: wsErr } = await admin
    .from("workspaces")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (wsErr) throw new ApiError(500, "db_error", wsErr.message);
  if (!ws) throw new ApiError(404, "not_found", "Workspace not found");

  const { count, error: countErr } = await admin
    .from("agents")
    .select("agent37_id", { count: "exact", head: true })
    .eq("workspace_id", id);
  if (countErr) throw new ApiError(500, "db_error", countErr.message);
  if ((count ?? 0) > 0) {
    throw new ApiError(
      409,
      "workspace_not_empty",
      "Delete this workspace's instances before deleting the workspace."
    );
  }

  const { error: delErr } = await admin.from("workspaces").delete().eq("id", id);
  if (delErr) throw new ApiError(500, "db_error", delErr.message);

  await logAudit({ actorEmail: adminUser.email, action: "workspace.delete", target: id, req: request });
  return json({ id, deleted: true });
});
