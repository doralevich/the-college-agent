import "server-only";

// Account-created email — sent ONCE when the Stripe webhook spins up an auth user
// for an anonymous /build → Pay flow. The body carries a magic-link sign-in URL so
// the student lands on the dashboard in one click without ever picking a password.
// Best-effort: never throw out of the webhook. A delivery failure is logged here.

export interface AccountCreatedRecipient {
  email: string;
  firstName?: string | null;
  // Magic-link URL produced by supabase.auth.admin.generateLink({ type: 'magiclink' }).
  magicLink: string;
}

const FALLBACK_URL = "https://thecollegeagent.ai/auth/sign-in";

export async function sendAccountCreatedEmail(r: AccountCreatedRecipient): Promise<void> {
  const key = process.env.MANDRILL_API_KEY;
  if (!key) return;

  const first = (r.firstName || "").trim() || "there";
  const link = (r.magicLink || "").trim() || FALLBACK_URL;

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
                <div style="font-size:13px;opacity:.85;margin-top:4px;">Your account is ready.</div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="font-family:Georgia,'Fraunces',serif;font-size:24px;line-height:1.2;font-weight:600;color:#1A2421;margin:0 0 20px;">
                  Hi ${escapeHtml(first)}, your account is ready.
                </h1>
                <p style="font-size:15px;line-height:1.6;color:#1A2421;margin:0 0 24px;">
                  One click signs you in. No password needed.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 26px;">
                  <tr>
                    <td style="background:#2D7A3A;border-radius:10px;">
                      <a href="${link}" style="display:inline-block;padding:13px 28px;font-family:inherit;font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none;">
                        Sign in to my dashboard
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="font-size:13px;line-height:1.5;color:#5C6660;margin:0 0 6px;">
                  Button not working? Paste this URL into your browser:
                </p>
                <p style="font-size:12px;line-height:1.5;color:#5C6660;word-break:break-all;margin:0;">
                  <a href="${link}" style="color:#2D7A3A;text-decoration:underline;">${link}</a>
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
          subject: `Your College Agent account is ready, ${first}`,
          from_email: "hello@thecollegeagent.ai",
          from_name: "The College Agent",
          to: [{ email: r.email, name: first, type: "to" }],
          track_opens: true,
          track_clicks: true,
        },
      }),
    });
  } catch (err) {
    console.error("[account-created-email] send failed:", err);
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
