import { requireUser, requireEntitled } from "@/lib/auth";
import { json, readJson, requireTrimmed, route, ApiError } from "@/lib/http";
import { mapMembershipsToWorkspaces } from "@/lib/workspaces";
import type { Role, Workspace } from "@/lib/types";

export const GET = route(async () => {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("memberships")
    .select("role, workspaces(*)")
    .eq("user_id", user.id);
  if (error) throw new ApiError(500, "db_error", error.message);

  return json({ workspaces: mapMembershipsToWorkspaces(data) });
});

export const POST = route(async (request: Request) => {
  const { supabase, user } = await requireUser();
  // Gate workspace creation too — otherwise a logged-in non-allowlisted user could
  // bypass the dashboard access gate by calling this API directly.
  await requireEntitled(supabase);
  const { name } = await readJson<{ name?: string }>(request);
  const trimmed = requireTrimmed(name, "Workspace name is required");

  const { data, error } = await supabase
    .from("workspaces")
    .insert({ name: trimmed, owner_id: user.id })
    .select("*")
    .single();
  if (error) throw new ApiError(500, "db_error", error.message);

  return json({ workspace: { ...(data as Workspace), role: "admin" as Role } }, 201);
});
