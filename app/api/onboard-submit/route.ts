import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Save to Supabase
    const { error: dbError } = await supabase.from("onboard_submissions").insert([{
      first_name: body.firstName,
      last_name: body.lastName,
      school_email: body.schoolEmail,
      personal_email: body.personalEmail || null,
      phone: body.phone,
      school: body.school === "Other" ? body.schoolOther : body.school,
      year: body.year,
      major: body.major,
      agent_name: body.agentName || null,
      submitted_at: new Date().toISOString(),
    }]);

    if (dbError) throw dbError;

    // Send Mandrill notification
    const mandrillKey = process.env.MANDRILL_API_KEY;
    if (mandrillKey) {
      const fullName = `${body.firstName} ${body.lastName}`;
      const school = body.school === "Other" ? body.schoolOther : body.school;
      await fetch("https://mandrillapp.com/api/1.0/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: mandrillKey,
          message: {
            from_email: "noreply@thecollegeagent.ai",
            from_name: "The College Agent",
            to: [{ email: "david@apolloclaw.ai", name: "David", type: "to" }],
            subject: `New College Agent Lead — ${fullName} (${school})`,
            html: `
              <h2>New Onboard Submission</h2>
              <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse">
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">Name</td><td>${fullName}</td></tr>
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">School Email</td><td>${body.schoolEmail}</td></tr>
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">Personal Email</td><td>${body.personalEmail || "—"}</td></tr>
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">Phone</td><td>${body.phone}</td></tr>
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">School</td><td>${school}</td></tr>
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">Year</td><td>${body.year}</td></tr>
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">Major</td><td>${body.major}</td></tr>
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">Agent Name</td><td>${body.agentName || "—"}</td></tr>
              </table>
            `,
          },
        }),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("onboard-submit error:", err);
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }
}
