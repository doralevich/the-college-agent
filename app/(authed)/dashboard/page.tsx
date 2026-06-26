import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserWorkspaces } from "@/lib/workspaces";
import { DashboardClient } from "@/components/DashboardClient";

// Server component: figure out where the student is in the funnel, then hand the flags
// to the client dashboard. State is read with the service-role client (the user is
// already authenticated; we only read their own rows).
export default async function DashboardPage() {
  const { user } = await getSession();
  if (!user) return null; // layout already redirects logged-out users

  const db = createAdminClient();
  const email = (user.email ?? "").toLowerCase();

  // Shares the layout's memberships query within this request (React cache()).
  const workspace = (await getUserWorkspaces(user.id))[0] ?? null;

  const [entRes, onboardRes, setupRes, agentRes] = await Promise.all([
    db.from("entitlements").select("status").eq("email", email).maybeSingle(),
    db.from("onboard_submissions").select("user_id", { count: "exact", head: true }).eq("user_id", user.id),
    db.from("setup_submissions").select("user_id", { count: "exact", head: true }).eq("user_id", user.id),
    // Each student has a single agent; grab its id (oldest first) so the dashboard can target
    // it for the Chat tab. null when none yet -> chat tab hidden, funnel shown.
    workspace
      ? db
          .from("agents")
          .select("agent37_id")
          .eq("workspace_id", workspace.id)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const paid = entRes.data?.status === "active";
  const onboardDone = (onboardRes.count ?? 0) > 0;
  const setupDone = (setupRes.count ?? 0) > 0;
  const agentId = (agentRes.data?.agent37_id as string | undefined) ?? null;

  return (
    <DashboardClient
      paid={paid}
      onboardDone={onboardDone}
      setupDone={setupDone}
      agentId={agentId}
    />
  );
}
