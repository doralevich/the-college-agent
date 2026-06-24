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

export type IntakeStep = "onboard" | "setup";

// Clear a student's onboarding and/or setup intake (and best-effort delete their uploaded
// resume object when onboarding is cleared) so the dashboard funnel drops back to the
// relevant form(s). Used both when deleting an agent (clear everything, so it can't
// instantly re-provision a new — billed — agent from the saved answers) and when a student
// resets a single step pre-agent to refill it.
//
// Defaults to clearing BOTH steps so existing callers keep their behavior. THROWS on a
// submission-delete failure: agent-delete callers MUST run this BEFORE removing the
// `agents` row, so a mid-failure leaves `hasAgent` true (no re-provision) rather than
// "no agent + leftover intake". Scoped strictly to the given user_id; uses the
// service-role client because these intake tables are written service-role (no RLS).
export async function clearStudentIntake(
  userId: string,
  steps: IntakeStep[] = ["onboard", "setup"]
): Promise<void> {
  const db = createAdminClient();

  if (steps.includes("onboard")) {
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

    const { error } = await db.from("onboard_submissions").delete().eq("user_id", userId);
    if (error) throw new ApiError(500, "db_error", error.message);
  }

  if (steps.includes("setup")) {
    const { error } = await db.from("setup_submissions").delete().eq("user_id", userId);
    if (error) throw new ApiError(500, "db_error", error.message);
  }
}
