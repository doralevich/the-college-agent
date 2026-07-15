import { NextRequest, NextResponse, after } from "next/server";
import { getOptionalUserId } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { renameWorkspaceFromIntake } from "@/lib/workspaces";
import { reconfigureExistingAgentForUser } from "@/lib/provisioning";
import { buildSummaryPdf, pdfAttachment, type PdfSection } from "@/lib/email/pdf";
import { limit } from "@/lib/rate-limit";

// Re-pushing an edited intake to a live agent (below) waits for the box + an exec, so give the
// post-response `after()` work room to finish beyond the default function timeout.
export const maxDuration = 120;

const supabase = createAdminClient();

// The onboarding questionnaire, grouped to mirror the 8 wizard steps, so the admin PDF reads
// like the form. Each entry maps a stored field key to a human label; values are pulled from
// the submitted `data` blob and empty answers are skipped.
const ONBOARD_GROUPS: { heading: string; fields: Array<[string, string]> }[] = [
  { heading: "About You", fields: [["role", "Role"], ["roleTitle", "Title"], ["department", "Team / Department"], ["sportsOversee", "Sports / Programs"], ["staffSize", "Staff Size"], ["staffFocus", "Wants Handled"], ["coordinateWith", "Coordinates With"], ["crunchTimes", "Crunch Periods"], ["schoolEmail", "School Email"], ["personalEmail", "Personal Email"], ["phone", "Phone"], ["school", "School"], ["agentName", "Agent Name"], ["year", "Year"], ["major", "Major"], ["minor", "Minor"], ["livingSituation", "Living Situation"]] },
  { heading: "Academic Life", fields: [["currentClasses", "Current Classes"], ["lmsType", "LMS"], ["gpaGoal", "GPA Goal"], ["academicChallenges", "Academic Challenges"], ["studyStyle", "Study Style"], ["studyMethods", "Study Methods"], ["studyTime", "Best Study Time"], ["studyLocation", "Study Location"], ["studySessionLength", "Session Length"]] },
  { heading: "Schedule & Routine", fields: [["wakeTime", "Wake Time"], ["sleepTime", "Sleep Time"], ["productiveTime", "Most Productive"], ["classDays", "Class Days"], ["workStatus", "Work Status"], ["weeklyHours", "Weekly Hours"]] },
  { heading: "Social & Campus Life", fields: [["greekLife", "Greek Life"], ["greekOrg", "Fraternity / Sorority"], ["greekRole", "Chapter Role"], ["greekAmbassador", "Ambassador Interest"], ["sportsTeams", "Sports Teams"], ["clubs", "Clubs / Orgs"], ["clubsDetail", "Club Names & Details"], ["socialLife", "Social Life"], ["family", "Family"], ["socialFrequency", "Social Frequency"], ["socialActivities", "Social Activities"], ["clubTypes", "Clubs & Orgs"], ["specificClubs", "Specific Clubs"], ["leadershipRole", "Leadership Role"], ["clubTimeCommitment", "Club Time/Week"], ["volunteering", "Volunteering"], ["causeAreas", "Cause Areas"], ["volunteerOrgs", "Volunteer Orgs"]] },
  { heading: "Mental Health & Wellbeing", fields: [["sleepQuality", "Sleep Quality"], ["stressLevel", "Stress Level"], ["burnoutSignals", "Burnout Signals"], ["stressBurnout", "Stress / Burnout (free text)"], ["agentWellbeingFlag", "Wellbeing Flagging"], ["wellbeingBoundaries", "Wellbeing Boundaries"]] },
  { heading: "Tools & Communication", fields: [["integrationsWanted", "Integrations Wanted"], ["apps", "Apps"], ["devices", "Devices"], ["browser", "Browser"], ["noteTaking", "Note Taking"], ["calendarApp", "Calendar"], ["taskManager", "Task Manager"], ["commStyle", "Writing Style"], ["preferredChannels", "Channels"], ["responseStyle", "Response Style"], ["emailResponseTime", "Email Response Time"]] },
  { heading: "Goals & Career", fields: [["topPriority", "Top Priorities"], ["topPriorityNotes", "Priority Notes"], ["academicGoal", "Academic Goal"], ["careerGoal", "Career Goal"], ["personalGoal", "Personal Goal"], ["stopDoing", "Wants to Stop"], ["startDoing", "Wants to Start"], ["industryInterest", "Industry"], ["graduationYear", "Graduation Year"], ["summerPlans", "Summer Plans"], ["afterCollege", "Plan After College"], ["afterCollegeDetail", "After-College Details"], ["internshipStatus", "Internship Status"], ["resumeReady", "Resume Ready"], ["jobSearchActivities", "Job Search"], ["dreamCompany", "Dream Company"], ["biggestStressors", "Biggest Stressors"], ["fallsThrough", "Falls Through Cracks"], ["agentHandleFirst", "Success Looks Like"], ["agentHandleFirstNotes", "Success Notes"]] },
  { heading: "Your Agent", fields: [["agentTone", "Tone"], ["checkinFrequency", "Check-in Frequency"], ["agentTopics", "Surface Proactively"], ["agentOffLimits", "Off Limits"], ["wantDeepDive", "Deep-Dive Opt-In"], ["anythingElse", "Anything Else"]] },
];

