import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { WorkspaceProvider } from "@/components/WorkspaceProvider";
import { getUserWorkspaces } from "@/lib/workspaces";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getSession();
  if (!user) redirect("/login");

  // Self-serve: any logged-in user gets into the dashboard (bootstrapping a default
  // workspace if needed). The real gate is PAYMENT, surfaced as the onboarding
  // checklist on the page itself — no PendingApproval wall.
  const workspaces = await getUserWorkspaces(user.id);

  return (
    <WorkspaceProvider initialWorkspaces={workspaces} userEmail={user.email ?? ""}>
      {children}
    </WorkspaceProvider>
  );
}
