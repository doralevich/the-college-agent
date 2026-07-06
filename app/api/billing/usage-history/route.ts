import { agent37 } from "@/lib/agent37";
import { displayMicros } from "@/lib/markup";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { json, route } from "@/lib/http";

// The student's last six months of metered usage, oldest first, for the Usage Credits
// chart. Read live from the box's usage API per month — no snapshot table to keep in
// sync. Months before the agent existed (or a transient upstream error) resolve to $0.
export const GET = route(async () => {
  const { user } = await requireUser();
  const db = createAdminClient();

  const { data: ms } = await db.from("memberships").select("workspace_id").eq("user_id", user.id).limit(1);
  const workspaceId = ms?.[0]?.workspace_id as string | undefined;
  const { data: agents } = workspaceId
    ? await db
        .from("agents")
        .select("agent37_id")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: true })
        .limit(1)
    : { data: null };
  const agentId = agents?.[0]?.agent37_id as string | undefined;
  if (!agentId) return json({ months: [] });

  // Six periods ending with the current month, as "YYYY-MM" (UTC, matching Agent37).
  const now = new Date();
  const periods = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - i), 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  });

  // displayMicros restates each month's raw spend in student dollars (× the markup), so the
  // chart matches the marked-up "spent this month" figure on the credits card.
  const months = await Promise.all(
    periods.map((period) =>
      agent37
        .getUsage(agentId, period)
        .then((u) => ({ period, total_micros: displayMicros(u.total_micros) }))
        .catch(() => ({ period, total_micros: 0 }))
    )
  );

  return json({ months });
});
