import { getWorkspaceOwner, requireAdmin, requireUser } from "@/lib/auth";
import { agent37 } from "@/lib/agent37";
import { loadLiveAgentState } from "@/lib/agents";
import { isActiveStatus } from "@/lib/format";
import { clearStudentIntake } from "@/lib/intake";
import { ApiError, json, readJson, requireTrimmed, route } from "@/lib/http";
import type { Workspace } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = route(async (request: Request, { params }: Ctx) => {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  await requireAdmin(supabase, id, user.id);

  const { name } = await readJson<{ name?: string }>(request);
  const trimmed = requireTrimmed(name, "Workspace name is required");

  const { data, error } = await supabase
    .from("workspaces")
    .update({ name: trimmed })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new ApiError(500, "db_error", error.message);

  return json({ workspace: data as Workspace });
});

export const DELETE = route(async (_request: Request, { params }: Ctx) => {
  const { id } = await params;
  const { supabase, user } = await requireUser();

  const owner = await getWorkspaceOwner(supabase, id);
  if (!owner) throw new ApiError(404, "not_found", "Workspace not found");
  if (owner !== user.id) throw new ApiError(403, "forbidden", "Only the owner can delete a workspace");

  const { data: rows } = await supabase.from("agents").select("agent37_id").eq("workspace_id", id);
  const agentIds = (rows ?? []).map((row) => row.agent37_id as string);

  // Refuse while any agent's Agent37 instance is live (running or mid-lifecycle). The owner
  // must stop or delete an active agent first, so we never pull a running box — and its
  // in-flight work — out from under them. Checked before any side effect so a block leaves
  // everything (intake included) untouched. Stopped/failed/absent boxes don't count.
  if (agentIds.length) {
    const { live } = await loadLiveAgentState();
    if (agentIds.some((aid) => isActiveStatus(live.get(aid)?.status))) {
      throw new ApiError(
        409,
        "agent_active",
        "Stop or delete your active agent before deleting this workspace."
      );
    }
  }

  // This is the self-serve owner deleting their own workspace. The dashboard re-bootstraps
  // a fresh empty workspace on the next load, so clear their onboarding + setup intake too —
  // otherwise the funnel would instantly re-provision a new (billed) agent into the new
  // workspace from the saved answers. Runs first: if it fails we abort before any teardown.
  await clearStudentIntake(user.id);

  // Tear down the workspace's Agent37 agents first so none are orphaned. Concurrent —
  // each delete is independent and per-agent failures are logged, never fatal.
  await Promise.allSettled(
    agentIds.map((aid) =>
      agent37
        .deleteAgent(aid)
        .catch((err) => console.error("[workspace-delete:orphaned-agent]", aid, err))
    )
  );

  const { error } = await supabase.from("workspaces").delete().eq("id", id);
  if (error) throw new ApiError(500, "db_error", error.message);

  return json({ id, deleted: true });
});
