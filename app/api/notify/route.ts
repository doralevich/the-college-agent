import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function buildPDF(data: Record<string, string>): Promise<string> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();

  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const regular = await doc.embedFont(StandardFonts.Helvetica);

  const green = rgb(0.24, 0.55, 0.24);
  const navy = rgb(0.04, 0.09, 0.16);
  const muted = rgb(0.4, 0.4, 0.4);
  const cream = rgb(0.95, 0.94, 0.93);

  let y = height - 48;
  const L = 48;
  const R = width - 48;

  // Header bar
  page.drawRectangle({ x: 0, y: height - 70, width, height: 70, color: navy });
  page.drawText("The College Agent", { x: L, y: height - 30, size: 11, font: bold, color: rgb(1, 1, 1) });
  page.drawText("thecollegeagent.ai", { x: L, y: height - 48, size: 9, font: regular, color: rgb(0.6, 0.65, 0.7) });
  page.drawText("Order Summary", { x: R - 80, y: height - 38, size: 13, font: bold, color: rgb(1, 1, 1) });

  y = height - 98;

  // Section helper
  function section(title: string) {
    y -= 18;
    page.drawRectangle({ x: L, y, width: R - L, height: 20, color: cream });
    page.drawText(title.toUpperCase(), { x: L + 8, y: y + 6, size: 8, font: bold, color: muted });
    y -= 4;
  }

  function row(label: string, value: string) {
    y -= 20;
    page.drawText(label, { x: L + 8, y, size: 10, font: bold, color: navy });
    page.drawText(value || "—", { x: L + 170, y, size: 10, font: regular, color: navy });
    page.drawLine({ start: { x: L, y: y - 4 }, end: { x: R, y: y - 4 }, thickness: 0.5, color: rgb(0.9, 0.9, 0.9) });
  }

  // Student info
  section("Student Information");
  row("Name", data.name);
  row("School Email", data.schoolEmail);
  row("Personal Email", data.personalEmail || "—");
  row("Mobile", data.mobile || "—");
  row("School", data.school || "—");
  row("Year", data.year || "—");

  // Configuration
  y -= 10;
  section("Agent Configuration");
  row("Implementation", data.implementation);
  row("Setup Fee", data.setupFee);
  row("Hosting", data.hosting);
  row("Support Plan", data.supportPlan);
  row("Onboarding", data.onboarding || "Standard (Included)");

  // Integrations
  y -= 10;
  section("Selected Integrations");
  y -= 18;
  const integList = data.integrations || "To be finalized during co-training";
  const words = integList.split(", ");
  let line = "";
  for (const word of words) {
    const test = line ? `${line}, ${word}` : word;
    if (regular.widthOfTextAtSize(test, 10) > R - L - 16) {
      page.drawText(line, { x: L + 8, y, size: 10, font: regular, color: navy });
      y -= 16;
      line = word;
    } else {
      line = test;
    }
  }
  if (line) {
    page.drawText(line, { x: L + 8, y, size: 10, font: regular, color: navy });
    y -= 4;
  }
  page.drawLine({ start: { x: L, y: y - 4 }, end: { x: R, y: y - 4 }, thickness: 0.5, color: rgb(0.9, 0.9, 0.9) });

  // What's included
  y -= 18;
  section("Always Included");
  const included = [
    "Named AI personal agent, built around you",
    "30-day hands-on co-training period",
    "Brave Search — real-time research built in",
    "PDF reader — upload, summarize, query any document",
    "Communication via Telegram, accessible anywhere",
    "Google Workspace or Office 365 (appropriate access required)",
    "LinkedIn integration included",
  ];
  for (const item of included) {
    y -= 18;
    page.drawText("✓", { x: L + 8, y, size: 9, font: bold, color: green });
    page.drawText(item, { x: L + 22, y, size: 9, font: regular, color: navy });
  }

  // Footer
  page.drawRectangle({ x: 0, y: 0, width, height: 36, color: navy });
  page.drawText("Questions? hello@thecollegeagent.ai", { x: L, y: 13, size: 8, font: regular, color: rgb(0.6, 0.65, 0.7) });
  page.drawText(`Generated ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`, {
    x: R - 130, y: 13, size: 8, font: regular, color: rgb(0.6, 0.65, 0.7),
  });

  const bytes = await doc.save();
  return Buffer.from(bytes).toString("base64");
}

