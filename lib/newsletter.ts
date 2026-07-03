import "server-only";
import { createHash } from "crypto";

// Mailchimp mirror for newsletter signups. Shared by /api/newsletter (on signup) and
// the hourly cron (resync of rows that missed their sync, e.g. before the API key
// landed in the environment). Returns false instead of throwing so callers can store
// the address regardless and retry later.

export async function syncToMailchimp(email: string): Promise<boolean> {
  const apiKey = process.env.MAILCHIMP_API_KEY;
  // Audience ids aren't secrets (they ride every embedded Mailchimp form), so the
  // production list is the default — the API key is the only required env var.
  const audienceId = process.env.MAILCHIMP_AUDIENCE_ID || "4c48dcc075";
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
