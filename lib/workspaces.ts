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
