import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserWorkspaces } from "@/lib/workspaces";
import { DashboardClient } from "@/components/DashboardClient";
import type { OnboardSummary, TelegramSummary } from "@/lib/types";

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
    workspace
      ? db.from("agents").select("agent37_id", { count: "exact", head: true }).eq("workspace_id", workspace.id)
      : Promise.resolve({ count: 0 }),
  ]);

  const paid = entRes.data?.status === "active";
  const onboardDone = (onboardRes.count ?? 0) > 0;
  const setupDone = (setupRes.count ?? 0) > 0;
  const hasAgent = (agentRes.count ?? 0) > 0;

  // The Settings tab (only reachable once they have an agent) shows a read-only view of
  // the student's intake. Fetch the latest of each submission; skip the work otherwise.
  let onboardSummary: OnboardSummary | null = null;
  let telegramSummary: TelegramSummary | null = null;
  if (hasAgent) {
    const [obRes, tgRes] = await Promise.all([
      db
        .from("onboard_submissions")
        .select(
          "first_name, last_name, school_email, personal_email, phone, school, year, major, agent_name, resume_url"
        )
        .eq("user_id", user.id)
        .order("submitted_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      db
        .from("setup_submissions")
        .select("telegram_username, telegram_user_id")
        .eq("user_id", user.id)
        .order("submitted_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    onboardSummary = (obRes.data as OnboardSummary | null) ?? null;
    telegramSummary = (tgRes.data as TelegramSummary | null) ?? null;
  }

  return (
    <DashboardClient
      paid={paid}
      onboardDone={onboardDone}
      setupDone={setupDone}
      hasAgent={hasAgent}
      onboardSummary={onboardSummary}
      telegramSummary={telegramSummary}
    />
  );
}
