import { NextRequest, NextResponse } from "next/server";
import { getOptionalUserId } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const supabase = createAdminClient();

// Treat empty / whitespace-only strings as "not provided" so optional fields store as NULL.
const orNull = (v: unknown) => {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length > 0 ? s : null;
};

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // Tie the submission to the logged-in student (if any) so the dashboard checklist
    // can detect that they've completed technical setup. Anonymous submits stay null.
    const userId = await getOptionalUserId();

    // Every field is optional (BYO-key). We store whatever the student provided —
    // Telegram credentials and/or their own Anthropic / OpenAI key — and NULL the rest.
    const { error: dbError } = await supabase.from("setup_submissions").insert([{
      telegram_token: orNull(data.telegramToken),
      telegram_user_id: orNull(data.telegramUserId),
      telegram_username: orNull(data.telegramUsername),
      anthropic_key: orNull(data.anthropicKey),
      openai_key: orNull(data.openaiKey),
      user_id: userId,
      submitted_at: new Date().toISOString(),
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
            subject: "New Technical Setup submission",
            html: `
              <h2>Technical Setup Received</h2>
              <p style="font-family:sans-serif;font-size:14px;color:#555">
                A student submitted technical setup. Stored in Supabase → the-college-agent → setup_submissions.
              </p>
              <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse">
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">Telegram User ID</td><td>${orNull(data.telegramUserId) ?? "—"}</td></tr>
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">Bot Token</td><td>${orNull(data.telegramToken) ? String(data.telegramToken).slice(0, 12) + "…" : "—"}</td></tr>
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">Anthropic key</td><td>${orNull(data.anthropicKey) ? "provided" : "—"}</td></tr>
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">OpenAI key</td><td>${orNull(data.openaiKey) ? "provided" : "—"}</td></tr>
              </table>
            `,
          },
        }),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("setup-submit error:", err);
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }
}
