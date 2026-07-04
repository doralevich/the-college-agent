import "server-only";

// Ambassador approval welcome — sent when an admin approves an application. Carries
// everything the new ambassador needs to start selling in the next five minutes:
// their coupon code, their share link, how the money works, and where the brand
// assets live. Best-effort like the other Mandrill emails: never throws.

export interface AmbassadorWelcome {
  email: string;
  fullName: string;
  code: string;   // e.g. DAVID10
  slug: string;   // /r/{slug}
}

export async function sendAmbassadorWelcomeEmail(a: AmbassadorWelcome): Promise<void> {
  const key = process.env.MANDRILL_API_KEY;
  if (!key) return;

  const first = escapeHtml((a.fullName.trim().split(/\s+/)[0] || "there"));
  const code = escapeHtml(a.code);
  const link = `https://thecollegeagent.ai/r/${encodeURIComponent(a.slug)}`;
  const dash = "https://thecollegeagent.ai/ambassador/dashboard";

  const row = (label: string, body: string) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #EEF1EC;">
        <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#2D7A3A;margin-bottom:3px;">${label}</div>
        <div style="font-size:14px;line-height:1.6;color:#1A2421;">${body}</div>
      </td>
    </tr>`;

  const html = `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#F6F8F3;font-family:'DM Sans',Segoe UI,Helvetica,Arial,sans-serif;color:#1A2421;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F6F8F3;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;background:#FFFFFF;border:1px solid #DEE6DA;border-radius:18px;overflow:hidden;">
            <tr>
              <td style="background:linear-gradient(135deg,#2D7A3A 0%,#1B5E2A 100%);padding:24px 32px;color:#FFFFFF;">
                <div style="font-family:Georgia,'Fraunces',serif;font-size:22px;font-weight:600;letter-spacing:-.01em;">The College Agent</div>
                <div style="font-size:13px;opacity:.85;margin-top:4px;">You&#39;re in, Ambassador.</div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="font-family:Georgia,'Fraunces',serif;font-size:24px;line-height:1.2;font-weight:600;margin:0 0 14px;">
                  Welcome to the team, ${first}!
                </h1>
                <p style="font-size:15px;line-height:1.65;margin:0 0 22px;">
                  Your application is approved and your code is live. Here is everything you need
                  to make your first sale today.
                </p>

                <div style="background:#F2F8EF;border:2px dashed #2D7A3A;border-radius:12px;padding:16px 20px;text-align:center;margin:0 0 22px;">
                  <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#2D7A3A;">Your code: $50 off for them, a bounty for you</div>
                  <div style="font-family:ui-monospace,Menlo,monospace;font-size:30px;font-weight:800;color:#1B5E2A;margin-top:4px;">${code}</div>
                </div>

                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 24px;">
                  ${row("Your share link", `<a href="${link}" style="color:#2D7A3A;text-decoration:underline;">${link}</a> &mdash; it opens the free demo and every sale it touches is credited to you.`)}
                  ${row("What you earn", `$75 for each of your first 10 sales, $100 for every sale after that, for life. A sale clears 7 days after purchase; payouts go out every other Friday by PayPal or Venmo.`)}
                  ${row("Your dashboard", `<a href="${dash}" style="color:#2D7A3A;text-decoration:underline;">${dash}</a> &mdash; sign in with this email address (we send a magic link, no password). Live sales, earnings, tier progress, and payout settings.`)}
                  ${row("Brand assets &amp; playbook", `Everything is on your dashboard: a printable flyer with YOUR QR code, the mascot and logo files, the social card, and the playbook (your 60-second pitch, objection answers, table-event guide, posting tips).`)}
                  ${row("Two rules", `1) Disclose the relationship on social posts (a simple #ad works &mdash; FTC requirement). 2) Before your first payout we need a one-time W-9 tax form; we&#39;ll walk you through it.`)}
                </table>

                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px;">
                  <tr>
                    <td style="background:#2D7A3A;border-radius:10px;">
                      <a href="${dash}" style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none;">
                        Open my ambassador dashboard
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 32px;border-top:1px solid #DEE6DA;background:#F6F8F3;font-size:12px;color:#5C6660;text-align:center;">
                Questions? Just reply to this email. &middot; The College Agent &middot; <a href="https://thecollegeagent.ai" style="color:#5C6660;text-decoration:underline;">thecollegeagent.ai</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();

  try {
    await fetch("https://mandrillapp.com/api/1.0/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key,
        message: {
          html,
          subject: `You're approved! Your College Agent code is ${a.code}`,
          from_email: "hello@thecollegeagent.ai",
          from_name: "The College Agent",
          to: [{ email: a.email, name: a.fullName, type: "to" }],
          headers: { "Reply-To": "david@apolloclaw.ai" },
          track_opens: true,
          track_clicks: true,
        },
      }),
    });
  } catch (err) {
    console.error("[ambassador-welcome-email] send failed:", err);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
