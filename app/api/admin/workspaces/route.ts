import { agent37 } from "@/lib/agent37";
import { requirePlatformAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { ApiError, json, route } from "@/lib/http";
import type { AdminWorkspaceSummary } from "@/lib/types";

// How many workspaces the god-view shows. No pagination by design — newest 50.
const LIMIT = 50;

// Resolve owner_id -> email via the service-role auth admin API. The `auth.users` table
// isn't exposed to PostgREST, so we page through listUsers (small user base under the
// allowlist) building a map for just the owners we need.
async function resolveEmails(
  admin: ReturnType<typeof createAdminClient>,
  ownerIds: string[]
): Promise<Map<string, string>> {
  const want = new Set(ownerIds);
  const map = new Map<string, string>();
  // Page until an EMPTY page (not until a short page): GoTrue may cap perPage below what
  // we request, so a page shorter than `perPage` doesn't mean we've reached the end.
  // Stop early once every owner we care about is resolved; the page cap is a safety net.
  for (let page = 1; page <= 50 && map.size < want.size; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) break;
    const users = data?.users ?? [];
    if (users.length === 0) break;
    for (const u of users) {
      if (u.email && want.has(u.id)) map.set(u.id, u.email);
    }
  }
  return map;
}

export const GET = route(async () => {
  await requirePlatformAdmin();
  const admin = createAdminClient();

  const { data: workspaces, error } = await admin
    .from("workspaces")
    .select("id, name, owner_id, created_at")
    .order("created_at", { ascending: false })
    .limit(LIMIT);
  if (error) throw new ApiError(500, "db_error", error.message);

  const rows = (workspaces ?? []) as {
    id: string;
    name: string;
    owner_id: string;
    created_at: string;
  }[];
  const ids = rows.map((w) => w.id);

  if (ids.length === 0) return json({ workspaces: [] as AdminWorkspaceSummary[] });

  // Counts + live statuses in parallel. listAgents() is a single agent37 call that
  // returns every instance account-wide; we use it to compute live "running" counts
  // without per-agent calls. Owner emails come from the auth admin API.
  const [membersRes, agentsRes, liveRes, emails] = await Promise.all([
    admin.from("memberships").select("workspace_id, user_id").in("workspace_id", ids),
    admin.from("agents").select("workspace_id, agent37_id, status").in("workspace_id", ids),
    agent37.listAgents().then(
      (r) => new Map(r.data.map((a) => [a.id, a.status])),
      () => new Map<string, string>()
    ),
    resolveEmails(admin, [...new Set(rows.map((w) => w.owner_id))]),
  ]);

  if (membersRes.error) throw new ApiError(500, "db_error", membersRes.error.message);
  if (agentsRes.error) throw new ApiError(500, "db_error", agentsRes.error.message);

  const memberCount = new Map<string, number>();
  for (const m of membersRes.data ?? []) {
    memberCount.set(m.workspace_id, (memberCount.get(m.workspace_id) ?? 0) + 1);
  }

  const agentCount = new Map<string, number>();
  const runningCount = new Map<string, number>();
  for (const a of agentsRes.data ?? []) {
    agentCount.set(a.workspace_id, (agentCount.get(a.workspace_id) ?? 0) + 1);
    const liveStatus = liveRes.get(a.agent37_id) ?? a.status;
    if (liveStatus === "running") {
      runningCount.set(a.workspace_id, (runningCount.get(a.workspace_id) ?? 0) + 1);
    }
  }

  const summaries: AdminWorkspaceSummary[] = rows.map((w) => ({
    id: w.id,
    name: w.name,
    owner_id: w.owner_id,
    owner_email: emails.get(w.owner_id) ?? null,
    created_at: w.created_at,
    member_count: memberCount.get(w.id) ?? 0,
    agent_count: agentCount.get(w.id) ?? 0,
    running_count: runningCount.get(w.id) ?? 0,
  }));

  return json({ workspaces: summaries });
});
