import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ApiError, json, readJson, route } from "@/lib/http";

// "Warn me when my balance drops below" — the low-credits alert line, per student.
// Preset values only; the hourly credits sweep reads it. The critical ($1) alert is fixed.
const THRESHOLD_PRESETS_CENTS = [300, 500, 1000];

export const POST = route(async (req) => {
  const { user } = await requireUser();
  const body = await readJson<{ threshold_cents?: number }>(req);
  const threshold = body.threshold_cents;
  if (typeof threshold !== "number" || !THRESHOLD_PRESETS_CENTS.includes(threshold)) {
    throw new ApiError(400, "invalid_amount", "Pick one of the preset amounts.");
  }

  const email = (user.email ?? "").toLowerCase();
  if (!email) throw new ApiError(400, "no_email", "Your account has no email on file.");

  const db = createAdminClient();
  const { error } = await db
    .from("entitlements")
    // Clearing the alert stage lets the new threshold re-alert cleanly on the next sweep.
    .update({ alert_threshold_cents: threshold, last_alert_stage: null })
    .eq("email", email);
  if (error) throw new ApiError(500, "db_error", error.message);

  return json({ threshold_cents: threshold });
});
