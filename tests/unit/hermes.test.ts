import { describe, expect, it } from "vitest";
import {
  buildCheckinPrompt,
  buildSoul,
  buildUserProfile,
  buildFullProfile,
  mapCheckinToCron,
  type HermesPersonaInput,
} from "../../lib/hermes";

// These build the files Hermes actually reads when a student's agent is provisioned
// (SOUL.md identity, USER.md profile, the check-in cron + prompt). They're pure string
// builders, so we can lock down the mapping without touching a real instance.

describe("mapCheckinToCron", () => {
  it("maps daily / morning-briefing cadences to an 8am daily job", () => {
    expect(mapCheckinToCron("Daily morning briefing")).toEqual({
      schedule: "0 8 * * *",
      label: "daily morning",
    });
  });

  it("maps twice-weekly and weekly cadences", () => {
    expect(mapCheckinToCron("Twice a week")?.schedule).toBe("0 8 * * 1,4");
    expect(mapCheckinToCron("Weekly digest")?.schedule).toBe("0 8 * * 1");
  });

  it("returns null for reactive / unmappable / empty cadences", () => {
    expect(mapCheckinToCron("Only when I ask")).toBeNull();
    expect(mapCheckinToCron("Real-time — whenever something comes up")).toBeNull();
    expect(mapCheckinToCron("")).toBeNull();
    expect(mapCheckinToCron(null)).toBeNull();
  });
});

describe("buildSoul", () => {
  it("uses the agent's chosen name and tone", () => {
    const soul = buildSoul({
      agentName: "Athena",
      questionnaire: { agentTone: "dry and witty" },
    });
    expect(soul).toContain("You are Athena");
    expect(soul).toContain("Tone: dry and witty");
    expect(soul.startsWith("# Identity")).toBe(true);
  });

  it("falls back to the default name and tone when none are given", () => {
    const soul = buildSoul({});
    expect(soul).toContain("You are College Agent");
    expect(soul).toContain("warm, focused, and direct");
  });

  it("adds an explicit off-limits line when the student named topics to avoid", () => {
    const soul = buildSoul({ questionnaire: { agentOffLimits: "my GPA" } });
    expect(soul).toContain("Never bring up: my GPA");
  });

  it("points the agent at the on-demand full-profile reference file", () => {
    const soul = buildSoul({ agentName: "Athena" });
    expect(soul).toContain("# Background file");
    expect(soul).toContain("~/.hermes/context/STUDENT_PROFILE.md");
  });
});

describe("buildFullProfile", () => {
  it("renders every answered field grouped like the wizard, plus the résumé link", () => {
    const doc = buildFullProfile({
      firstName: "Sam",
      lastName: "Lee",
      school: "State U",
      resumeUrl: "https://files.example.com/sam-resume.pdf",
      questionnaire: {
        currentClasses: "MATH 221 - Mon/Wed - 10:00",
        volunteerOrgs: "Habitat for Humanity",
        sleepQuality: "poor",
        dreamCompany: "SpaceX",
      },
    });
    expect(doc).toContain("**Name:** Sam Lee");
    // Fields that never reached USER.md still land in the full reference file.
    expect(doc).toContain("## Social & Campus Life");
    expect(doc).toContain("Volunteer Orgs:** Habitat for Humanity");
    expect(doc).toContain("Sleep Quality:** poor");
    expect(doc).toContain("Dream Company:** SpaceX");
    expect(doc).toContain("## Résumé");
    expect(doc).toContain("https://files.example.com/sam-resume.pdf");
  });

  it("skips empty groups and answers", () => {
    const doc = buildFullProfile({ firstName: "Sam", questionnaire: { major: "CS" } });
    expect(doc).toContain("**Name:** Sam");
    // No wellbeing answers -> no wellbeing section.
    expect(doc).not.toContain("## Mental Health & Wellbeing");
  });
});

