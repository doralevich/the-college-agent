import { cookies } from "next/headers";
import { ApiError, json, readJson, route } from "@/lib/http";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncToMailchimp } from "@/lib/newsletter";
import { ambassadorBySlug } from "@/lib/ambassador";
import { limit, tooManyRequests } from "@/lib/rate-limit";

// Demo sandbox entry gate (PRD): collects email, cell, school, and grad year with TWO
// separate, un-prechecked consents (email vs SMS — TCPA requires the SMS one to be its
// own explicit box). Every submit writes a demo_leads row (attribution: ambassador from
// the /r cookie or ?ref param, else house/organic) and opens a capped, ephemeral
// session. SMS consent is RECORDED here but numbers are not pushed as SMS-subscribed —
// Mailchimp SMS sending waits on A2P 10DLC registration.

const TTL_HOURS = Number(process.env.DEMO_SESSION_TTL_HOURS ?? 12);
const MAX_CONCURRENT = Number(process.env.DEMO_MAX_CONCURRENT_SESSIONS ?? 25);
export const MESSAGE_CAP = Number(process.env.DEMO_MESSAGE_CAP ?? 10);

type Body = {
  email?: string;
  phone?: string;
  school?: string;
  gradYear?: number | string;
  emailOptIn?: boolean;
  smsOptIn?: boolean;
  ref?: string;
};

export const POST = route(async (req) => {
  if (!(await limit(req, "demo-start", { max: 6, windowSeconds: 60 }))) return tooManyRequests();
  const body = await readJson<Body>(req);

  const email = (body.email ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new ApiError(400, "invalid_email", "Enter a valid email address.");
  }
  const phone = (body.phone ?? "").trim().slice(0, 30);
  if (!phone) throw new ApiError(400, "invalid_phone", "Enter your cell number.");
  const school = (body.school ?? "").trim().slice(0, 120);
  if (!school) throw new ApiError(400, "invalid_school", "Tell us your school.");
  const gradYear = Number(body.gradYear);
  if (!Number.isInteger(gradYear) || gradYear < 2020 || gradYear > 2040) {
    throw new ApiError(400, "invalid_year", "Pick your expected graduation year.");
  }

  const db = createAdminClient();

  // Abuse guard: a global ceiling on live demo sessions. The per-session message cap
  // below is the actual cost control; this bounds the worst case.
  const { count: liveCount } = await db
    .from("demo_sessions")
    .select("id", { count: "exact", head: true })
    .gt("expires_at", new Date().toISOString());
  if ((liveCount ?? 0) >= MAX_CONCURRENT) {
    throw new ApiError(503, "demo_busy", "The demo is at capacity right now. Try again in a bit!");
  }

  // Attribution: explicit ?ref param, else the /r/{slug} cookie. No code = house lead.
  let ambassadorId: string | null = null;
  try {
    const slug = (body.ref ?? "").trim() || (await cookies()).get("ca_amb")?.value || "";
    if (slug) ambassadorId = (await ambassadorBySlug(slug))?.id ?? null;
  } catch {
    /* attribution is best-effort */
  }

  const emailOptIn = body.emailOptIn === true;
  const smsOptIn = body.smsOptIn === true;

  // Mirror to Mailchimp (Student Agent audience): demo-lead tag + attribution tag.
  // Email subscription status follows the email checkbox; contacts who decline email
  // are still stored in Supabase but not pushed. SMS status is never inferred.
  let synced = false;
  if (emailOptIn) {
    const { data: amb } = ambassadorId
      ? await db.from("ambassadors").select("stripe_promo_code").eq("id", ambassadorId).maybeSingle()
      : { data: null };
    const ambTag = amb?.stripe_promo_code ? `amb-${amb.stripe_promo_code}` : "house";
    synced = await syncToMailchimp(email, { tags: ["demo-lead", ambTag] });
  }

  const { data: lead, error: leadErr } = await db
    .from("demo_leads")
    .insert({
      email,
      phone,
      school,
      grad_year: gradYear,
      ambassador_id: ambassadorId,
      email_opt_in: emailOptIn,
      sms_opt_in: smsOptIn,
      mailchimp_synced: synced,
    })
    .select("id")
    .single();
  if (leadErr || !lead) throw new ApiError(500, "db_error", "Couldn't start the demo. Try again.");

  const { data: session, error: sessErr } = await db
    .from("demo_sessions")
    .insert({
      lead_id: lead.id,
      school,
      grad_year: gradYear,
      expires_at: new Date(Date.now() + TTL_HOURS * 3600_000).toISOString(),
    })
    .select("id")
    .single();
  if (sessErr || !session) throw new ApiError(500, "db_error", "Couldn't start the demo. Try again.");

  return json({ sessionId: session.id, cap: MESSAGE_CAP });
});
