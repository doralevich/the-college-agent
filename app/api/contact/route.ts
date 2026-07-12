import { ApiError, json, readJson, route } from "@/lib/http";
import { syncToMailchimp } from "@/lib/newsletter";

// The /contact form: sends the message to David via Mandrill (reply-to the sender, so
// answering is one click) and mirrors the address into Mailchimp tagged "contact".
// Mailchimp is best-effort; Mandrill is the delivery path, so it's required.

type Body = {
  name?: string;
  email?: string;
  who?: string;
  message?: string;
};

const WHO_OPTIONS = ["Student", "Parent", "Faculty / Administration", "Athletics", "Other"];

export const POST = route(async (req) => {
  const body = await readJson<Body>(req);

  const name = (body.name ?? "").trim().slice(0, 120);
  if (!name) throw new ApiError(400, "invalid_name", "Tell us your name.");
  const email = (body.email ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new ApiError(400, "invalid_email", "Enter a valid email address.");
  }
  const who = WHO_OPTIONS.includes(body.who ?? "") ? (body.who as string) : "Other";
  const message = (body.message ?? "").trim().slice(0, 4000);
  if (!message) throw new ApiError(400, "invalid_message", "Write us a message.");

  const mandrillKey = process.env.MANDRILL_API_KEY;
  if (!mandrillKey) {
    console.error("[contact] MANDRILL_API_KEY missing — message not deliverable");
    throw new ApiError(503, "unavailable", "The contact form is down. Email us at hello@thecollegeagent.ai.");
  }

  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br />");

  const res = await fetch("https://mandrillapp.com/api/1.0/messages/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      key: mandrillKey,
      message: {
        from_email: "noreply@thecollegeagent.ai",
        from_name: "The College Agent",
        to: [{ email: "david@apolloclaw.ai", name: "David", type: "to" }],
        headers: { "Reply-To": email },
        subject: `Contact form: ${name} (${who})`,
        html: `
          <h2>New Contact Message</h2>
          <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse">
            <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">Name</td><td>${esc(name)}</td></tr>
            <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">Email</td><td>${esc(email)}</td></tr>
            <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">They are</td><td>${esc(who)}</td></tr>
          </table>
          <p style="font-family:sans-serif;font-size:14px;color:#333;margin-top:16px;white-space:pre-wrap">${esc(message)}</p>
          <p style="margin-top:16px;font-size:12px;color:#888">Reply to this email to answer them directly.</p>
        `,
      },
    }),
  });
  if (!res.ok) {
    console.error("[contact] mandrill send failed:", res.status, await res.text().catch(() => ""));
    throw new ApiError(502, "send_failed", "Couldn't send your message. Email us at hello@thecollegeagent.ai.");
  }

  // Best-effort: the sender joins the audience tagged "contact" so follow-ups can be segmented.
  await syncToMailchimp(email, { firstName: name.split(" ")[0], tags: ["contact"] }).catch(() => false);

  return json({ ok: true });
});
