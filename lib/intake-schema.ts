// Single source of truth for the onboarding questionnaire's fields, grouped to mirror the
// 8 wizard steps. Two consumers share this so they can never drift:
//   - app/api/onboard-submit/route.ts  -> the admin summary PDF
//   - lib/hermes.ts (buildFullProfile) -> the agent's full-profile reference file
// Each entry maps a stored questionnaire key to a human label. Keys are the ACTUAL form
// field names emitted into the `data` blob (and stored in onboard_submissions.questionnaire).
export type IntakeGroup = { heading: string; fields: Array<[key: string, label: string]> };

export const INTAKE_GROUPS: IntakeGroup[] = [
  {
    heading: "About You",
    fields: [
      ["role", "Role"],
      ["roleTitle", "Title"],
      ["department", "Team / Department"],
      ["sportsOversee", "Sports / Programs"],
      ["staffSize", "Staff Size"],
      ["staffFocus", "Wants Handled"],
      ["coordinateWith", "Coordinates With"],
      ["crunchTimes", "Crunch Periods"],
      ["schoolEmail", "School Email"],
      ["personalEmail", "Personal Email"],
      ["phone", "Phone"],
      ["school", "School"],
      ["agentName", "Agent Name"],
      ["year", "Year"],
      ["major", "Major"],
      ["minor", "Minor"],
      ["livingSituation", "Living Situation"],
    ],
  },
  {
    heading: "Academic Life",
    fields: [
      ["currentClasses", "Current Classes"],
      ["lmsType", "LMS"],
      ["gpaGoal", "GPA Goal"],
      ["academicChallenges", "Academic Challenges"],
      ["studyStyle", "Study Style"],
      ["studyMethods", "Study Methods"],
      ["studyTime", "Best Study Time"],
      ["studyLocation", "Study Location"],
      ["studySessionLength", "Session Length"],
    ],
  },
  {
    heading: "Schedule & Routine",
    fields: [
      ["wakeTime", "Wake Time"],
      ["sleepTime", "Sleep Time"],
      ["productiveTime", "Most Productive"],
      ["classDays", "Class Days"],
      ["workStatus", "Work Status"],
      ["weeklyHours", "Weekly Hours"],
    ],
  },
  {
    heading: "Social & Campus Life",
    fields: [
      ["greekLife", "Greek Life"],
      ["greekOrg", "Fraternity / Sorority"],
      ["greekRole", "Chapter Role"],
      ["greekAmbassador", "Ambassador Interest"],
      ["sportsTeams", "Sports Teams"],
      ["clubs", "Clubs / Orgs"],
      ["clubsDetail", "Club Names & Details"],
      ["socialLife", "Social Life"],
      ["family", "Family"],
      ["socialFrequency", "Social Frequency"],
      ["socialActivities", "Social Activities"],
      ["clubTypes", "Clubs & Orgs"],
      ["specificClubs", "Specific Clubs"],
      ["leadershipRole", "Leadership Role"],
      ["clubTimeCommitment", "Club Time/Week"],
      ["volunteering", "Volunteering"],
      ["causeAreas", "Cause Areas"],
      ["volunteerOrgs", "Volunteer Orgs"],
    ],
  },
  {
    heading: "Mental Health & Wellbeing",
    fields: [
      ["sleepQuality", "Sleep Quality"],
      ["stressLevel", "Stress Level"],
      ["burnoutSignals", "Burnout Signals"],
      ["stressBurnout", "Stress / Burnout (free text)"],
      ["agentWellbeingFlag", "Wellbeing Flagging"],
      ["wellbeingBoundaries", "Wellbeing Boundaries"],
    ],
  },
  {
    heading: "Tools & Communication",
    fields: [
      ["integrationsWanted", "Integrations Wanted"],
      ["apps", "Apps"],
      ["devices", "Devices"],
      ["browser", "Browser"],
      ["noteTaking", "Note Taking"],
      ["calendarApp", "Calendar"],
      ["taskManager", "Task Manager"],
      ["commStyle", "Writing Style"],
      ["preferredChannels", "Channels"],
      ["responseStyle", "Response Style"],
      ["emailResponseTime", "Email Response Time"],
    ],
  },
  {
    heading: "Goals & Career",
    fields: [
      ["topPriority", "Top Priorities"],
      ["topPriorityNotes", "Priority Notes"],
      ["academicGoal", "Academic Goal"],
      ["careerGoal", "Career Goal"],
      ["personalGoal", "Personal Goal"],
      ["stopDoing", "Wants to Stop"],
      ["startDoing", "Wants to Start"],
      ["industryInterest", "Industry"],
      ["graduationYear", "Graduation Year"],
      ["summerPlans", "Summer Plans"],
      ["afterCollege", "Plan After College"],
      ["afterCollegeDetail", "After-College Details"],
      ["internshipStatus", "Internship Status"],
      ["resumeReady", "Resume Ready"],
      ["jobSearchActivities", "Job Search"],
      ["dreamCompany", "Dream Company"],
      ["biggestStressors", "Biggest Stressors"],
      ["fallsThrough", "Falls Through Cracks"],
      ["agentHandleFirst", "Success Looks Like"],
      ["agentHandleFirstNotes", "Success Notes"],
    ],
  },
  {
    heading: "Your Agent",
    fields: [
      ["agentTone", "Tone"],
      ["checkinFrequency", "Check-in Frequency"],
      ["agentTopics", "Surface Proactively"],
      ["agentOffLimits", "Off Limits"],
      ["wantDeepDive", "Deep-Dive Opt-In"],
      ["anythingElse", "Anything Else"],
    ],
  },
];

// Flatten a stored questionnaire value to a clean string ("" when empty/absent). Arrays are
// comma-joined. Shared by the PDF renderer and the full-profile builder.
export function formatIntakeValue(v: unknown): string {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean).join(", ");
  return typeof v === "string" ? v.trim() : v == null ? "" : String(v);
}
