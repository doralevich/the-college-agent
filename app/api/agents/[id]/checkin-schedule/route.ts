import { requireAgentAccess } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ApiError, json, readJson, route } from "@/lib/http";
import { isValidTimezone } from "@/lib/hermes";

type Ctx = { params: Promise<{ id: string }> };

// The student's own control over when their agent messages them first.
//
// Until now the cadence was fixed at onboarding and only changeable by redoing the whole
// questionnaire — the schedule was derived from an answer and then never touched again. This
// is the surface that lets them move it, turn it off, or turn it back on, which is the
// difference between a check-in that arrives at a useful moment and one they mute.
//
// Under /api/agents/*, so proxy.ts authenticates and requireAgentAccess enforces that this
// student owns THIS agent.

export interface CheckinScheduleView {
  enabled: boolean;
  hour: number;
  days: string;
  timezone: string | null;
  lastRunOn: string | null;
  lastStatus: string | null;
}

/** 'daily' and 'weekdays' plus any comma-separated set of weekday names. */
const WEEKDAY_NAMES = new Set([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

function isValidDays(days: string): boolean {
  if (days === "daily" || days === "weekdays") return true;
  const parts = days.split(",").map((d) => d.trim());
  return parts.length > 0 && parts.every((d) => WEEKDAY_NAMES.has(d));
}

export const GET = route(async (_request: Request, { params }: Ctx) => {
  const { id } = await params;
  await requireAgentAccess(id, "member");
  const db = createAdminClient();

  // The lowest hour is the one a student thinks of as "their" check-in — the thrice-daily
  // cadence writes three rows, and the morning one is the anchor the others hang off.
  const { data, error } = await db
    .from("checkin_schedules")
    .select("enabled, hour, days, timezone, last_run_on, last_status")
    .eq("agent37_id", id)
    .order("hour", { ascending: true });
  if (error) throw new ApiError(500, "db_error", error.message);

  const rows = data ?? [];
  const first = rows[0];
  const schedule: CheckinScheduleView | null = first
    ? {
        enabled: Boolean(first.enabled),
        hour: first.hour as number,
        days: first.days as string,
        timezone: (first.timezone as string) ?? null,
        lastRunOn: (first.last_run_on as string | null) ?? null,
        lastStatus: (first.last_status as string | null) ?? null,
      }
    : null;

  return json({ schedule, count: rows.length });
});

/**
 * Set the check-in time, days, or on/off.
 *
 * Writes a SINGLE row, replacing whatever was there. A student adjusting their time in the UI
 * is expressing one intent — "message me then" — so a cadence that had been three rows collapses
 * to the one they just chose rather than leaving two orphans firing at hours they never picked.
 */
export const PUT = route(async (request: Request, { params }: Ctx) => {
  const { id } = await params;
  const { user } = await requireAgentAccess(id, "member");
  const body = await readJson<{ enabled?: boolean; hour?: number; days?: string; timezone?: string }>(
    request
  );

  const hour = Number(body.hour);
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    throw new ApiError(400, "invalid_request", "Pick an hour between 0 and 23.");
  }
  const days = (body.days ?? "daily").trim();
  if (!isValidDays(days)) {
    throw new ApiError(400, "invalid_request", "That repeat setting isn't one we recognise.");
  }

  const db = createAdminClient();

  // Timezone: prefer what the browser just told us, fall back to whatever the existing row or
  // their onboarding answers carry. Refuse rather than default to UTC — a check-in with no
  // timezone lands in the middle of the night for most of the student base, and silently
  // picking one for them is how that happens.
  const { data: existing } = await db
    .from("checkin_schedules")
    .select("timezone")
    .eq("agent37_id", id)
    .limit(1)
    .maybeSingle();
  const { data: onboard } = await db
    .from("onboard_submissions")
    .select("questionnaire")
    .eq("user_id", user.id)
    .maybeSingle();
  const fromIntake = (onboard?.questionnaire as Record<string, unknown> | null)?.timezone;

  const timezone = [body.timezone, existing?.timezone as string | undefined, fromIntake].find(
    (tz): tz is string => isValidTimezone(typeof tz === "string" ? tz : undefined)
  );
  if (!timezone) {
    throw new ApiError(
      400,
      "no_timezone",
      "We don't know your time zone yet, so we can't schedule a check-in. Reload this page and try again."
    );
  }

  await db.from("checkin_schedules").delete().eq("agent37_id", id);
  const { error } = await db.from("checkin_schedules").insert({
    agent37_id: id,
    user_id: user.id,
    hour,
    days,
    timezone,
    enabled: body.enabled !== false,
  });
  if (error) throw new ApiError(500, "db_error", error.message);

  return json({
    schedule: {
      enabled: body.enabled !== false,
      hour,
      days,
      timezone,
      lastRunOn: null,
      lastStatus: null,
    } satisfies CheckinScheduleView,
  });
});
