import { requirePlatformAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { purgeUserAccount } from "@/lib/account-deletion";
import { logAudit } from "@/lib/audit";
import { ApiError, json, readJson, route } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

// Admin-triggered account erasure (Item 10 / data-deletion runbook). Deletes the user's
// Agent37 instances, uploaded files, every user-scoped Supabase row, and Mailchimp record,
// then the auth user. Stripe is retained (financial record) — see lib/account-deletion.ts.
//
// Guardrail: the caller must echo the exact account email in the body ({ "confirm": "<email>" }).
// This is irreversible and cross-tenant, so a fat-fingered id can't wipe the wrong account.
export const DELETE = route(async (req: Request, { params }: Ctx) => {
  const { user: admin } = await requirePlatformAdmin();
  const { id } = await params;
  const db = createAdminClient();

  const { data: userRes, error: lookupErr } = await db.auth.admin.getUserById(id);
  if (lookupErr) throw new ApiError(500, "auth_error", lookupErr.message);
  const target = userRes?.user;
  if (!target) throw new ApiError(404, "not_found", "No such user.");
  const email = (target.email ?? "").toLowerCase();

  const body = await readJson<{ confirm?: string }>(req).catch(() => ({ confirm: undefined }));
  const confirm = (body.confirm ?? "").trim().toLowerCase();
  if (!confirm || confirm !== email) {
    throw new ApiError(
      400,
      "confirmation_required",
      "To delete this account, resend with { confirm: \"<the account's email>\" }."
    );
  }

  const report = await purgeUserAccount({ userId: id, email });
  await logAudit({
    actorEmail: admin.email,
    action: "user.delete",
    target: email,
    metadata: { userId: id, authUserDeleted: report.authUserDeleted, errorCount: report.errors.length },
    req,
  });
  // 207-ish semantics folded into 200: the report.errors array carries any per-step failures
  // for the admin to review. A hard failure (bad id, auth error) already threw above.
  return json({ deleted: report.authUserDeleted, report });
});