function formatVal(v: unknown): string {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean).join(", ");
  return typeof v === "string" ? v.trim() : v == null ? "" : String(v);
}

export async function POST(req: NextRequest) {
  try {
    // Uploads files to storage + writes the intake row; cap per IP against storage/DB spam.
    if (!(await limit(req, "onboard-submit", { max: 6, windowSeconds: 60 }))) {
      return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
    }
    const formData = await req.formData();
    const raw = formData.get("data") as string;
    const data = JSON.parse(raw);
    const resumeFile = formData.get("resume") as File | null;
    const avatarFile = formData.get("avatar") as File | null;

    let resumeUrl: string | null = null;
    let avatarUrl: string | null = null;

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

    if (avatarFile && avatarFile.size > 0) {
      const buffer = Buffer.from(await avatarFile.arrayBuffer());
      const ext = (avatarFile.name.split(".").pop() || "png").toLowerCase();
      const fileName = `avatars/${Date.now()}-${data.firstName}-${data.lastName}.${ext}`.replace(/\s+/g, "-").toLowerCase();
      const { error: avatarStorageError } = await supabase.storage
        .from("college-agent-uploads")
        .upload(fileName, buffer, { contentType: avatarFile.type || "image/png", upsert: false });
      if (!avatarStorageError) {
        const { data: urlData } = supabase.storage.from("college-agent-uploads").getPublicUrl(fileName);
        avatarUrl = urlData.publicUrl;
      }
    }

    // Tie to the logged-in student (if any) so the dashboard checklist sees completion.
    const userId = await getOptionalUserId();

    // Re-submits (the "edit intake" flow) usually don't carry a new avatar or resume —
    // keep the stored files rather than nulling them out.
    if (userId && (!resumeUrl || !avatarUrl)) {
      const { data: existing } = await supabase
        .from("onboard_submissions")
        .select("resume_url, avatar_url")
        .eq("user_id", userId)
        .maybeSingle();
      resumeUrl = resumeUrl || ((existing?.resume_url as string | undefined) ?? null);
      avatarUrl = avatarUrl || ((existing?.avatar_url as string | undefined) ?? null);
    }

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
      agent_name: data.agentName || null,
      // Promote a couple of high-value answers to dedicated columns so the
      // provisioner (lib/provisioning.ts) can read them off the row instead of
      // digging into the JSONB blob. Null when not asked / left blank.
      year: data.year || null,
      major: data.major || null,
      // Full questionnaire fields stored as JSONB blob for flexibility
      questionnaire: data,
      resume_url: resumeUrl,
      avatar_url: avatarUrl,
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

      // If this student already has a provisioned agent, this was an EDIT — push the refreshed
      // intake (new classes, updated goals, …) to the live agent's brain so the change actually
      // takes effect, not just the DB row. Runs after the response (`after()`) because the box
      // reconfigure waits for the instance + an exec; a no-op when no agent exists yet.
      const uid = userId;
      after(async () => {
        try {
          const r = await reconfigureExistingAgentForUser(supabase, uid);
          if (r.reconfigured) console.log("[onboard-submit:reconfigure]", uid, r.detail);
          else console.log("[onboard-submit:reconfigure:skip]", uid, r.detail);
        } catch (err) {
          console.error("[onboard-submit:reconfigure] failed:", err);
        }
      });
    }

    const mandrillKey = process.env.MANDRILL_API_KEY;
    if (mandrillKey) {
      const fullName = `${data.firstName} ${data.lastName}`;

      // Full questionnaire, grouped like the wizard, attached as a PDF for the admin's records.
      const sections: PdfSection[] = [];
      for (const group of ONBOARD_GROUPS) {
        const rows = group.fields
          .map(([key, label]) => [label, formatVal(data[key])] as [string, string])
          .filter(([, value]) => value !== "");
        if (rows.length) sections.push({ heading: group.heading, rows });
      }
      sections.push({ heading: "Files", rows: [["Resume", resumeUrl || "Not uploaded"]] });
      const pdfBase64 = await buildSummaryPdf({
        title: "Onboarding",
        subtitle: `${fullName}${data.school ? ` — ${data.school}` : ""}`,
        sections,
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
            subject: `New Student Onboarding: ${fullName} (${data.school})`,
            html: `
              <h2>New Onboarding Submission</h2>
              <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse">
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">Name</td><td>${fullName}</td></tr>
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">School Email</td><td>${data.schoolEmail}</td></tr>
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">Personal Email</td><td>${data.personalEmail || "N/A"}</td></tr>
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">Phone</td><td>${data.phone}</td></tr>
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">School</td><td>${data.school}</td></tr>
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">Agent Name</td><td>${data.agentName || "N/A"}</td></tr>
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">Industry</td><td>${data.industryInterest || "N/A"}</td></tr>
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">Top Priorities</td><td>${formatVal(data.topPriority) || "N/A"}</td></tr>
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">Resume</td><td>${resumeUrl ? `<a href="${resumeUrl}">Download</a>` : "Not uploaded"}</td></tr>
              </table>
              <p style="margin-top:16px;font-size:13px;color:#888">Full submission attached as a PDF and stored in Supabase → the-college-agent → onboard_submissions</p>
            `,
            attachments: [pdfAttachment(`onboarding-${fullName}.pdf`.replace(/\s+/g, "-").toLowerCase(), pdfBase64)],
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
