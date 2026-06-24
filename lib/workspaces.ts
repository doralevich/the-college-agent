import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Role, Workspace, WorkspaceWithRole } from "@/lib/types";

type MembershipRow = { role: string; workspaces: unknown };
type AdminDB = ReturnType<typeof createAdminClient>;

// The literal every workspace used to be bootstrapped with. Still recognized as an
// "auto-generated" name so the post-intake rename and the 0008 backfill can upgrade
// legacy rows without clobbering a name a student set by hand.
const LEGACY_WORKSPACE_NAME = "My Workspace";

// Auto-generated workspaces are named "<who>'s Workspace", best identity first: the
// student's intake first name, falling back to their email handle (the local-part before
// "@"). The bootstrap, the post-intake rename, and the 0008 SQL backfill all derive names
// this way so the three never drift. Returns the legacy literal only when we have neither
// identity — in practice never, since every account has an email.
export function deriveWorkspaceName(identity: {
  firstName?: string | null;
  email?: string | null;
}): string {
  const first = identity.firstName?.trim();
  if (first) return `${first}'s Workspace`;
  const handle = identity.email?.split("@")[0]?.trim();
  if (handle) return `${handle}'s Workspace`;
  return LEGACY_WORKSPACE_NAME;
}

// True when `name` is still one of the names we auto-generate for this owner — the legacy
// default or their email-handle default. Lets the rename upgrade an untouched default to
// the student's first name while leaving a name they chose in Settings alone.
function isAutoWorkspaceName(name: string, email: string | null | undefined): boolean {
  return name === LEGACY_WORKSPACE_NAME || name === deriveWorkspaceName({ email });
}

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

  const name = await defaultWorkspaceName(db, userId);
  const { error } = await db.from("workspaces").insert({ name, owner_id: userId });
  if (error) console.error("[dashboard:default-workspace]", error);
  return load();
});

// The name for a freshly bootstrapped workspace: the owner's intake first name if they've
// already onboarded, else their email handle. Both reads only run on the first-visit insert
// path (getUserWorkspaces early-returns once a workspace exists), so the cost is negligible.
async function defaultWorkspaceName(db: AdminDB, userId: string): Promise<string> {
  const [userRes, intakeRes] = await Promise.all([
    db.auth.admin.getUserById(userId),
    db.from("onboard_submissions").select("first_name").eq("user_id", userId).maybeSingle(),
  ]);
  return deriveWorkspaceName({
    firstName: intakeRes.data?.first_name as string | null | undefined,
    email: userRes.data?.user?.email,
  });
}

// Once a student submits intake, upgrade their auto-named workspace to "<First>'s
// Workspace" (the email-handle default was set on their first dashboard visit, before we
// knew their name). No-op when they have no first name, no owned workspace, or already
// renamed it themselves. Called from the onboard-submit route after the upsert succeeds.
export async function renameWorkspaceFromIntake(
  db: AdminDB,
  userId: string,
  firstName: string | null | undefined
): Promise<void> {
  const first = firstName?.trim();
  if (!first) return;

  const { data: userRes } = await db.auth.admin.getUserById(userId);
  const email = userRes?.user?.email ?? null;
  const target = deriveWorkspaceName({ firstName: first, email });

  const { data: rows } = await db.from("workspaces").select("id, name").eq("owner_id", userId);
  for (const w of (rows ?? []) as { id: string; name: string }[]) {
    if (w.name !== target && isAutoWorkspaceName(w.name, email)) {
      const { error } = await db.from("workspaces").update({ name: target }).eq("id", w.id);
      if (error) console.error("[onboard:rename-workspace]", error);
    }
  }
}
