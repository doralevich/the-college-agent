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
  //
  // Checkout attribution, sale recording and the self lookup used to be on this list. They
  // went with this site's checkout, webhook and sign-in when selling moved to ApolloClaw
  // (Nov 2026); a revived program records its sales over there, from the promotion code on
  // the checkout session.
  it.each([
    ["app/r/[slug]/route.ts", "the share link"],
    ["app/api/demo/start/route.ts", "demo personalisation"],
    ["app/api/ambassador-request/route.ts", "the application endpoint"],
  ])("%s checks the flag (%s)", (path) => {
    expect(read(path)).toContain("AMBASSADOR_PROGRAM_ENABLED");
  });

  // The ambassador dashboard and playbook pages are gone rather than hidden: they needed this
  // site's own sign-in, which it no longer has.
  it.each([
    "app/ambassador/page.tsx",
    "app/ambassador/apply/page.tsx",
    "app/ambassadors/page.tsx",
  ])("%s 404s while the program is off", (path) => {
    const src = read(path);
    expect(src).toContain("AMBASSADOR_PROGRAM_ENABLED");
    expect(src).toContain("notFound()");
  });

  // Off is still not deleted: the ambassadors table, the approved rows, their Stripe coupons
  // and promotion codes all survive in this site's Supabase project. The admin view that
  // listed them went with the rest of the signed-in surfaces; the rows are reachable from the
  // Supabase dashboard until a revived program gets a page again.

  it("does not link to the program from the site", () => {
    expect(read("app/components/Footer.tsx")).not.toContain("/ambassador");
    expect(read("app/sitemap.ts")).not.toContain("/ambassador");
  });
});
