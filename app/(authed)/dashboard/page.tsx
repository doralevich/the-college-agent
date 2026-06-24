import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapMembershipsToWorkspaces } from "@/lib/workspaces";
import { DashboardClient } from "@/components/DashboardClient";

// Server component: figure out where the student is in the funnel, then hand the flags
// to the client dashboard. State is read with the service-role client (the user is
// already authenticated; we only read their own rows).
export default async function DashboardPage() {
  const { user } = await getSession();
  if (!user) return null; // layout already redirects logged-out users

  const db = createAdminClient();
  const email = (user.email ?? "").toLowerCase();

  const { data: memberships } = await db
    .from("memberships")
    .select("role, workspaces(*)")
    .eq("user_id", user.id);
  const workspace = mapMembershipsToWorkspaces(memberships)[0] ?? null;

  const [entRes, onboardRes, setupRes, agentRes] = await Promise.all([
    db.from("entitlements").select("status").eq("email", email).maybeSingle(),
    db.from("onboard_submissions").select("user_id", { count: "exact", head: true }).eq("user_id", user.id),
    db.from("setup_submissions").select("user_id", { count: "exact", head: true }).eq("user_id", user.id),
    workspace
      ? db.from("agents").select("agent37_id", { count: "exact", head: true }).eq("workspace_id", workspace.id)
      : Promise.resolve({ count: 0 }),
  ]);

  return (
    <DashboardClient
      paid={entRes.data?.status === "active"}
      onboardDone={(onboardRes.count ?? 0) > 0}
      setupDone={(setupRes.count ?? 0) > 0}
      hasAgent={(agentRes.count ?? 0) > 0}
    />
  );
}