export async function POST(req: NextRequest) {
  const data = await req.json();

  const {
    name, schoolEmail, personalEmail, mobile, school, year,
    implementation, setupFee, hosting, supportPlan, onboarding, integrations,
  } = data;

  // Save to Supabase
  const [firstName, ...rest] = (name as string).split(" ");
  const lastName = rest.join(" ");
  await supabase.from("configurations").insert([{
    first_name: firstName,
    last_name: lastName,
    school_email: schoolEmail,
    personal_email: personalEmail || null,
    mobile: mobile || null,
    school: school || null,
    year: year || null,
    implementation,
    setup_fee: setupFee,
    hosting,
    support_plan: supportPlan,
    onboarding: onboarding || "Standard (Included)",
    integrations: integrations || null,
  }]).then(({ error }) => { if (error) console.error(error); });

  // Generate PDF
  const pdfBase64 = await buildPDF(data);
  const pdfAttachment = [{ type: "application/pdf", name: "college-agent-order-summary.pdf", content: pdfBase64 }];

  const htmlBody = `
    <h2 style="color:#0b1220;font-family:sans-serif;">College Agent Order Summary</h2>
    <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;width:100%;max-width:600px;">
      <tr><td colspan="2" style="padding:10px 12px;background:#0b1220;color:#fff;font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:.05em;">Student Information</td></tr>
      <tr><td style="padding:8px 12px;background:#f5f4f1;font-weight:700;width:180px;">Name</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">${name}</td></tr>
      <tr><td style="padding:8px 12px;background:#f5f4f1;font-weight:700;">School Email</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">${schoolEmail}</td></tr>
      <tr><td style="padding:8px 12px;background:#f5f4f1;font-weight:700;">Personal Email</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">${personalEmail || "—"}</td></tr>
      <tr><td style="padding:8px 12px;background:#f5f4f1;font-weight:700;">Mobile</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">${mobile || "—"}</td></tr>
      <tr><td style="padding:8px 12px;background:#f5f4f1;font-weight:700;">School</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">${school || "—"}</td></tr>
      <tr><td style="padding:8px 12px;background:#f5f4f1;font-weight:700;">Year</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">${year || "—"}</td></tr>
      <tr><td colspan="2" style="padding:10px 12px;background:#3d8b3d;color:#fff;font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:.05em;">Configuration</td></tr>
      <tr><td style="padding:8px 12px;background:#f5f4f1;font-weight:700;">Implementation</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">${implementation}</td></tr>
      <tr><td style="padding:8px 12px;background:#f5f4f1;font-weight:700;">Setup Fee</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">${setupFee}</td></tr>
      <tr><td style="padding:8px 12px;background:#f5f4f1;font-weight:700;">Hosting</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">${hosting}</td></tr>
      <tr><td style="padding:8px 12px;background:#f5f4f1;font-weight:700;">Support Plan</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">${supportPlan}</td></tr>
      <tr><td style="padding:8px 12px;background:#f5f4f1;font-weight:700;">Onboarding</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">${onboarding || "Standard (Included)"}</td></tr>
      <tr><td style="padding:8px 12px;background:#f5f4f1;font-weight:700;">Integrations</td><td style="padding:8px 12px;">${integrations || "To be finalized during co-training"}</td></tr>
    </table>
    <p style="font-family:sans-serif;font-size:13px;color:#888;margin-top:16px;">Your order summary PDF is attached to this email.</p>
  `;

  const recipients = [
    { email: "david@apolloclaw.ai", name: "David", type: "to" },
    { email: schoolEmail, name, type: "to" },
  ];
  if (personalEmail && personalEmail !== schoolEmail) {
    recipients.push({ email: personalEmail, name, type: "to" });
  }

  const res = await fetch("https://mandrillapp.com/api/1.0/messages/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      key: process.env.MANDRILL_API_KEY,
      message: {
        html: htmlBody,
        subject: `Your College Agent Order Summary — ${name}`,
        from_email: "noreply@thecollegeagent.ai",
        from_name: "The College Agent",
        to: recipients,
        attachments: pdfAttachment,
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
