import { describe, expect, it } from "vitest";
import { dayMatches, isDue, localNow, type ScheduleTiming } from "@/lib/schedule-timing";
import { cadenceFrom, planForCadence } from "@/lib/checkin-schedules";
import { SCHEDULED_RUNS, isScheduledRunId, scheduledRun } from "@/config/scheduled-runs";

// The scheduler decides when a student is messaged unprompted. Every failure mode here is one
// the student sees and we don't: a brief at 3am, two briefs in a morning, or silence.

describe("localNow", () => {
  it("reports the student's wall clock, not UTC", () => {
    // 2026-03-10T02:30:00Z — 10:30pm the PREVIOUS day in New York. Note UTC-4, not -5: DST
    // began on 8 March 2026, so this is EDT. Getting that by hand is exactly the mistake
    // localNow exists to avoid, and it caught the author of this test writing 21.
    const at = new Date("2026-03-10T02:30:00Z");
    const ny = localNow("America/New_York", at);
    expect(ny).toEqual({ date: "2026-03-09", hour: 22, weekday: "monday" });

    const utc = localNow("UTC", at);
    expect(utc?.date).toBe("2026-03-10");
    expect(utc?.hour).toBe(2);
  });

  it("handles the US spring-forward transition", () => {
    // 2026-03-08 is the US DST switch. 06:30Z is 1:30am EST; 07:30Z is 3:30am EDT (2am skipped).
    expect(localNow("America/New_York", new Date("2026-03-08T06:30:00Z"))?.hour).toBe(1);
    expect(localNow("America/New_York", new Date("2026-03-08T07:30:00Z"))?.hour).toBe(3);
  });

  it("returns null for a timezone Intl rejects, rather than throwing", () => {
    // A bad row must not take the whole hourly sweep down with it.
    expect(localNow("Not/A/Zone")).toBeNull();
    expect(localNow("")).toBeNull();
  });
});

describe("dayMatches", () => {
  it("matches daily always, and weekdays only Mon-Fri", () => {
    expect(dayMatches("daily", "sunday")).toBe(true);
    expect(dayMatches("weekdays", "wednesday")).toBe(true);
    expect(dayMatches("weekdays", "saturday")).toBe(false);
    expect(dayMatches("weekdays", "sunday")).toBe(false);
  });

  it("matches a comma-separated set, which is how twice-weekly is stored", () => {
    expect(dayMatches("monday,thursday", "thursday")).toBe(true);
    expect(dayMatches("monday,thursday", "tuesday")).toBe(false);
    expect(dayMatches("monday", "monday")).toBe(true);
  });
});

describe("isDue", () => {
  const base: ScheduleTiming = {
    hour: 8,
    days: "daily",
    timezone: "America/New_York",
    enabled: true,
    last_run_on: null,
  };
  const at8 = { date: "2026-09-02", hour: 8, weekday: "wednesday" };

  it("fires on the right local hour", () => {
    expect(isDue(base, at8)).toBe(true);
    expect(isDue(base, { ...at8, hour: 7 })).toBe(false);
    expect(isDue(base, { ...at8, hour: 9 })).toBe(false);
  });

  it("never fires twice on the same local day", () => {
    // The guard that matters: the sweep runs hourly and retries happen. Two morning check-ins
    // is far more visible to a student than one arriving late.
    expect(isDue({ ...base, last_run_on: "2026-09-02" }, at8)).toBe(false);
    expect(isDue({ ...base, last_run_on: "2026-09-01" }, at8)).toBe(true);
  });

  it("respects the enabled flag and an unresolvable timezone", () => {
    expect(isDue({ ...base, enabled: false }, at8)).toBe(false);
    expect(isDue(base, null)).toBe(false);
  });

  it("does not fire a weekdays schedule at the weekend", () => {
    const weekdays = { ...base, days: "weekdays" };
    expect(isDue(weekdays, { date: "2026-09-05", hour: 8, weekday: "saturday" })).toBe(false);
    expect(isDue(weekdays, at8)).toBe(true);
  });
});

