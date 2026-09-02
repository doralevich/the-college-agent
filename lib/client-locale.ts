// Where and when the student actually is, read from their own machine.
//
// David's rule for this: "Time should be based on the computer and use those locations." So
// nothing here asks the student to pick a timezone out of a list — the browser already knows,
// and a list is one more thing to get wrong. Everything is best-effort and returns null rather
// than guessing: a wrong timezone is worse than none, because it silently moves every deadline
// and every scheduled check-in.
//
// Browser-only. Every function guards `typeof window` so it is safe to import from a component
// that also renders on the server.

/** Where NewChatTopBar parks the city its weather lookup resolved, for the rest of the app. */
const LOCATION_CACHE_KEY = "ca-detected-location";

/**
 * The student's IANA zone, e.g. "America/New_York".
 *
 * This is the value that matters: it goes to the agent box as TZ, so `hermes cron` fires at
 * the student's 8am instead of UTC's. Validated before it is returned — `resolvedOptions()`
 * can hand back "UTC" on a misconfigured machine, which is legitimate, but it has also been
 * seen returning empty strings.
 */
export function detectTimezone(): string | null {
  if (typeof Intl === "undefined") return null;
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz && tz.includes("/") ? tz : tz === "UTC" ? "UTC" : null;
  } catch {
    return null;
  }
}

/**
 * The city part of an IANA zone: "America/New_York" -> "New York", "Europe/London" -> "London".
 *
 * A fallback, not a substitute for a real geolocation lookup — the zone names a representative
 * city for a whole region, so a student in Hartford reads "New York". It is right about the
 * region and roughly right about the place, which beats showing nothing, and it costs no
 * permission prompt.
 */
export function cityFromTimezone(tz: string | null | undefined): string | null {
  if (!tz || !tz.includes("/")) return null;
  const last = tz.split("/").pop();
  if (!last) return null;
  return last.replace(/_/g, " ");
}

/** Remember a city a real geolocation lookup resolved, so other surfaces can reuse it. */
export function cacheDetectedLocation(city: string | null | undefined): void {
  if (typeof window === "undefined" || !city?.trim()) return;
  try {
    window.localStorage.setItem(LOCATION_CACHE_KEY, city.trim());
  } catch {
    // Private mode / storage disabled. The timezone fallback still works.
  }
}

/**
 * The student's city — the real one when the weather card has resolved it, otherwise the one
 * implied by their timezone.
 *
 * Deliberately does NOT call navigator.geolocation: this runs on form submit and on the chat
 * header, and neither is a moment to throw a permission prompt at someone. The prompt belongs
 * to the weather card, which the student opts into; this just reuses what that found.
 */
export function detectLocation(): string | null {
  if (typeof window !== "undefined") {
    try {
      const cached = window.localStorage.getItem(LOCATION_CACHE_KEY);
      if (cached?.trim()) return cached.trim();
    } catch {
      // fall through to the timezone-derived city
    }
  }
  return cityFromTimezone(detectTimezone());
}
