import "server-only";
import { PLANS, HOSTING, SUPPORT, ONBOARDING, formatUSD, type PlanKey, type HostingKey, type SupportKey, type OnboardingKey } from "@/lib/pricing";
import { buildSummaryPdf, pdfAttachment } from "@/lib/email/pdf";

// The order-summary notification, sent AFTER successful payment (from the Stripe webhook).
// Best-effort: never throw into the webhook — a failed email must not 500 the webhook and
// trigger Stripe retries / double fulfillment.

export interface OrderForEmail {
  id: string;
  email: string;
  plan: string;
  hosting: string;
  support: string;
  onboarding: string;
  amount_subtotal: number | null;
  student_info: { firstName?: string; lastName?: string; schoolEmail?: string; personalEmail?: string; school?: string; year?: string } | null;
}

const NOTIFY_TO = "david@apolloclaw.ai";

export async function sendOrderSummaryEmail(order: OrderForEmail): Promise<void> {
  const key = process.env.MANDRILL_API_KEY;
  if (!key) return;

  const info = order.student_info ?? {};
  const name = [info.firstName, info.lastName].filter(Boolean).join(" ") || order.email;

  const planLabel = PLANS[order.plan as PlanKey]?.label ?? order.plan;
  const hostingLabel = HOSTING[order.hosting as HostingKey]?.label ?? order.hosting;
  const supportLabel = SUPPORT[order.support as SupportKey]?.label ?? order.support;
  const onboardingLabel = ONBOARDING[order.onboarding as OnboardingKey]?.label ?? order.onboarding;
  const hostingAmt = HOSTING[order.hosting as HostingKey]?.amount ?? 0;

  const row = (label: string, value: string) =>
    `<tr><td style="padding:8px 12px;background:#f5f4f1;font-weight:700;width:200px;">${label}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">${value}</td></tr>`;

  const html = `
    <h2 style="color:#0b1220;font-family:sans-serif;">Paid Order: College Agent</h2>
    <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;width:100%;max-width:620px;">
      <tr><td colspan="2" style="padding:10px 12px;background:#0b1220;color:#fff;font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:.05em;">Student</td></tr>
      ${row("Name", name)}
      ${row("Account Email", order.email)}
      ${row("School Email", info.schoolEmail || "N/A")}
      ${row("School", info.school || "N/A")}
      ${row("Year", info.year || "N/A")}
      <tr><td colspan="2" style="padding:10px 12px;background:#3d8b3d;color:#fff;font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:.05em;">Order</td></tr>
      ${row("Plan", `${planLabel}: ${formatUSD(PLANS[order.plan as PlanKey]?.amount ?? 0)}`)}
      ${row("Hosting", `${hostingLabel}: ${formatUSD(hostingAmt)}/mo`)}
      ${row("Support", supportLabel)}
      ${row("Onboarding", onboardingLabel)}
      ${row("Paid Today", order.amount_subtotal != null ? formatUSD(order.amount_subtotal) : "N/A")}
    </table>
    <p style="font-family:sans-serif;font-size:13px;color:#888;margin-top:16px;">Payment confirmed via Stripe. Hosting recurs at ${formatUSD(hostingAmt)}/mo. Order summary attached as a PDF.</p>
  `;

  // Same content as the HTML table above, attached as a branded PDF for the admin's records.
  const pdfBase64 = await buildSummaryPdf({
    title: "Order Summary",
    subtitle: name,
    sections: [
      {
        heading: "Student",
        rows: [
          ["Name", name],
          ["Account Email", order.email],
          ["School Email", info.schoolEmail || "N/A"],
          ["School", info.school || "N/A"],
          ["Year", info.year || "N/A"],
        ],
      },
      {
        heading: "Order",
        rows: [
          ["Plan", `${planLabel}: ${formatUSD(PLANS[order.plan as PlanKey]?.amount ?? 0)}`],
          ["Hosting", `${hostingLabel}: ${formatUSD(hostingAmt)}/mo`],
          ["Support", supportLabel],
          ["Onboarding", onboardingLabel],
          ["Paid Today", order.amount_subtotal != null ? formatUSD(order.amount_subtotal) : "N/A"],
        ],
      },
    ],
    note: `Payment confirmed via Stripe. Hosting recurs at ${formatUSD(hostingAmt)}/mo.`,
  });

  const recipients: { email: string; name?: string; type: "to" }[] = [
    { email: NOTIFY_TO, name: "David", type: "to" },
    { email: order.email, name, type: "to" },
  ];
  if (info.schoolEmail && info.schoolEmail.toLowerCase() !== order.email.toLowerCase()) {
    recipients.push({ email: info.schoolEmail, name, type: "to" });
  }

  await fetch("https://mandrillapp.com/api/1.0/messages/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      key,
      message: {
        html,
        subject: `Paid Order: College Agent, ${name}`,
        from_email: "noreply@thecollegeagent.ai",
        from_name: "The College Agent",
        to: recipients,
        attachments: [pdfAttachment("college-agent-order-summary.pdf", pdfBase64)],
        track_opens: true,
        track_clicks: false,
      },
    }),
  });
}
