import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserWorkspaces } from "@/lib/workspaces";
import { parseDashboardRoute } from "@/lib/dashboard-tabs";
import { DashboardClient } from "@/components/DashboardClient";

type Props = {
  params: Promise<{ tab?: string[] }>;
};

// Server component: figure out where the student is in the funnel, then hand the flags
// to the client dashboard. State is read with the service-role client (the user is
// already authenticated; we only read their own rows).
export default async function DashboardPage({ params }: Props) {
  const { tab } = await params;
  // Valid shapes: no tab, a single known tab, or the chat tab carrying a thread id
  // (/dashboard/chat/<sessionId>). Anything else is a real 404.
  if (parseDashboardRoute(tab) === null) notFound();

  const { user } = await getSession();
  if (!user) return null; // layout already redirects logged-out users

  const db = createAdminClient();
  const email = (user.email ?? "").toLowerCase();

  // Shares the layout's memberships query within this request (React cache()).
  const workspace = (await getUserWorkspaces(user.id))[0] ?? null;

  const [entRes, onboardRes, setupRes, agentRes] = await Promise.all([
    db.from("entitlements").select("status").eq("email", email).maybeSingle(),
    db.from("onboard_submissions").select("first_name, agent_name, avatar_url").eq("user_id", user.id).maybeSingle(),
    db.from("setup_submissions").select("user_id", { count: "exact", head: true }).eq("user_id", user.id),
    // Each student has a single agent; grab its id (oldest first) so the dashboard can target
    // it for the Chat tab. null when none yet -> chat tab hidden, funnel shown.
    workspace
      ? db
          .from("agents")
          .select("agent37_id, name")
          .eq("workspace_id", workspace.id)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const paid = entRes.data?.status === "active";
  const onboardDone = !!onboardRes.data;
  const setupDone = (setupRes.count ?? 0) > 0;
  const agentId = (agentRes.data?.agent37_id as string | undefined) ?? null;
  // Prefer the student-picked name from onboarding; fall back to the provisioned
  // agent row's name (which itself defaults to "Hermes" pre-rename).
  const agentName =
    ((onboardRes.data?.agent_name as string | undefined) ?? null) ||
    ((agentRes.data?.name as string | undefined) ?? null);
  const firstName = (onboardRes.data?.first_name as string | undefined) ?? null;
  const avatarUrl = (onboardRes.data?.avatar_url as string | undefined) ?? null;

  return (
    <DashboardClient
      paid={paid}
      onboardDone={onboardDone}
      setupDone={setupDone}
      agentId={agentId}
      firstName={firstName}
      agentName={agentName}
      avatarUrl={avatarUrl}
      userId={user.id}
    />
  );
}
