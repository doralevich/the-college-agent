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

  const [entRes, onboardRes, setupRes, agentRes, leadRes] = await Promise.all([
    db.from("entitlements").select("status").eq("email", email).maybeSingle(),
    db.from("onboard_submissions").select("first_name, agent_name, avatar_url, questionnaire").eq("user_id", user.id).maybeSingle(),
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
    // Most-recent /build lead-capture row for this student, matched on either email field.
    // Lets the conversational onboarding skip the questions we already asked pre-payment.
    db
      .from("leads")
      .select("first_name, last_name, school_email, personal_email, mobile, school")
      .or(`school_email.ilike.${email},personal_email.ilike.${email}`)
      .order("captured_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
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

  // The structured class list from the intake wizard (name/days/time per class). The
  // Chat greeting uses it to surface "Today: ..." on the empty state; day matching
  // happens client-side so it follows the student's local clock, not the server's.
  const questionnaire = (onboardRes.data?.questionnaire ?? null) as Record<string, unknown> | null;
  const rawClasses = Array.isArray(questionnaire?.classes) ? (questionnaire.classes as unknown[]) : [];
  const classes = rawClasses
    .filter((c): c is Record<string, unknown> => !!c && typeof c === "object")
    .map((c) => ({
      name: String(c.name ?? "").trim(),
      days: String(c.days ?? "").trim(),
      time: String(c.time ?? "").trim(),
    }))
    .filter((c) => c.name);

  // Prefill the conversational onboarding from the /build lead row so we don't re-ask the
  // student for fields they already gave us. The component drops any step whose value is
  // already known here.
  const lead = leadRes.data as
    | {
        first_name: string | null;
        last_name: string | null;
        school_email: string | null;
        personal_email: string | null;
        mobile: string | null;
        school: string | null;
      }
    | null;
  const onboardPrefill = lead
    ? {
        firstName: lead.first_name ?? "",
        lastName: lead.last_name ?? "",
        schoolEmail: lead.school_email ?? "",
        personalEmail: lead.personal_email ?? "",
        phone: lead.mobile ?? "",
        school: lead.school ?? "",
      }
    : null;

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
      onboardPrefill={onboardPrefill}
      classes={classes}
    />
  );
}
