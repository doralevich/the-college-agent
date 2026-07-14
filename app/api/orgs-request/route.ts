import { ApiError, json, readJson, route } from "@/lib/http";
import { createAdminClient } from "@/lib/supabase/admin";
import { limit, tooManyRequests } from "@/lib/rate-limit";

// Org/charity partner applications (PRD): a club, team, Greek chapter, or charity that
// wants ambassador sales to fund the group. Stored pending; David activates and sets
// the split in the database (org defaults: $15 to the org per cleared sale).

type Body = {
  name?: string;
  type?: string;
  contactEmail?: string;
  payoutHandle?: string;
  notes?: string;
};

const TYPES = ["club", "team", "greek", "charity"];

export const POST = route(async (req) => {
  if (!(await limit(req, "orgs-request", { max: 5, windowSeconds: 60 }))) return tooManyRequests();
  const body = await readJson<Body>(req);
  const name = (body.name ?? "").trim().slice(0, 160);
  if (!name) throw new ApiError(400, "invalid_request", "Tell us the organization's name.");
  const type = TYPES.includes(body.type ?? "") ? (body.type as string) : "club";
  const contactEmail = (body.contactEmail ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contactEmail)) {
    throw new ApiError(400, "invalid_email", "Enter a valid contact email.");
  }

  const db = createAdminClient();
  const orgCode = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) +
    "-" + Math.random().toString(36).slice(2, 6);
  const { error } = await db.from("orgs").insert({
    name,
    type,
    org_code: orgCode,
    payout_method: "paypal",
    payout_handle: (body.payoutHandle ?? "").trim().slice(0, 200) || null,
    status: "pending",
  });
  if (error) throw new ApiError(500, "db_error", "Couldn't submit. Try again.");

  // Heads-up email, best-effort.
  const mandrillKey = process.env.MANDRILL_API_KEY;
  if (mandrillKey) {
    fetch("https://mandrillapp.com/api/1.0/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: mandrillKey,
        message: {
          from_email: "noreply@thecollegeagent.ai",
          from_name: "The College Agent",
          to: [{ email: "david@apolloclaw.ai", name: "David", type: "to" }],
          subject: `Org partner application: ${name} (${type})`,
          html: `<p>${name} (${type}) applied to the org program.</p><p>Contact: ${contactEmail}</p><p>Payout handle: ${(body.payoutHandle ?? "").trim() || "n/a"}</p><p>Notes: ${(body.notes ?? "").trim().slice(0, 1000) || "n/a"}</p>`,
        },
      }),
    }).catch(() => {});
  }

  return json({ ok: true });
});
