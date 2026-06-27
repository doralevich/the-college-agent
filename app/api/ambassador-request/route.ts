import { NextRequest, NextResponse } from "next/server";

type AmbassadorRequest = {
  fullName?: string;
  email?: string;
  phone?: string;
  school?: string;
  year?: string;
  channels?: string[];
  audienceSize?: string;
  why?: string;
  referralPlan?: string;
};

const RECIPIENTS = [
  { email: "david@apolloclaw.ai", name: "David", type: "to" },
  { email: "jiloralevich@gmail.com", name: "Jill Oralevich", type: "to" },
];

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function row(label: string, value: string) {
  return `
    <tr>
      <td style="padding:7px 18px 7px 0;font-weight:700;color:#555;vertical-align:top">${escapeHtml(label)}</td>
      <td style="padding:7px 0;color:#111;vertical-align:top">${escapeHtml(value || "N/A").replace(/\n/g, "<br />")}</td>
    </tr>
  `;
}

export async function POST(req: NextRequest) {
  try {
    const data = (await req.json()) as AmbassadorRequest;

    const fullName = clean(data.fullName);
    const email = clean(data.email);
    const school = clean(data.school);
    const year = clean(data.year);
    const why = clean(data.why);

    if (!fullName || !email || !school || !year || !why) {
      return NextResponse.json({ error: "Please complete the required fields." }, { status: 400 });
    }

    const mandrillKey = process.env.MANDRILL_API_KEY;
    if (!mandrillKey) {
      return NextResponse.json({ error: "Email is not configured yet." }, { status: 503 });
    }

    const channels = Array.isArray(data.channels)
      ? data.channels.map(clean).filter(Boolean).join(", ")
      : "";

    await fetch("https://mandrillapp.com/api/1.0/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: mandrillKey,
        message: {
          from_email: "noreply@thecollegeagent.ai",
          from_name: "The College Agent",
          to: RECIPIENTS,
          headers: { "Reply-To": email },
          subject: `College Agent Ambassador Request: ${fullName} (${school})`,
          html: `
            <h2 style="font-family:sans-serif;color:#111;margin-bottom:8px">New Ambassador Request</h2>
            <p style="font-family:sans-serif;font-size:14px;color:#555;margin-top:0">
              Someone requested to become a College Agent Ambassador from the affiliate page.
            </p>
            <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse">
              ${row("Name", fullName)}
              ${row("Email", email)}
              ${row("Phone", clean(data.phone))}
              ${row("School / Network", school)}
              ${row("Year / Role", year)}
              ${row("Channels", channels)}
              ${row("Audience Size", clean(data.audienceSize))}
              ${row("Why They Are a Fit", why)}
              ${row("How They Would Share It", clean(data.referralPlan))}
            </table>
            <p style="margin-top:16px;font-family:sans-serif;font-size:13px;color:#888">
              Source: thecollegeagent.ai/affiliate
            </p>
          `,
        },
      }),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("ambassador-request error:", err);
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }
}
