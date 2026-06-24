import { NextRequest, NextResponse } from "next/server";
import { getOptionalUserId } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const supabase = createAdminClient();

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // Tie the submission to the logged-in student (if any) so the dashboard checklist
    // can detect that they've completed technical setup. Anonymous submits stay null.
    const userId = await getOptionalUserId();

    const { error: dbError } = await supabase.from("setup_submissions").insert([{
      telegram_token: data.telegramToken,
      telegram_user_id: data.telegramUserId,
      telegram_username: data.telegramUsername || null,
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
            subject: "New Technical Setup — Telegram connected",
            html: `
              <h2>Technical Setup Received</h2>
              <p style="font-family:sans-serif;font-size:14px;color:#555">
                A student connected Telegram. Stored in Supabase → the-college-agent → setup_submissions.
              </p>
              <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse">
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">Telegram User ID</td><td>${data.telegramUserId}</td></tr>
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">Bot Token</td><td>${String(data.telegramToken).slice(0, 12)}...</td></tr>
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
