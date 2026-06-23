import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    const { error: dbError } = await supabase.from("setup_submissions").insert([{
      anthropic_key: data.anthropicKey,
      openai_key: data.openaiKey,
      telegram_token: data.telegramToken,
      telegram_username: data.telegramUsername,
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
            subject: "New Technical Setup Submission — College Agent",
            html: `
              <h2>Technical Setup Received</h2>
              <p style="font-family:sans-serif;font-size:14px;color:#555">
                A student has completed their technical setup. Credentials are stored in Supabase → the-college-agent → setup_submissions.
              </p>
              <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse">
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">Telegram Username</td><td>${data.telegramUsername}</td></tr>
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">Anthropic Key</td><td>${data.anthropicKey.slice(0, 12)}...</td></tr>
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">OpenAI Key</td><td>${data.openaiKey.slice(0, 12)}...</td></tr>
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
