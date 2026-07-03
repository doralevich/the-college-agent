import "server-only";

// Low-credits alert email, fired by the credits-watch cron when a student's balance
// crosses the low ($5) or critical ($1) line. Best-effort: the cron logs failures and
// moves on — an email hiccup must never stall the sweep.

const CREDITS_URL = "https://thecollegeagent.ai/dashboard/credits";
const SUPPORT_EMAIL = "hello@thecollegeagent.ai";

export async function sendCreditsLowEmail(opts: {
  email: string;
  firstName?: string | null;
  remainingUsd: string; // preformatted, e.g. "$3.40"
  critical: boolean;
}): Promise<void> {
  const key = process.env.MANDRILL_API_KEY;
  if (!key) return;

  const first = (opts.firstName || "").trim() || "there";
  const subject = opts.critical
    ? "Your College Agent is almost out of credits"
    : "Your College Agent is running low on credits";
  const headline = opts.critical
    ? `${escapeHtml(first)}, your agent is almost out of credits.`
    : `${escapeHtml(first)}, your agent is running low on credits.`;
  const body = opts.critical
    ? `You have ${escapeHtml(opts.remainingUsd)} of AI credits left. When credits run out, your agent pauses until you add more.`
    : `You have ${escapeHtml(opts.remainingUsd)} of AI credits left. Top up now and your agent keeps working without interruption.`;

  const html = `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#F6F8F3;font-family:'DM Sans',Segoe UI,Helvetica,Arial,sans-serif;color:#1A2421;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F6F8F3;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;background:#FFFFFF;border:1px solid #DEE6DA;border-radius:18px;overflow:hidden;">
            <tr>
              <td style="background:linear-gradient(135deg,#2D7A3A 0%,#1B5E2A 100%);padding:28px 32px;color:#FFFFFF;">
                <div style="font-family:Georgia,'Fraunces',serif;font-size:22px;font-weight:600;letter-spacing:-.01em;">The College Agent</div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="font-family:Georgia,'Fraunces',serif;font-size:24px;line-height:1.25;font-weight:600;color:#1A2421;margin:0 0 16px;">
                  ${headline}
                </h1>
                <p style="font-size:15px;line-height:1.6;color:#1A2421;margin:0 0 24px;">
                  ${body}
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
                  <tr>
                    <td style="background:#2D7A3A;border-radius:10px;">
                      <a href="${CREDITS_URL}" style="display:inline-block;padding:13px 28px;font-family:inherit;font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none;">
                        Add credits
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="font-size:13px;line-height:1.6;color:#5C6660;margin:0;">
                  Tip: turn on auto-recharge in Settings and never think about this again. Questions? Write us at
                  <a href="mailto:${SUPPORT_EMAIL}" style="color:#2D7A3A;text-decoration:none;">${SUPPORT_EMAIL}</a>.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 32px;border-top:1px solid #DEE6DA;background:#F6F8F3;font-size:12px;color:#5C6660;text-align:center;">
                The College Agent &middot; <a href="https://thecollegeagent.ai" style="color:#5C6660;text-decoration:underline;">thecollegeagent.ai</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();

  await fetch("https://mandrillapp.com/api/1.0/messages/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      key,
      message: {
        from_email: "hello@thecollegeagent.ai",
        from_name: "The College Agent",
        to: [{ email: opts.email, name: first, type: "to" }],
        subject,
        html,
        track_opens: true,
      },
    }),
  });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