describe("planForCadence", () => {
  it("maps each cadence onto a named run from the registry", () => {
    expect(planForCadence("Daily morning briefing")).toEqual([
      { kind: "morning-brief", hour: 8, days: "daily" },
    ]);
    expect(planForCadence("Weekly digest")).toEqual([
      { kind: "weekly-planning", hour: 18, days: "sunday" },
    ]);
  });

  it("keeps twice-weekly as the morning brief on two days", () => {
    // Not its own kind: it is the same question asked on Monday and Thursday rather than every
    // morning, so it borrows the brief's prompt and overrides only the days.
    expect(planForCadence("Twice a week")).toEqual([
      { kind: "morning-brief", hour: 8, days: "monday,thursday" },
    ]);
  });

  it("seeds two DIFFERENT runs for the more-than-once cadence", () => {
    // The thing this used to do was three copies of one prompt at 8, 12 and 17. A student who
    // asked to hear from it more than once gets two different questions answered instead.
    expect(planForCadence("Multiple times a day")).toEqual([
      { kind: "morning-brief", hour: 8, days: "daily" },
      { kind: "end-of-day", hour: 17, days: "weekdays" },
    ]);
  });

  it("never plans the same kind twice, which the unique key would reject", () => {
    for (const cadence of ["Multiple times a day", "Daily morning briefing", "Weekly digest"]) {
      const kinds = planForCadence(cadence).map((p) => p.kind);
      expect(new Set(kinds).size).toBe(kinds.length);
    }
  });

  it("only plans runs that exist in the registry", () => {
    // A plan naming a kind with no registry entry would be written and then skipped forever by
    // the sweep — a schedule the student turned on that silently never fires.
    for (const cadence of ["Multiple times a day", "Twice a week", "Weekly digest", "Daily"]) {
      for (const p of planForCadence(cadence)) expect(isScheduledRunId(p.kind)).toBe(true);
    }
  });

  it("schedules nothing for reactive or empty cadences", () => {
    // "Only when I ask" and "Real-time" are things the student starts, not things that arrive.
    expect(planForCadence("Only when I ask")).toEqual([]);
    expect(planForCadence("Real-time — whenever something comes up")).toEqual([]);
    expect(planForCadence("")).toEqual([]);
    expect(planForCadence(null)).toEqual([]);
  });

  it("takes the highest frequency when the student picked several", () => {
    expect(planForCadence("Multiple times a day, Weekly digest")).toHaveLength(2);
    expect(planForCadence("Daily morning briefing, Weekly digest")).toEqual([
      { kind: "morning-brief", hour: 8, days: "daily" },
    ]);
  });
});

describe("cadenceFrom", () => {
  it("reads both the legacy string and the multi-pick array", () => {
    expect(cadenceFrom({ checkinFrequency: "Daily morning briefing" })).toBe("Daily morning briefing");
    expect(cadenceFrom({ checkinFrequency: ["Daily morning briefing", "Weekly digest"] })).toBe(
      "Daily morning briefing, Weekly digest"
    );
  });

  it("returns null when there is no cadence at all", () => {
    expect(cadenceFrom({})).toBeNull();
    expect(cadenceFrom(null)).toBeNull();
    expect(cadenceFrom({ checkinFrequency: [] })).toBeNull();
  });
});

describe("SCHEDULED_RUNS", () => {
  it("has no duplicate ids", () => {
    // The id is the database key. Two entries sharing one means the second silently overwrites
    // the first's row, and the student loses a run they turned on.
    const ids = SCHEDULED_RUNS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("defaults to an hour and a day pattern the API would accept", () => {
    for (const r of SCHEDULED_RUNS) {
      expect(Number.isInteger(r.defaultHour)).toBe(true);
      expect(r.defaultHour).toBeGreaterThanOrEqual(0);
      expect(r.defaultHour).toBeLessThanOrEqual(23);
      expect(r.defaultDays).toMatch(
        /^(daily|weekdays|(monday|tuesday|wednesday|thursday|friday|saturday|sunday)(,(monday|tuesday|wednesday|thursday|friday|saturday|sunday))*)$/
      );
    }
  });

  it("builds a prompt that stands alone and permits silence", () => {
    // A cron run opens a FRESH session, so nothing may refer back to a chat. And every prompt
    // has to offer [SILENT]: an agent that messages whether or not it has anything to say is
    // one a student mutes within a week.
    for (const r of SCHEDULED_RUNS) {
      const text = r.prompt({ who: "Ada at Rutgers", topics: "deadlines", priority: "thesis" });
      expect(text).toContain("Ada at Rutgers");
      expect(text).toContain("deadlines");
      expect(text).toContain("[SILENT]");
    }
  });

  it("drops the priority line when the student never gave one", () => {
    // The empty string must not leak in as "Their top priority is ." — an agent told that its
    // student's priority is nothing takes it literally.
    for (const r of SCHEDULED_RUNS) {
      const text = r.prompt({ who: "Ada", topics: "deadlines", priority: "" });
      expect(text).not.toMatch(/priority[^.]*\.\s*$|priority is \./i);
      expect(text).not.toContain("  ");
    }
  });

  it("looks up by id and refuses anything else", () => {
    expect(scheduledRun("morning-brief")?.name).toBe("Morning brief");
    // The guard that stops a leftover row being run with a guessed prompt.
    expect(scheduledRun("deadline-watch")).toBeUndefined();
    expect(scheduledRun("")).toBeUndefined();
    expect(isScheduledRunId("weekly-planning")).toBe(true);
    expect(isScheduledRunId("nope")).toBe(false);
  });
});
