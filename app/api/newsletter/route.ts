import { createAdminClient } from "@/lib/supabase/admin";
import { syncToMailchimp } from "@/lib/newsletter";
import { ApiError, json, readJson, route } from "@/lib/http";
import { limit, tooManyRequests } from "@/lib/rate-limit";

// Footer newsletter signup. Two layers so no address is ever lost:
//   1. Always store in newsletter_signups (works even before Mailchimp is set up).
//   2. Mirror to Mailchimp when MAILCHIMP_API_KEY + MAILCHIMP_AUDIENCE_ID are present.
// Mailchimp failures are logged, flagged on the row, and never break the signup.

export const POST = route(async (req) => {
  if (!(await limit(req, "newsletter", { max: 8, windowSeconds: 60 }))) return tooManyRequests();
  const body = await readJson<{ email?: string }>(req);
  const email = (body.email ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new ApiError(400, "invalid_email", "Enter a valid email address.");
  }

  const db = createAdminClient();
  const synced = await syncToMailchimp(email);
  const { error } = await db
    .from("newsletter_signups")
    .upsert([{ email, source: "footer", mailchimp_synced: synced }], { onConflict: "email" });
  if (error) throw new ApiError(500, "db_error", "Couldn't save your signup. Try again.");

  return json({ ok: true });
});