describe("buildUserProfile", () => {
  it("packs core facts in priority order, § delimited", () => {
    const profile = buildUserProfile({
      firstName: "Sam",
      lastName: "Lee",
      school: "State U",
      year: "Sophomore",
      major: "CS",
    });
    expect(profile).toContain("Name: Sam Lee");
    expect(profile).toContain("School: State U");
    expect(profile.indexOf("Name:")).toBeLessThan(profile.indexOf("School:"));
    expect(profile).toContain("§");
  });

  it("stays within the ~2600-char budget, dropping lowest-priority facts rather than truncating", () => {
    const long = "x".repeat(280);
    const profile = buildUserProfile({
      firstName: "Sam",
      school: "State U",
      questionnaire: {
        topPriority: long,
        agentHandleFirst: long,
        academicGoal: long,
        careerGoal: long,
        personalGoal: long,
        anythingElse: long,
      },
    });
    expect(profile.trimEnd().length).toBeLessThanOrEqual(2600);
    // The highest-priority fact survives the packing.
    expect(profile).toContain("Name: Sam");
  });

  it("now surfaces the high-value proactive-care + working-style signals", () => {
    const profile = buildUserProfile({
      firstName: "Sam",
      questionnaire: {
        biggestStressors: "falling behind in orgo",
        fallsThrough: "replying to professor emails",
        calendarApp: "Google Calendar",
        taskManager: "Todoist",
        commStyle: "casual but concise",
      },
    });
    expect(profile).toContain("Biggest stressors: falling behind in orgo");
    expect(profile).toContain("Tends to let slip / fall through: replying to professor emails");
    expect(profile).toContain("Google Calendar");
    expect(profile).toContain("Writing / comm style: casual but concise");
  });

  // The reported bug: classes were collected at intake but never reached the agent's brain.
  it("renders the structured class schedule (the fix)", () => {
    const profile = buildUserProfile({
      firstName: "Sam",
      school: "State U",
      questionnaire: {
        classes: [
          { name: "MATH 221", days: "Mon/Wed", time: "10:00", location: "Rm 204", professor: "Dr. Chen", sku: "SECRETSKU" },
          { name: "BIO 101", days: "Tue/Thu", time: "13:00", location: "", professor: "", sku: "" },
        ],
      },
    });
    expect(profile).toContain("Current classes:");
    expect(profile).toContain("MATH 221 (Mon/Wed, 10:00, Rm 204, Dr. Chen)");
    expect(profile).toContain("BIO 101 (Tue/Thu, 13:00)");
    // The internal `sku` is never surfaced to the agent.
    expect(profile).not.toContain("SECRETSKU");
  });

  it("falls back to the legacy currentClasses text blob when there's no structured array", () => {
    const profile = buildUserProfile({
      questionnaire: { currentClasses: "PSYC 100 - Mon - 9:00; ENGL 210 - Fri - 11:00" },
    });
    expect(profile).toContain("Current classes: PSYC 100 - Mon - 9:00; ENGL 210 - Fri - 11:00");
  });

  it("keeps classes even when lower-priority facts are dropped for budget", () => {
    const long = "y".repeat(280);
    const profile = buildUserProfile({
      firstName: "Sam",
      major: "CS",
      questionnaire: {
        classes: [{ name: "CS 340", days: "MWF", time: "9:00", location: "", professor: "", sku: "" }],
        careerGoal: long,
        personalGoal: long,
        summerPlans: long,
        clubs: long,
        anythingElse: long,
      },
    });
    expect(profile).toContain("CS 340");
  });
});

describe("buildCheckinPrompt", () => {
  it("embeds who the student is and ends with the [SILENT] escape hatch", () => {
    const persona: HermesPersonaInput = {
      firstName: "Sam",
      school: "State U",
      questionnaire: { topPriority: "thesis" },
    };
    const prompt = buildCheckinPrompt(persona, "daily morning");
    expect(prompt).toContain("daily morning check-in for Sam at State U");
    expect(prompt).toContain("thesis");
    expect(prompt).toContain("[SILENT]");
  });
});
