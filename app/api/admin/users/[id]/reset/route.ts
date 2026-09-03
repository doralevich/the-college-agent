import { requirePlatformAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { resetStudentAccount } from "@/lib/account-reset";
import { logAudit } from "@/lib/audit";
import { ApiError, json, route } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

// Send one account back to the top of the funnel so the student journey can be tested again
// on the SAME email. See lib/account-reset.ts for exactly what goes and what stays.
//
// Sibling of DELETE ../route.ts, and deliberately a lighter gate: that one erases a person and
// demands the email echoed back, because a mistyped id there is unrecoverable. This keeps the
// account, the workspace and the entitlement, so the worst a wrong id does is cost that student
// their intake answers and their box — bad, but rebuildable, and the confirm dialog in the UI
// names the email before it fires. Platform-admin only either way, behind the same MFA step-up
// as the rest of /admin.
export const POST = route(async (req: Request, { params }: Ctx) => {
  const { user: admin } = await requirePlatformAdmin();
  const { id } = await params;
  const db = createAdminClient();

  const { data: userRes, error: lookupErr } = await db.auth.admin.getUserById(id);
  if (lookupErr) throw new ApiError(500, "auth_error", lookupErr.message);
  const target = userRes?.user;
  if (!target) throw new ApiError(404, "not_found", "No such user.");
  const email = (target.email ?? "").toLowerCase();

  const report = await resetStudentAccount({ userId: id });

  await logAudit({
    actorEmail: admin.email,
    action: "user.reset",
    target: email,
    metadata: {
      userId: id,
      agentsDeleted: report.agentsDeleted,
      errorCount: report.errors.length,
    },
    req,
  });

  // 200 with a populated `errors` array means "mostly reset, read these" — a torn-down box
  // whose row survived, say. A hard failure (bad id, auth error) already threw above.
  return json({ reset: true, email, report });
});
