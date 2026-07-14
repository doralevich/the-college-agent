import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { agent37 } from "@/lib/agent37";
import { removeFromMailchimp } from "@/lib/newsletter";

// Full account erasure for a data-deletion request (Item 10 of the security hardening pass).
// Admin-triggered only (see app/api/admin/users/[id]/route.ts). Deletes, in order:
//   1. every Agent37 instance the user owns (external, torn down first so none orphan)
//   2. uploaded files (resumes + avatars) from the storage bucket
//   3. every user-scoped Supabase row (children before parents for FK safety)
//   4. the marketing footprint in Mailchimp (permanent erase)
//   5. the Supabase auth user itself
// Stripe is intentionally RETAINED — payment/subscription records are kept as the financial
// system-of-record (tax/accounting/chargeback). The runbook in SECURITY_NOTES.md documents
// this and the manual Stripe step for a caller who also wants the Stripe customer redacted.
//
// Best-effort by design: each step records its outcome and the purge presses on, so one
// failing external call (a already-gone Agent37 box, a Mailchimp hiccup) never strands the
// account half-deleted. The returned report is the audit trail for the deletion log.

const UPLOAD_BUCKET = "college-agent-uploads";

// A stored public URL is like
//   https://<proj>.supabase.co/storage/v1/object/public/college-agent-uploads/resumes/abc.pdf
// Derive the in-bucket object path ("resumes/abc.pdf") so it can be removed.
function objectPath(publicUrl: string | null | undefined): string | null {
  if (!publicUrl) return null;
  const marker = `/${UPLOAD_BUCKET}/`;
  const i = publicUrl.indexOf(marker);
  return i === -1 ? null : publicUrl.slice(i + marker.length);
}

export type DeletionReport = {
  userId: string;
  email: string | null;
  agentsDeleted: string[];
  storageRemoved: number;
  tablesCleared: Record<string, number>;
  mailchimpRemoved: boolean;
  authUserDeleted: boolean;
  stripeRetained: true;
  errors: string[];
};

export async function purgeUserAccount(params: {
  userId: string;
  email: string | null;
}): Promise<DeletionReport> {
  const { userId } = params;
  const db = createAdminClient();
  const errors: string[] = [];
  const tablesCleared: Record<string, number> = {};

  // Resolve the user's email from auth if the caller didn't supply it — Mailchimp and the
  // email-keyed tables (entitlements, orders) need it.
  let email = params.email?.trim().toLowerCase() || null;
  if (!email) {
    try {
      const { data } = await db.auth.admin.getUserById(userId);
      email = data?.user?.email?.toLowerCase() ?? null;
    } catch (e) {
      errors.push(`resolve-email: ${(e as Error).message}`);
    }
  }

  // Delete helper: removes rows and records the count under `label`, collecting (not
  // throwing) any error so the purge continues.
  async function del(
    label: string,
    table: string,
    column: string,
    value: string | string[]
  ): Promise<void> {
    try {
      const q = db.from(table).delete({ count: "exact" });
      const { count, error } = Array.isArray(value)
        ? await q.in(column, value)
        : await q.eq(column, value);
      if (error) {
        errors.push(`${label}: ${error.message}`);
        return;
      }
      tablesCleared[label] = count ?? 0;
    } catch (e) {
      errors.push(`${label}: ${(e as Error).message}`);
    }
  }

  // 1. Resolve owned workspaces + the Agent37 instances inside them.
  let workspaceIds: string[] = [];
  try {
    const { data: ws } = await db.from("workspaces").select("id").eq("owner_id", userId);
    workspaceIds = (ws ?? []).map((r) => r.id as string);
  } catch (e) {
    errors.push(`list-workspaces: ${(e as Error).message}`);
  }

  let agent37Ids: string[] = [];
  if (workspaceIds.length) {
    try {
      const { data: ag } = await db.from("agents").select("agent37_id").in("workspace_id", workspaceIds);
      agent37Ids = (ag ?? []).map((r) => r.agent37_id as string).filter(Boolean);
    } catch (e) {
      errors.push(`list-agents: ${(e as Error).message}`);
    }
  }

  // 2. Tear down Agent37 instances first (external), so a later DB failure can't orphan a
  //    running, billed box. Per-instance failures are recorded, never fatal.
  const agentsDeleted: string[] = [];
  await Promise.all(
    agent37Ids.map(async (aid) => {
      try {
        await agent37.deleteAgent(aid);
        agentsDeleted.push(aid);
      } catch (e) {
        errors.push(`agent37-delete ${aid}: ${(e as Error).message}`);
      }
    })
  );

  // 3. Remove uploaded files (resumes + avatars) before deleting the rows that point to them.
  let storageRemoved = 0;
  try {
    const { data: obRows } = await db
      .from("onboard_submissions")
      .select("resume_url, avatar_url")
      .eq("user_id", userId);
    const paths = (obRows ?? [])
      .flatMap((r) => [objectPath(r.resume_url as string | null), objectPath(r.avatar_url as string | null)])
      .filter((p): p is string => p !== null);
    if (paths.length) {
      const { error } = await db.storage.from(UPLOAD_BUCKET).remove(paths);
      if (error) errors.push(`storage-remove: ${error.message}`);
      else storageRemoved = paths.length;
    }
  } catch (e) {
    errors.push(`storage: ${(e as Error).message}`);
  }

  // 4. Delete every user-scoped Supabase row. Children (referencing workspace_id) before the
  //    workspaces they hang off, so FK constraints never block the delete.
  if (workspaceIds.length) {
    await del("chat_sessions", "chat_sessions", "workspace_id", workspaceIds);
    await del("agents", "agents", "workspace_id", workspaceIds);
    await del("invitations", "invitations", "workspace_id", workspaceIds);
  }
  await del("memberships", "memberships", "user_id", userId);
  await del("onboard_submissions", "onboard_submissions", "user_id", userId);
  await del("setup_submissions", "setup_submissions", "user_id", userId);
  await del("checklist_items", "checklist_items", "user_id", userId);
  await del("referral_codes", "referral_codes", "user_id", userId);
  await del("referrals", "referrals", "referrer_user_id", userId);
  await del("wallet_transactions", "wallet_transactions", "user_id", userId);
  await del("orders", "orders", "user_id", userId);
  if (email) {
    await del("entitlements", "entitlements", "email", email);
  }
  // Parent last.
  await del("workspaces", "workspaces", "owner_id", userId);

  // 5. Marketing footprint.
  let mailchimpRemoved = false;
  if (email) {
    mailchimpRemoved = await removeFromMailchimp(email);
    if (!mailchimpRemoved) errors.push("mailchimp: not removed (see logs)");
  }

  // 6. The auth user itself — last, so any earlier lookup by id still worked.
  let authUserDeleted = false;
  try {
    const { error } = await db.auth.admin.deleteUser(userId);
    if (error) errors.push(`auth-delete: ${error.message}`);
    else authUserDeleted = true;
  } catch (e) {
    errors.push(`auth-delete: ${(e as Error).message}`);
  }

  return {
    userId,
    email,
    agentsDeleted,
    storageRemoved,
    tablesCleared,
    mailchimpRemoved,
    authUserDeleted,
    stripeRetained: true,
    errors,
  };
}
