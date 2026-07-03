import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { ApiError, json, readJson, route } from "@/lib/http";

// Footer newsletter signup. Two layers so no address is ever lost:
//   1. Always store in newsletter_signups (works even before Mailchimp is set up).
//   2. Mirror to Mailchimp when MAILCHIMP_API_KEY + MAILCHIMP_AUDIENCE_ID are present.
// Mailchimp failures are logged, flagged on the row, and never break the signup.

export const POST = route(async (req) => {
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

async function syncToMailchimp(email: string): Promise<boolean> {
  const apiKey = process.env.MAILCHIMP_API_KEY;
  const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;
  if (!apiKey || !audienceId) return false;

  // Datacenter rides the key suffix ("...-us21"). Member id is the md5 of the
  // lowercased address; PUT makes repeat signups idempotent.
  const dc = apiKey.split("-").pop();
  if (!dc) return false;
  const memberId = createHash("md5").update(email).digest("hex");

  try {
    const res = await fetch(`https://${dc}.api.mailchimp.com/3.0/lists/${audienceId}/members/${memberId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`anystring:${apiKey}`).toString("base64")}`,
      },
      body: JSON.stringify({
        email_address: email,
        status_if_new: "subscribed",
        tags: ["website-footer"],
      }),
    });
    if (!res.ok) {
      console.error("[newsletter] mailchimp sync failed:", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (err) {
    console.error("[newsletter] mailchimp sync error:", err);
    return false;
  }
}
