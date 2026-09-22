import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { AMBASSADOR_PROGRAM_ENABLED } from "@/lib/ambassador";

// The ambassador program is switched off at a single constant. These guard the two ways
// that goes wrong: the flag quietly flipping back, and a new entry point being added that
// forgets to check it - which would leak attribution into a program that is not running.

const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");

describe("ambassador program is off", () => {
  it("is off", () => {
    expect(AMBASSADOR_PROGRAM_ENABLED).toBe(false);
  });

  // Every path that reads an ambassador out of the request. A new one added without the
  // flag would attribute a sale, or personalise a demo, for a program that is not running.
  it.each([
    ["app/r/[slug]/route.ts", "the share link"],
    ["app/api/build/checkout/route.ts", "checkout attribution"],
    ["app/api/demo/start/route.ts", "demo personalisation"],
    ["app/api/stripe/webhook/route.ts", "sale recording"],
    ["app/api/ambassador-request/route.ts", "the application endpoint"],
    ["app/api/ambassador/me/route.ts", "the self lookup"],
  ])("%s checks the flag (%s)", (path) => {
    expect(read(path)).toContain("AMBASSADOR_PROGRAM_ENABLED");
  });

  it.each([
    "app/ambassador/page.tsx",
    "app/ambassador/apply/page.tsx",
    "app/ambassador/dashboard/page.tsx",
    "app/ambassador/playbook/page.tsx",
    "app/ambassadors/page.tsx",
    "app/ambassadors/dashboard/page.tsx",
  ])("%s 404s while the program is off", (path) => {
    const src = read(path);
    expect(src).toContain("AMBASSADOR_PROGRAM_ENABLED");
    expect(src).toContain("notFound()");
  });

  it("keeps the admin view, which is how the stored ambassadors stay reachable", () => {
    // Off is not deleted. The two rows, their Stripe coupons and their promotion codes all
    // survive, and an admin can still see them - that is what makes this reversible.
    expect(read("app/(authed)/admin/ambassadors/page.tsx")).not.toContain("AMBASSADOR_PROGRAM_ENABLED");
  });

  it("does not link to the program from the site", () => {
    expect(read("app/components/Footer.tsx")).not.toContain("/ambassador");
    expect(read("app/sitemap.ts")).not.toContain("/ambassador");
  });
});
