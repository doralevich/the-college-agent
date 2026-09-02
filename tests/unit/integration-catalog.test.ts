import { describe, expect, it } from "vitest";
import {
  DEFAULT_INTEGRATION_TOOLKITS,
  FAVORITE_INTEGRATION_SLUGS,
  INTEGRATION_CATEGORIES,
} from "../../lib/integration-catalog";

// The Browse grid's first paint comes from this hand-maintained catalog, and its slugs are
// typed by hand while the authoritative list lives upstream at the provider. A wrong slug
// renders a normal-looking tile whose logo 404s and whose connect fails, and a favorite that
// doesn't resolve is silently dropped from the Favorites row (`.filter(Boolean)` in
// IntegrationsView) with no warning anywhere. Both fail quietly, which is how a broken tile
// reached production. These checks need no network, so they hold the hand-maintained list to
// the shape the provider requires on every run.

// Upstream slugs are lowercase alphanumerics plus underscores (googledrive, google_classroom,
// one_drive). Anything else - spaces, capitals, hyphens - cannot resolve.
const SLUG_RE = /^[a-z0-9_]+$/;

describe("integration catalog", () => {
  it("gives every toolkit a slug in the provider's format", () => {
    for (const t of DEFAULT_INTEGRATION_TOOLKITS) {
      expect(t.slug, `"${t.name}" has an invalid slug: ${JSON.stringify(t.slug)}`).toMatch(SLUG_RE);
    }
  });

  it("gives every toolkit a name and a description", () => {
    for (const t of DEFAULT_INTEGRATION_TOOLKITS) {
      expect(t.name.trim(), `${t.slug} is missing a name`).not.toBe("");
      expect((t.description ?? "").trim(), `${t.slug} is missing a description`).not.toBe("");
    }
  });

  it("lists no slug twice", () => {
    const seen = new Map<string, string>();
    for (const t of DEFAULT_INTEGRATION_TOOLKITS) {
      expect(seen.has(t.slug), `${t.slug} appears twice (${seen.get(t.slug)} and ${t.name})`).toBe(false);
      seen.set(t.slug, t.name);
    }
  });

  it("has no empty category", () => {
    for (const c of INTEGRATION_CATEGORIES) {
      expect(c.toolkits.length, `category "${c.title}" is empty`).toBeGreaterThan(0);
    }
  });

  // The Favorites row maps these slugs onto catalog entries and quietly filters out misses,
  // so a typo here removes a pinned app from Browse with no error to notice.
  it("resolves every favorite to a real catalog entry", () => {
    const slugs = new Set(DEFAULT_INTEGRATION_TOOLKITS.map((t) => t.slug));
    for (const slug of FAVORITE_INTEGRATION_SLUGS) {
      expect(slugs.has(slug), `favorite "${slug}" is not in the catalog, so it silently vanishes`).toBe(true);
    }
  });

  // Regression guard for a real support report: a student looked for Blackboard (the course
  // LMS), saw Blackbaud (school fundraising/admin software - a different company, one letter
  // apart) pinned next to Canvas, and clicked it expecting their LMS.
  describe("Blackbaud is not mistaken for Blackboard", () => {
    const blackbaud = DEFAULT_INTEGRATION_TOOLKITS.find((t) => t.slug === "blackbaud");

    it("says in its description that it is not Blackboard", () => {
      expect(blackbaud).toBeDefined();
      expect(blackbaud!.description ?? "").toMatch(/not blackboard/i);
    });

    it("never labels the blackbaud slug as Blackboard", () => {
      expect(blackbaud!.name).not.toMatch(/blackboard/i);
    });

    // If a real Blackboard connector is ever added it must be its own entry, never an alias
    // pointing at Blackbaud's slug.
    it("does not ship a Blackboard entry that reuses Blackbaud's slug", () => {
      const named = DEFAULT_INTEGRATION_TOOLKITS.filter((t) => /^blackboard/i.test(t.name));
      for (const t of named) {
        expect(t.slug, `"${t.name}" must not reuse the blackbaud slug`).not.toBe("blackbaud");
      }
    });
  });
});
