import "server-only";
import { agent37, Agent37Error } from "@/lib/agent37";
import { createAdminClient } from "@/lib/supabase/admin";

// Put a real account back to the top of the funnel, on the SAME email.
//
// Testing the student journey used to mean signing up as somebody new every time, because
// nothing short of account deletion would let an account run the flow twice. The entitlements
// table shows the cost of that: test4@ through test32@designsbydaveo.com, a dozen throwaway
// identities, each with its own orders, workspace and half-finished intake, none of them
// distinguishable later from a real student who churned.
//
// A reset is the erasure in lib/account-deletion.ts minus the parts that make an account an
// account. It clears what the FUNNEL wrote and keeps what identity and billing wrote:
//
//   cleared   the Agent37 instance and its `agents` row (which cascades agent_channels and
//             checkin_schedules), chat_sessions, both intake submissions, the uploaded resume,
//             and the setup checklist
//   kept      the auth user, the workspace, memberships, the entitlement, orders, referrals
//             and wallet history
//
// Keeping the entitlement is the point. It is what "already paid" means, so a reset that
// dropped it would need a fresh checkout to test anything past the paywall - which is the
// problem, not the fix. Orders stay for the same reason: the hosting plan on the newest paid
// order picks the machine shape, so the re-run provisions the box the student actually bought.
//
// Not a substitute for deletion. A student asking to be forgotten needs purgeUserAccount.

const UPLOAD_BUCKET = "college-agent-uploads";

/** "…/college-agent-uploads/resumes/abc.pdf" -> "resumes/abc.pdf" */
function uploadObjectPath(publicUrl: string | null | undefined): string | null {
  if (!publicUrl) return null;
  const marker = `/${UPLOAD_BUCKET}/`;
  const i = publicUrl.indexOf(marker);
  return i === -1 ? null : publicUrl.slice(i + marker.length);
}

export interface ResetReport {
  /** Agent37 instance ids actually torn down. */
  agentsDeleted: string[];
  /** Rows removed, per table. */
  tablesCleared: Record<string, number>;
  storageRemoved: number;
  /** Per-step failures. A populated array with a 200 means "mostly reset, look at these". */
  errors: string[];
}

export async function resetStudentAccount(params: { userId: string }): Promise<ResetReport> {
  const { userId } = params;
  const db = createAdminClient();
  const errors: string[] = [];
  const tablesCleared: Record<string, number> = {};

  const del = async (table: string, column: string, value: string | string[]) => {
    try {
      const q = db.from(table).delete({ count: "exact" });
      const { count, error } = Array.isArray(value)
        ? await q.in(column, value)
        : await q.eq(column, value);
      if (error) errors.push(`${table}: ${error.message}`);
      else tablesCleared[table] = count ?? 0;
    } catch (e) {
      errors.push(`${table}: ${(e as Error).message}`);
    }
  };

  // The workspaces this user owns, and the instances inside them. Read before anything is
  // deleted, since the ids are what the teardown below addresses.
  const workspaceIds: string[] = [];
  const agent37Ids: string[] = [];
  try {
    const { data: ws } = await db.from("workspaces").select("id").eq("owner_id", userId);
    workspaceIds.push(...(ws ?? []).map((w) => w.id as string));
    if (workspaceIds.length) {
      const { data: ag } = await db
        .from("agents")
        .select("agent37_id")
        .in("workspace_id", workspaceIds);
      agent37Ids.push(...(ag ?? []).map((a) => a.agent37_id as string));
    }
  } catch (e) {
    errors.push(`lookup: ${(e as Error).message}`);
  }

  // Tear the instances down BEFORE dropping their rows. The other order loses the ids and
  // leaves a running box nothing in this database knows about - a billed orphan, which is the
  // failure mode this admin has spent the week clearing up by hand.
  const agentsDeleted: string[] = [];
  for (const id of agent37Ids) {
    try {
      await agent37.deleteAgent(id);
      agentsDeleted.push(id);
    } catch (e) {
      // Already gone upstream is a success for our purposes: the row should still go.
      if (e instanceof Agent37Error && e.status === 404) {
        console.warn("[account-reset] instance already gone upstream", id);
        agentsDeleted.push(id);
      } else {
        errors.push(`agent37-delete ${id}: ${(e as Error).message}`);
      }
    }
  }

  // The uploaded resume, read from the rows that are about to be deleted. Best-effort:
  // a stranded file costs storage, not correctness.
  let storageRemoved = 0;
  try {
    const { data: rows } = await db
      .from("onboard_submissions")
      .select("resume_url")
      .eq("user_id", userId);
    const paths = (rows ?? [])
      .map((r) => uploadObjectPath(r.resume_url as string | null))
      .filter((p): p is string => p !== null);
    if (paths.length) {
      const { error } = await db.storage.from(UPLOAD_BUCKET).remove(paths);
      if (error) errors.push(`storage-remove: ${error.message}`);
      else storageRemoved = paths.length;
    }
  } catch (e) {
    errors.push(`storage: ${(e as Error).message}`);
  }

  // Workspace children first, so no FK blocks the delete. `agents` takes agent_channels and
  // checkin_schedules with it - both cascade on agent37_id (migrations 0023, 0024) - so a
  // re-run starts with no connected chat app and no scheduled runs, exactly like a new student.
  if (workspaceIds.length) {
    await del("chat_sessions", "workspace_id", workspaceIds);
    await del("agents", "workspace_id", workspaceIds);
  }
  await del("onboard_submissions", "user_id", userId);
  await del("setup_submissions", "user_id", userId);
  await del("checklist_items", "user_id", userId);

  return { agentsDeleted, tablesCleared, storageRemoved, errors };
}
