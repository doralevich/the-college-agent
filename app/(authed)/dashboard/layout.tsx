import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { WorkspaceProvider } from "@/components/WorkspaceProvider";
import { mapMembershipsToWorkspaces } from "@/lib/workspaces";
import type { WorkspaceWithRole } from "@/lib/types";

type AdminDB = ReturnType<typeof createAdminClient>;

async function loadWorkspaces(db: AdminDB, userId: string): Promise<WorkspaceWithRole[]> {
  const { data } = await db.from("memberships").select("role, workspaces(*)").eq("user_id", userId);
  return mapMembershipsToWorkspaces(data);
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getSession();
  if (!user) redirect("/login");

  // Bootstrap via the service-role client (RLS auth context is unreliable inside a
  // Server Component render). We only ever touch THIS user's own rows.
  const db = createAdminClient();

  // Self-serve: any logged-in user gets into the dashboard. The real gate is PAYMENT,
  // surfaced as the onboarding checklist on the page itself — no PendingApproval wall.
  let workspaces = await loadWorkspaces(db, user.id);
  if (workspaces.length === 0) {
    const { error } = await db.from("workspaces").insert({ name: "My Workspace", owner_id: user.id });
    if (error) console.error("[dashboard:default-workspace]", error);
    workspaces = await loadWorkspaces(db, user.id);
  }

  return (
    <WorkspaceProvider initialWorkspaces={workspaces} userEmail={user.email ?? ""}>
      {children}
    </WorkspaceProvider>
  );
}
