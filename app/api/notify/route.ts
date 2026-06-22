import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const data = await req.json();

  const {
    name, schoolEmail, personalEmail, mobile, school, year, aiLevel,
    implementation, tier, setupFee, hosting, supportPlan, integrations,
  } = data;

  const html = `
    <h2 style="color:#0b1220;font-family:sans-serif;">New Student Agent Application</h2>
    <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;width:100%;max-width:600px;">
      <tr><td style="padding:8px 12px;background:#f2f1ed;font-weight:700;width:180px;">Name</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">${name}</td></tr>
      <tr><td style="padding:8px 12px;background:#f2f1ed;font-weight:700;">School Email</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">${schoolEmail}</td></tr>
      <tr><td style="padding:8px 12px;background:#f2f1ed;font-weight:700;">Personal Email</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">${personalEmail}</td></tr>
      <tr><td style="padding:8px 12px;background:#f2f1ed;font-weight:700;">Mobile</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">${mobile}</td></tr>
      <tr><td style="padding:8px 12px;background:#f2f1ed;font-weight:700;">School</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">${school}</td></tr>
      <tr><td style="padding:8px 12px;background:#f2f1ed;font-weight:700;">Year</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">${year}</td></tr>
      <tr><td style="padding:8px 12px;background:#f2f1ed;font-weight:700;">AI Level</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">${aiLevel}</td></tr>
      <tr><td colspan="2" style="padding:12px;background:#3d8b3d;color:#fff;font-weight:700;letter-spacing:.05em;font-size:12px;text-transform:uppercase;">Configuration</td></tr>
      <tr><td style="padding:8px 12px;background:#f2f1ed;font-weight:700;">Implementation</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">${implementation} — ${tier}</td></tr>
      <tr><td style="padding:8px 12px;background:#f2f1ed;font-weight:700;">Setup Fee</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">${setupFee}</td></tr>
      <tr><td style="padding:8px 12px;background:#f2f1ed;font-weight:700;">Hosting</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">${hosting}</td></tr>
      <tr><td style="padding:8px 12px;background:#f2f1ed;font-weight:700;">Support Plan</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">${supportPlan}</td></tr>
      <tr><td style="padding:8px 12px;background:#f2f1ed;font-weight:700;">Integrations</td><td style="padding:8px 12px;">${integrations}</td></tr>
    </table>
  `;

  const res = await fetch("https://mandrillapp.com/api/1.0/messages/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      key: process.env.MANDRILL_API_KEY,
      message: {
        html,
        subject: `New Agent Application — ${name} (${school})`,
        from_email: "noreply@thecollegeagent.ai",
        from_name: "The College Agent",
        to: [{ email: "david@apolloclaw.ai", name: "David", type: "to" }],
        track_opens: true,
        track_clicks: false,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
