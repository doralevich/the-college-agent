import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    const { error: dbError } = await supabase.from("leads").insert([{
      first_name: data.firstName,
      last_name: data.lastName,
      school_email: data.schoolEmail,
      personal_email: data.personalEmail || null,
      mobile: data.mobile || null,
      school: data.school || null,
      year: data.year || null,
    }]);

    if (dbError) throw dbError;

    const mandrillKey = process.env.MANDRILL_API_KEY;
    if (mandrillKey) {
      await fetch("https://mandrillapp.com/api/1.0/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: mandrillKey,
          message: {
            from_email: "noreply@thecollegeagent.ai",
            from_name: "The College Agent",
            to: [{ email: "david@apolloclaw.ai", name: "David", type: "to" }],
            subject: `New Lead — ${data.firstName} ${data.lastName} (${data.school || "Unknown School"})`,
            html: `
              <h2>New Lead Captured</h2>
              <p style="font-family:sans-serif;font-size:14px;color:#555">
                A student completed Step 1 of the agent builder.
              </p>
              <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse">
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">Name</td><td>${data.firstName} ${data.lastName}</td></tr>
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">School Email</td><td>${data.schoolEmail}</td></tr>
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">Personal Email</td><td>${data.personalEmail || "—"}</td></tr>
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">Mobile</td><td>${data.mobile || "—"}</td></tr>
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">School</td><td>${data.school || "—"}</td></tr>
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">Year</td><td>${data.year || "—"}</td></tr>
              </table>
              <p style="margin-top:16px;font-size:13px;color:#888">Stored in Supabase → the-college-agent → leads</p>
            `,
          },
        }),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("lead-capture error:", err);
    return NextResponse.json({ error: "Failed to capture lead" }, { status: 500 });
  }
}
