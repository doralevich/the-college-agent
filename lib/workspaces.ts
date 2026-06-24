import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Role, Workspace, WorkspaceWithRole } from "@/lib/types";

type MembershipRow = { role: string; workspaces: unknown };

// Shared shaping for `memberships -> WorkspaceWithRole[]` (select "role, workspaces(*)").
// Used by both the GET /api/workspaces route (user-scoped client) and the dashboard
// layout bootstrap (admin client) so the cast/filter/sort never drift between them.
export function mapMembershipsToWorkspaces(rows: MembershipRow[] | null): WorkspaceWithRole[] {
  return (rows ?? [])
    .map((row) => {
      const ws = row.workspaces as Workspace | null;
      return ws ? ({ ...ws, role: row.role as Role } satisfies WorkspaceWithRole) : null;
    })
    .filter((w): w is WorkspaceWithRole => w !== null)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

// The dashboard's workspace bootstrap, owned in one place: load the signed-in user's
// workspaces (service-role client, because RLS auth context is unreliable inside a
// Server Component render) and self-serve a default one on first visit. Wrapped in
// React `cache()` so the dashboard layout and page — separate Server Component renders
// in the same request — share a single membership query instead of issuing it twice.
export const getUserWorkspaces = cache(async (userId: string): Promise<WorkspaceWithRole[]> => {
  const db = createAdminClient();
  const load = async () => {
    const { data } = await db.from("memberships").select("role, workspaces(*)").eq("user_id", userId);
    return mapMembershipsToWorkspaces(data);
  };

  const workspaces = await load();
  if (workspaces.length > 0) return workspaces;

  const { error } = await db.from("workspaces").insert({ name: "My Workspace", owner_id: userId });
  if (error) console.error("[dashboard:default-workspace]", error);
  return load();
});
