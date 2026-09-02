import { requireUser } from "@/lib/auth";
import { ApiError, json, route } from "@/lib/http";

// "Is my agent up yet?" — the poll target for the provisioning UI.
//
// /api/provision is long-running: it creates an Agent37 box and then configures it
// (maxDuration 300). The browser's POST can therefore time out, or have its connection
// dropped, while the server keeps going and succeeds. When that happened the spinner sat
// there forever even though the agent already existed — only a manual refresh revealed it.
// The client now polls this instead of trusting that one long request to resolve.
//
// Deliberately cheap: two indexed, user-scoped reads and NO Agent37 call, so it's safe to
// hit every few seconds. Uses the caller's RLS-scoped client — a student can only ever see
// their own workspace's agents.
export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const { supabase, user } = await requireUser();

  const { data: ms, error: msErr } = await supabase
    .from("memberships")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1);
  if (msErr) throw new ApiError(500, "db_error", msErr.message);

  const workspaceId = ms?.[0]?.workspace_id as string | undefined;
  // No workspace yet -> definitionally no agent. Not an error: the dashboard layout
  // bootstraps one on first visit, and the poll simply keeps waiting.
  if (!workspaceId) return json({ ready: false, agent37_id: null });

  const { data: rows, error } = await supabase
    .from("agents")
    .select("agent37_id")
    .eq("workspace_id", workspaceId)
    .limit(1);
  if (error) throw new ApiError(500, "db_error", error.message);

  const agentId = (rows?.[0]?.agent37_id as string | undefined) ?? null;
  return json({ ready: !!agentId, agent37_id: agentId });
});
