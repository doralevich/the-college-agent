import { getWorkspaceOwner, requireAdmin, requireUser } from "@/lib/auth";
import { agent37 } from "@/lib/agent37";
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

  // Tear down the workspace's Agent37 agents first so none are orphaned. Concurrent —
  // each delete is independent and per-agent failures are logged, never fatal.
  const { data: rows } = await supabase.from("agents").select("agent37_id").eq("workspace_id", id);
  await Promise.allSettled(
    (rows ?? []).map((row) =>
      agent37
        .deleteAgent(row.agent37_id as string)
        .catch((err) => console.error("[workspace-delete:orphaned-agent]", row.agent37_id, err))
    )
  );

  const { error } = await supabase.from("workspaces").delete().eq("id", id);
  if (error) throw new ApiError(500, "db_error", error.message);

  return json({ id, deleted: true });
});
