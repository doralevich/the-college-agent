import { describe, expect, it } from "vitest";
import {
  isActiveStatus,
  isTransitional,
  statusVariant,
  usd,
  usdToMicros,
} from "../../lib/format";

describe("usd / usdToMicros", () => {
  it("converts dollars to micros and back", () => {
    expect(usdToMicros(20)).toBe(20_000_000);
    expect(usdToMicros(0.5)).toBe(500_000);
    expect(usd(20_000_000)).toBe("$20.00");
    expect(usd(usdToMicros(1.5))).toBe("$1.50");
  });

  it("rounds to whole micros", () => {
    expect(usdToMicros(0.0000001)).toBe(0);
  });
});

describe("statusVariant", () => {
  it("maps lifecycle states to UI variants", () => {
    expect(statusVariant("running")).toBe("success");
    expect(statusVariant("provisioning")).toBe("warning");
    expect(statusVariant("updating")).toBe("warning");
    expect(statusVariant("failed")).toBe("destructive");
    expect(statusVariant("error")).toBe("destructive");
  });

  it("falls back to muted for unknown / missing status", () => {
    expect(statusVariant("stopped")).toBe("muted");
    expect(statusVariant(undefined)).toBe("muted");
    expect(statusVariant(null)).toBe("muted");
  });
});

describe("isTransitional", () => {
  it("is true only for in-flight lifecycle states", () => {
    expect(isTransitional("starting")).toBe(true);
    expect(isTransitional("deleting")).toBe(true);
    expect(isTransitional("running")).toBe(false);
    expect(isTransitional("stopped")).toBe(false);
  });
});

describe("isActiveStatus", () => {
  it("counts running and any transitional state as active", () => {
    expect(isActiveStatus("running")).toBe(true);
    expect(isActiveStatus("provisioning")).toBe(true);
    expect(isActiveStatus("deleting")).toBe(true);
  });

  it("counts a stopped / failed / absent box as inactive", () => {
    expect(isActiveStatus("stopped")).toBe(false);
    expect(isActiveStatus("failed")).toBe(false);
    expect(isActiveStatus(null)).toBe(false);
  });
});
