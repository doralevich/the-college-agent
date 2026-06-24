import { NextRequest, NextResponse } from "next/server";
import { getOptionalUserId } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { renameWorkspaceFromIntake } from "@/lib/workspaces";

const supabase = createAdminClient();

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const raw = formData.get("data") as string;
    const data = JSON.parse(raw);
    const resumeFile = formData.get("resume") as File | null;

    let resumeUrl: string | null = null;

    if (resumeFile && resumeFile.size > 0) {
      const buffer = Buffer.from(await resumeFile.arrayBuffer());
      const ext = resumeFile.name.split(".").pop() || "pdf";
      const fileName = `resumes/${Date.now()}-${data.firstName}-${data.lastName}.${ext}`.replace(/\s+/g, "-").toLowerCase();
      const { error: storageError } = await supabase.storage
        .from("college-agent-uploads")
        .upload(fileName, buffer, { contentType: resumeFile.type || "application/octet-stream", upsert: false });
      if (!storageError) {
        const { data: urlData } = supabase.storage.from("college-agent-uploads").getPublicUrl(fileName);
        resumeUrl = urlData.publicUrl;
      }
    }

    // Tie to the logged-in student (if any) so the dashboard checklist sees completion.
    const userId = await getOptionalUserId();

    // Upsert on user_id: one row per signed-in student, so re-onboarding overwrites the
    // existing answers instead of stacking a new row. Anonymous submits (user_id null)
    // don't conflict and just insert.
    const { error: dbError } = await supabase.from("onboard_submissions").upsert([{
      user_id: userId,
      first_name: data.firstName,
      last_name: data.lastName,
      school_email: data.schoolEmail,
      personal_email: data.personalEmail || null,
      phone: data.phone,
      school: data.school,
      year: data.year,
      major: data.major,
      agent_name: data.agentName || null,
      // Full questionnaire fields stored as JSONB blob for flexibility
      questionnaire: data,
      resume_url: resumeUrl,
      submitted_at: new Date().toISOString(),
    }], { onConflict: "user_id" });

    if (dbError) throw dbError;

    // Now that we know the student's name, rename their workspace from the email-handle
    // default (set on first dashboard visit) to "<First>'s Workspace". Best-effort —
    // never fail the submission over a cosmetic rename.
    if (userId) {
      try {
        await renameWorkspaceFromIntake(supabase, userId, data.firstName);
      } catch (err) {
        console.error("onboard-submit: workspace rename failed:", err);
      }
    }

    const mandrillKey = process.env.MANDRILL_API_KEY;
    if (mandrillKey) {
      const fullName = `${data.firstName} ${data.lastName}`;
      await fetch("https://mandrillapp.com/api/1.0/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: mandrillKey,
          message: {
            from_email: "noreply@thecollegeagent.ai",
            from_name: "The College Agent",
            to: [{ email: "david@apolloclaw.ai", name: "David", type: "to" }],
            subject: `New Student Onboarding: ${fullName} (${data.school})`,
            html: `
              <h2>New Onboarding Submission</h2>
              <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse">
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">Name</td><td>${fullName}</td></tr>
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">School Email</td><td>${data.schoolEmail}</td></tr>
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">Phone</td><td>${data.phone}</td></tr>
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">School</td><td>${data.school}</td></tr>
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">Year</td><td>${data.year}</td></tr>
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">Major</td><td>${data.major}</td></tr>
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">Agent Name</td><td>${data.agentName || "N/A"}</td></tr>
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">Industry</td><td>${data.industryInterest || "N/A"}</td></tr>
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">Top Priority</td><td>${data.topPriority || "N/A"}</td></tr>
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">Resume</td><td>${resumeUrl ? `<a href="${resumeUrl}">Download</a>` : "Not uploaded"}</td></tr>
              </table>
              <p style="margin-top:16px;font-size:13px;color:#888">Full submission stored in Supabase → the-college-agent → onboard_submissions</p>
            `,
          },
        }),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("onboard-submit error:", err);
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }
}
