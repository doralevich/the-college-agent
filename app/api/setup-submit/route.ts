import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const raw = formData.get("data") as string;
    const data = JSON.parse(raw);
    const resumeFile = formData.get("resume") as File | null;

    let resumeUrl: string | null = null;

    // Upload resume to Supabase Storage
    if (resumeFile && resumeFile.size > 0) {
      const buffer = Buffer.from(await resumeFile.arrayBuffer());
      const ext = resumeFile.name.split(".").pop() || "pdf";
      const fileName = `resumes/${Date.now()}-${data.firstName}-${data.lastName}.${ext}`.replace(/\s+/g, "-").toLowerCase();

      const { error: storageError } = await supabase.storage
        .from("college-agent-uploads")
        .upload(fileName, buffer, {
          contentType: resumeFile.type || "application/octet-stream",
          upsert: false,
        });

      if (!storageError) {
        const { data: urlData } = supabase.storage
          .from("college-agent-uploads")
          .getPublicUrl(fileName);
        resumeUrl = urlData.publicUrl;
      }
    }

    // Save to Supabase
    const { error: dbError } = await supabase.from("setup_submissions").insert([{
      first_name: data.firstName,
      last_name: data.lastName,
      school_email: data.schoolEmail,
      phone: data.phone,
      school: data.school === "Other" ? data.schoolOther : data.school,
      year: data.year,
      major: data.major,
      agent_name: data.agentName || null,
      timezone: data.timezone,
      // Academic
      current_classes: data.currentClasses,
      professors: data.professors,
      lms_type: data.lmsType,
      class_formats: data.classFormats,
      academic_challenges: data.academicChallenges,
      gpa_goal: data.gpaGoal,
      // Study
      study_style: data.studyStyle,
      study_methods: data.studyMethods,
      study_time: data.studyTime,
      study_location: data.studyLocation,
      study_session_length: data.studySessionLength,
      // Schedule
      wake_time: data.wakeTime,
      sleep_time: data.sleepTime,
      productive_time: data.productiveTime,
      class_days: data.classDays,
      work_status: data.workStatus,
      weekly_commitment_hours: data.weeklyCommitmentHours,
      // Social
      social_activities: data.socialActivities,
      social_frequency: data.socialFrequency,
      greek_life: data.greekLife,
      sports_teams: data.sportsTeams,
      friend_group_desc: data.friendGroupDesc,
      // Clubs
      club_types: data.clubTypes,
      specific_clubs: data.specificClubs,
      leadership_role: data.leadershipRole,
      club_time_commitment: data.clubTimeCommitment,
      volunteering: data.volunteering,
      cause_areas: data.causeAreas,
      volunteer_orgs: data.volunteerOrgs,
      volunteer_hours_per_month: data.volunteerHoursPerMonth,
      // Wellbeing
      sleep_quality: data.sleepQuality,
      stress_level: data.stressLevel,
      burnout_signals: data.burnoutSignals,
      agent_wellbeing_flag: data.agentWellbeingFlag,
      wellbeing_boundaries: data.wellbeingBoundaries,
      // Comms
      communication_style: data.communicationStyle,
      preferred_channels: data.preferredChannels,
      response_style: data.responseStyle,
      email_response_time: data.emailResponseTime,
      // Tools
      apps: data.apps,
      devices: data.devices,
      browser: data.browser,
      note_taking: data.noteTaking,
      calendar_app: data.calendarApp,
      task_manager: data.taskManager,
      // Goals
      academic_goal: data.academicGoal,
      career_goal: data.careerGoal,
      personal_goal: data.personalGoal,
      stop_doing: data.stopDoing,
      start_doing: data.startDoing,
      top_priority: data.topPriority,
      // Career
      industry_interest: data.industryInterest,
      graduation_year: data.graduationYear,
      internship_status: data.internshipStatus,
      resume_ready: data.resumeReady,
      job_search_activities: data.jobSearchActivities,
      dream_company: data.dreamCompany,
      resume_url: resumeUrl,
      // Stress
      biggest_stressors: data.biggestStressors,
      falls_through: data.fallsThrough,
      agent_handle_first: data.agentHandleFirst,
      anything_else: data.anythingElse,
      // Personality
      agent_tone: data.agentTone,
      checkin_frequency: data.checkinFrequency,
      agent_topics: data.agentTopics,
      agent_off_limits: data.agentOffLimits,
      submitted_at: new Date().toISOString(),
    }]);

    if (dbError) throw dbError;

    // Send Mandrill notification
    const mandrillKey = process.env.MANDRILL_API_KEY;
    if (mandrillKey) {
      const fullName = `${data.firstName} ${data.lastName}`;
      const school = data.school === "Other" ? data.schoolOther : data.school;
      await fetch("https://mandrillapp.com/api/1.0/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: mandrillKey,
          message: {
            from_email: "noreply@thecollegeagent.ai",
            from_name: "The College Agent",
            to: [{ email: "david@apolloclaw.ai", name: "David", type: "to" }],
            subject: `Full Agent Build Submission — ${fullName} (${school})`,
            html: `
              <h2>New Setup Submission — Full Agent Build</h2>
              <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse">
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">Name</td><td>${fullName}</td></tr>
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">Email</td><td>${data.schoolEmail}</td></tr>
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">Phone</td><td>${data.phone}</td></tr>
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">School</td><td>${school}</td></tr>
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">Year</td><td>${data.year}</td></tr>
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">Major</td><td>${data.major}</td></tr>
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">Agent Name</td><td>${data.agentName || "—"}</td></tr>
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">Industry</td><td>${data.industryInterest || "—"}</td></tr>
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">Top Priority</td><td>${data.topPriority || "—"}</td></tr>
                <tr><td style="padding:6px 16px 6px 0;font-weight:700;color:#555">Resume</td><td>${resumeUrl ? `<a href="${resumeUrl}">Download</a>` : "Not uploaded"}</td></tr>
              </table>
              <p style="margin-top:16px;font-size:13px;color:#888">Full submission stored in Supabase → the-college-agent → setup_submissions</p>
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
