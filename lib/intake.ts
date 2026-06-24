import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { ApiError } from "@/lib/http";

// The storage bucket onboarding resumes are uploaded to (see /api/onboard-submit).
const RESUME_BUCKET = "college-agent-uploads";

// Stored resume_url is a public URL like
//   https://<proj>.supabase.co/storage/v1/object/public/college-agent-uploads/resumes/abc.pdf
// Derive the in-bucket object path ("resumes/abc.pdf") so we can remove it.
function resumeObjectPath(publicUrl: string | null | undefined): string | null {
  if (!publicUrl) return null;
  const marker = `/${RESUME_BUCKET}/`;
  const i = publicUrl.indexOf(marker);
  return i === -1 ? null : publicUrl.slice(i + marker.length);
}

// Clear a student's onboarding + setup intake (and best-effort delete their uploaded
// resume object) so the dashboard funnel drops back to the two forms instead of
// instantly re-provisioning a new — billed — agent from the saved answers.
//
// THROWS on a submission-delete failure: callers MUST run this BEFORE removing the
// `agents` row, so a mid-failure leaves `hasAgent` true (no re-provision) rather than
// "no agent + leftover intake". Scoped strictly to the given user_id; uses the
// service-role client because these intake tables are written service-role (no RLS).
export async function clearStudentIntake(userId: string): Promise<void> {
  const db = createAdminClient();

  // Best-effort: remove every resume this user has uploaded (intake is append-only,
  // so there may be more than one). Storage failures are logged, never fatal.
  const { data: rows } = await db
    .from("onboard_submissions")
    .select("resume_url")
    .eq("user_id", userId);
  const paths = (rows ?? [])
    .map((r) => resumeObjectPath(r.resume_url as string | null))
    .filter((p): p is string => p !== null);
  if (paths.length > 0) {
    const { error } = await db.storage.from(RESUME_BUCKET).remove(paths);
    if (error) console.error("[intake:resume-remove]", paths, error.message);
  }

  const [{ error: onboardErr }, { error: setupErr }] = await Promise.all([
    db.from("onboard_submissions").delete().eq("user_id", userId),
    db.from("setup_submissions").delete().eq("user_id", userId),
  ]);
  if (onboardErr) throw new ApiError(500, "db_error", onboardErr.message);
  if (setupErr) throw new ApiError(500, "db_error", setupErr.message);
}
