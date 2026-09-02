import { NextRequest, NextResponse, after } from "next/server";
import { getOptionalUserId } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { findAgent37IdForUser, reconfigureExistingAgentForUser } from "@/lib/provisioning";
import { connectTelegram } from "@/lib/channels/connect";
import { buildSummaryPdf, pdfAttachment } from "@/lib/email/pdf";
import { encryptForStorage } from "@/lib/crypto/byo";
import { limit } from "@/lib/rate-limit";

// Delivering the new Telegram creds to a live agent (below) waits for the box + an exec,
// so give the post-response `after()` work room beyond the default function timeout.
export const maxDuration = 120;

const supabase = createAdminClient();

// Treat empty / whitespace-only strings as "not provided" so optional fields store as NULL.
const orNull = (v: unknown) => {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length > 0 ? s : null;
};

export async function POST(req: NextRequest) {
  try {
    // Stores BYO model keys / Telegram creds; cap per IP against write spam.
    if (!(await limit(req, "setup-submit", { max: 6, windowSeconds: 60 }))) {
      return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
    }
    const data = await req.json();

    // Tie the submission to the logged-in student (if any) so the dashboard checklist
    // can detect that they've completed technical setup. Anonymous submits stay null.
    const userId = await getOptionalUserId();

    // Every field is optional (BYO-key). We store whatever the student provided —
    // Telegram credentials and/or their own Anthropic / OpenAI key — and NULL the rest.
    // Upsert on user_id: one row per signed-in student, so a re-submit overwrites instead
    // of stacking. Anonymous submits (user_id null) don't conflict and just insert.
    const { error: dbError } = await supabase.from("setup_submissions").upsert([{
      telegram_token: orNull(data.telegramToken),
      telegram_user_id: orNull(data.telegramUserId),
      telegram_username: orNull(data.telegramUsername),
      // BYO model keys are encrypted at rest (AES-256-GCM, key from BYO_ENC_KEY).
      // encryptForStorage stays plaintext until the env var is set, so this ships safely.
      anthropic_key: encryptForStorage(orNull(data.anthropicKey)),
      openai_key: encryptForStorage(orNull(data.openaiKey)),
      user_id: userId,
      submitted_at: new Date().toISOString(),
    }], { onConflict: "user_id" });

    if (dbError) throw dbError;

    // Time zone + location, detected from the student's own machine (SetupForm reads
    // Intl.DateTimeFormat().resolvedOptions().timeZone — never a dropdown they have to find
    // themselves in). They are merged into the ONBOARDING questionnaire blob rather than
    // given columns of their own, for two reasons: no migration, and every student already
    // has exactly one onboard_submissions row (unique on user_id since 0007), including the
    // ones who onboarded long before this existed. Visiting /setup is what backfills them.
    //
    // Best-effort: a student who somehow has no onboarding row still gets their Telegram and
    // BYO keys saved above. The agent falls back to the box clock, which is what it did before.
    const tz = orNull(data.timezone);
    const loc = orNull(data.location);
    if (userId && (tz || loc)) {
      try {
        const { data: row } = await supabase
          .from("onboard_submissions")
          .select("questionnaire")
          .eq("user_id", userId)
          .maybeSingle();
        if (row) {
          const q = (row.questionnaire ?? {}) as Record<string, unknown>;
          await supabase
            .from("onboard_submissions")
            .update({
              questionnaire: { ...q, ...(tz ? { timezone: tz } : {}), ...(loc ? { location: loc } : {}) },
            })
            .eq("user_id", userId);
        }
      } catch (err) {
        console.error("[setup-submit:timezone] failed:", err);
      }
    }

    // Telegram only reaches the agent through configureAgentFromIntake, which runs at
    // PROVISIONING time — and technical setup is a separate step the student usually does
    // AFTER their agent is already up. So connecting Telegram here saved the credentials
    // and then delivered them nowhere: the box kept the empty TELEGRAM_BOT_TOKEN it was
    // built with, and the proactive check-in cron (which is only created when Telegram
    // exists) never got made. That is the "connecting a Telegram ID did not work" report.
    //
    // Push the refreshed setup to the live agent, exactly as onboard-submit does for the
    // questionnaire. configureHermes restarts the gateway, so the new .env is actually
    // reloaded. Runs after the response (`after()`) because the reconfigure waits on the
    // instance + an exec, and it's a no-op when the student has no agent yet — first-time
    // provisioning reads these same rows and wires Telegram itself.
    // Register the WEBHOOK channel for the pasted bot token, alongside writing it to the box.
    //
    // This is the runtime-agnostic half: the in-box Hermes gateway only polls Telegram while the
    // box runs Hermes, whereas a webhook works on any template. Doing it here means the existing
    // setup form is the whole connect flow - the student pastes the same token they always did,
    // and the numeric user id they used to have to hunt down is no longer needed, because the
    // first message they send to the bot binds their chat id.
    //
    // Best-effort and reported, not fatal: a bad token or an unreachable Telegram must not lose
    // the BYO model keys saved above. connectTelegram validates with getMe before it stores or
    // registers anything, so a typo fails cleanly here rather than half-connecting.
    let telegramChannel: string | null = null;
    const botToken = orNull(data.telegramToken);
    if (userId && botToken) {
      try {
        const agent37Id = await findAgent37IdForUser(supabase, userId);
        if (agent37Id) {
          await connectTelegram(agent37Id, { botToken });
          telegramChannel = "connected";
        } else {
          // No agent yet - they are doing technical setup before their agent is built. The token
          // is stored above and provisioning wires it; they can revisit /setup afterwards to get
          // the webhook too.
          telegramChannel = "no_agent_yet";
        }
      } catch (err) {
        telegramChannel = "failed";
        console.error("[setup-submit:telegram-channel] failed:", (err as Error).message);
      }
    }
    if (telegramChannel) console.log("[setup-submit:telegram-channel]", userId, telegramChannel);

    if (userId) {
      const uid = userId;
      after(async () => {
        try {
          const r = await reconfigureExistingAgentForUser(supabase, uid);
          if (r.reconfigured) console.log("[setup-submit:reconfigure]", uid, r.detail);
          else console.log("[setup-submit:reconfigure:skip]", uid, r.detail);
        } catch (err) {
          console.error("[setup-submit:reconfigure] failed:", err);
        }
      });
    }

    const mandrillKey = process.env.MANDRILL_API_KEY;
    if (mandrillKey) {
      // Same redacted view as the HTML below, attached as a PDF for the admin's records.
      const pdfBase64 = await buildSummaryPdf({
        title: "Technical Setup",
        sections: [
          {
            heading: "Technical Setup",
            rows: [
              ["Telegram User ID", orNull(data.telegramUserId) ?? "-"],
              ["Telegram Username", orNull(data.telegramUsername) ?? "-"],
              ["Bot Token", orNull(data.telegramToken) ? String(data.telegramToken).slice(0, 12) + "..." : "-"],
              ["Anthropic Key", orNull(data.anthropicKey) ? "Provided" : "-"],
              ["OpenAI Key", orNull(data.openaiKey) ? "Provided" : "-"],
            ],
          },
        ],
        note: "Secrets are redacted here. Full values are stored in Supabase -> setup_submissions.",
      });

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
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">Telegram User ID</td><td>${orNull(data.telegramUserId) ?? "-"}</td></tr>
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">Bot Token</td><td>${orNull(data.telegramToken) ? String(data.telegramToken).slice(0, 12) + "…" : "-"}</td></tr>
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">Anthropic key</td><td>${orNull(data.anthropicKey) ? "provided" : "-"}</td></tr>
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">OpenAI key</td><td>${orNull(data.openaiKey) ? "provided" : "-"}</td></tr>
              </table>
            `,
            attachments: [pdfAttachment("technical-setup.pdf", pdfBase64)],
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
