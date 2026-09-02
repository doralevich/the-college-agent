// When a scheduled check-in is due. Pure arithmetic, deliberately separated from the runner
// (lib/checkin-schedules.ts), which does the I/O.
//
// This is the part most likely to be quietly wrong — weekday names, midnight, the last Sunday in
// March — and the part with no I/O in it. Splitting it out means it can be exercised directly
// rather than by waiting until 8am and seeing what turns up in a student's Telegram.
//
// Ported from ApolloClaw, which has been running it hourly in production. Kept as its own copy
// rather than shared: the two apps are separate deployments with separate databases, and a
// shared package between them is a bigger commitment than ~90 lines of date arithmetic.

export interface ScheduleTiming {
  hour: number;
  days: string;
  timezone: string;
  enabled: boolean;
  last_run_on: string | null;
}

export interface LocalNow {
  /** YYYY-MM-DD in the schedule's own timezone. */
  date: string;
  /** 0-23, local. */
  hour: number;
  /** Lowercase English weekday name. */
  weekday: string;
}

/**
 * The local wall-clock date, hour and weekday in a given timezone.
 *
 * Done with Intl rather than offset arithmetic on purpose: it knows about DST, and every attempt
 * to do this by hand is correct until the clocks change.
 *
 * Returns null for a timezone Intl rejects. A bad row should be skipped, not throw once an hour
 * forever and take the whole sweep down with it.
 */
export function localNow(timeZone: string, at: Date = new Date()): LocalNow | null {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hour12: false,
      weekday: "long",
    }).formatToParts(at);

    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
    const year = get("year");
    const hour = Number(get("hour"));
    const weekday = get("weekday").toLowerCase();
    if (!year || Number.isNaN(hour) || !weekday) return null;

    return {
      date: `${year}-${get("month")}-${get("day")}`,
      // Some locales render midnight as "24" under hour12: false.
      hour: hour % 24,
      weekday,
    };
  } catch {
    return null;
  }
}

const WEEKEND = new Set(["saturday", "sunday"]);

export function dayMatches(days: string, weekday: string): boolean {
  if (days === "daily") return true;
  if (days === "weekdays") return !WEEKEND.has(weekday);
  // A comma-separated set, e.g. "monday,thursday" for a twice-weekly cadence.
  return days.split(",").some((d) => d.trim() === weekday);
}

/**
 * Is this schedule due right now?
 *
 * Conservative in one direction on purpose: a schedule that already ran today does not run again,
 * even if the cron fires twice or a retry lands. Two morning check-ins is far more visible to a
 * student than one arriving an hour late.
 *
 * The cost of that choice: an hour missed entirely — a cron outage spanning it — is skipped for
 * the day rather than caught up later. That is the right trade for a morning brief, which is
 * worthless at 2pm.
 */
export function isDue(row: ScheduleTiming, now: LocalNow | null = localNow(row.timezone)): boolean {
  if (!row.enabled) return false;
  if (!now) return false;
  if (now.hour !== row.hour) return false;
  if (!dayMatches(row.days, now.weekday)) return false;
  if (row.last_run_on === now.date) return false;
  return true;
}
