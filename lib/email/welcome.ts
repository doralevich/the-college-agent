import "server-only";

// Student-facing welcome email, fired AFTER /api/provision finishes building the agent.
// Best-effort: never throw into the provision route — a failed email mustn't break the
// "your agent is ready" flow. Recipient is the auth email on file (plus the school email
// when it's different) so the student gets it wherever they actually read mail.

export interface WelcomeRecipients {
  // Auth account email (what they paid with).
  accountEmail: string;
  // Optional school email captured during onboarding. Sent as a second to:-recipient when
  // it doesn't match the account email — students often pay with personal mail and read
  // class stuff on school mail, so cover both.
  schoolEmail?: string | null;
  firstName?: string | null;
  // The student-picked name for their agent. Falls back to "your College Agent" so the
  // copy stays natural when they skipped the rename step.
  agentName?: string | null;
}

const DASHBOARD_URL = "https://thecollegeagent.ai/dashboard";
const SUPPORT_EMAIL = "hello@thecollegeagent.ai";

export async function sendWelcomeEmail(r: WelcomeRecipients): Promise<void> {
  const key = process.env.MANDRILL_API_KEY;
  if (!key) return;

  const first = (r.firstName || "").trim() || "there";
  const agent = (r.agentName || "").trim() || "your College Agent";

  const recipients: { email: string; name?: string; type: "to" }[] = [
    { email: r.accountEmail, name: first, type: "to" },
  ];
  if (r.schoolEmail && r.schoolEmail.toLowerCase() !== r.accountEmail.toLowerCase()) {
    recipients.push({ email: r.schoolEmail, name: first, type: "to" });
  }

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
                <div style="font-size:13px;opacity:.85;margin-top:4px;">Your sidekick for everything college throws at you.</div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="font-family:Georgia,'Fraunces',serif;font-size:26px;line-height:1.2;font-weight:600;color:#1A2421;margin:0 0 16px;">
                  Welcome, ${escapeHtml(first)} &mdash; ${escapeHtml(agent)} is ready.
                </h1>
                <p style="font-size:15px;line-height:1.6;color:#1A2421;margin:0 0 16px;">
                  Thanks for setting up your agent. Everything you told me during onboarding is wired in, so I already know your priorities, your voice preferences, and where to start helping.
                </p>
                <p style="font-size:15px;line-height:1.6;color:#1A2421;margin:0 0 24px;">
                  Head to your dashboard whenever you're ready and just start asking. The more we talk, the sharper I get.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
                  <tr>
                    <td style="background:#2D7A3A;border-radius:10px;">
                      <a href="${DASHBOARD_URL}" style="display:inline-block;padding:13px 28px;font-family:inherit;font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none;">
                        Open my dashboard
                      </a>
                    </td>
                  </tr>
                </table>
                <h3 style="font-family:Georgia,'Fraunces',serif;font-size:16px;font-weight:600;color:#1A2421;margin:0 0 10px;">Three quick things to try first</h3>
                <ol style="padding-left:20px;margin:0 0 24px;font-size:14px;line-height:1.6;color:#1A2421;">
                  <li style="margin-bottom:6px;"><strong>Connect Gmail or Outlook.</strong> I can read your calendar and unblock the "what's on my plate?" question immediately.</li>
                  <li style="margin-bottom:6px;"><strong>Drop in your syllabus or class list.</strong> Then ask me what's due this week.</li>
                  <li style="margin-bottom:6px;"><strong>Just chat.</strong> Tell me what's stressing you out and we'll work the plan together.</li>
                </ol>
                <p style="font-size:14px;line-height:1.6;color:#5C6660;margin:0 0 0;">
                  Stuck on anything? Just reply to this email or write us at <a href="mailto:${SUPPORT_EMAIL}" style="color:#2D7A3A;text-decoration:none;">${SUPPORT_EMAIL}</a>.
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

  try {
    await fetch("https://mandrillapp.com/api/1.0/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key,
        message: {
          html,
          subject: `Welcome to The College Agent, ${first} — ${agent} is ready`,
          from_email: "hello@thecollegeagent.ai",
          from_name: "The College Agent",
          to: recipients,
          track_opens: true,
          track_clicks: true,
        },
      }),
    });
  } catch (err) {
    // Swallow — the agent is already built and the dashboard works. A missed welcome
    // email is recoverable; failing the provision over it is not.
    console.error("[welcome-email] send failed:", err);
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
