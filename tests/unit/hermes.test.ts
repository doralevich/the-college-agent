import { describe, expect, it } from "vitest";
import {
  buildCheckinPrompt,
  buildSoul,
  buildUserProfile,
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

  it("stays within the ~1300-char budget, dropping lowest-priority facts rather than truncating", () => {
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
    expect(profile.trimEnd().length).toBeLessThanOrEqual(1300);
    // The highest-priority fact survives the packing.
    expect(profile).toContain("Name: Sam");
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
