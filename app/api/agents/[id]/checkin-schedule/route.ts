import { requireAgentAccess } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ApiError, json, readJson, route } from "@/lib/http";
import { isValidTimezone } from "@/lib/hermes";
import { SCHEDULED_RUNS, isScheduledRunId } from "@/config/scheduled-runs";

type Ctx = { params: Promise<{ id: string }> };

// The student's own control over when their agent messages them first.
//
// Until now the cadence was fixed at onboarding and only changeable by redoing the whole
// questionnaire — the schedule was derived from an answer and then never touched again. This
// is the surface that lets them move it, turn it off, or turn it back on, which is the
// difference between a check-in that arrives at a useful moment and one they mute.
//
// There is more than one scheduled run now (config/scheduled-runs.ts), so everything here is
// keyed by KIND. GET returns one entry per registry entry whether or not a row exists, so the
// panel can offer a run the student has never turned on; PUT touches exactly the one kind named
// and leaves the others alone.
//
// Under /api/agents/*, so proxy.ts authenticates and requireAgentAccess enforces that this
// student owns THIS agent.

export interface ScheduledRunView {
  kind: string;
  name: string;
  description: string;
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

  const { data, error } = await db
    .from("checkin_schedules")
    .select("kind, enabled, hour, days, timezone, last_run_on, last_status")
    .eq("agent37_id", id);
  if (error) throw new ApiError(500, "db_error", error.message);

  const rows = data ?? [];
  const byKind = new Map(rows.map((r) => [r.kind as string, r]));

  // The registry drives the list, not the table. A run nobody has turned on has no row, and
  // still needs to appear — off, at its default hour — or there is no way to turn it on.
  const runs: ScheduledRunView[] = SCHEDULED_RUNS.map((def) => {
    const row = byKind.get(def.id);
    return {
      kind: def.id,
      name: def.name,
      description: def.description,
      enabled: row ? Boolean(row.enabled) : false,
      hour: row ? (row.hour as number) : def.defaultHour,
      days: row ? (row.days as string) : def.defaultDays,
      timezone: (row?.timezone as string | undefined) ?? null,
      lastRunOn: (row?.last_run_on as string | null | undefined) ?? null,
      lastStatus: (row?.last_status as string | null | undefined) ?? null,
    };
  });

  return json({ runs });
});

/**
 * Set one run's time, days, or on/off.
 *
 * Scoped to the `kind` in the body and nothing else. The old version of this deleted every row
 * for the agent before writing, which was right while a "check-in" was one unnamed thing and
 * would now silently wipe a student's other two runs the moment they nudged their morning brief
 * by an hour.
 */
export const PUT = route(async (request: Request, { params }: Ctx) => {
  const { id } = await params;
  const { user } = await requireAgentAccess(id, "member");
  const body = await readJson<{
    kind?: string;
    enabled?: boolean;
    hour?: number;
    days?: string;
    timezone?: string;
  }>(request);

  const kind = (body.kind ?? "").trim();
  if (!isScheduledRunId(kind)) {
    throw new ApiError(400, "invalid_request", "That isn't a scheduled run we know about.");
  }

  const hour = Number(body.hour);
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    throw new ApiError(400, "invalid_request", "Pick an hour between 0 and 23.");
  }
  const days = (body.days ?? "daily").trim();
  if (!isValidDays(days)) {
    throw new ApiError(400, "invalid_request", "That repeat setting isn't one we recognise.");
  }

  const db = createAdminClient();

  // Timezone: prefer what the browser just told us, fall back to whatever an existing row or
  // their onboarding answers carry. Refuse rather than default to UTC — a check-in with no
  // timezone lands in the middle of the night for most of the student base, and silently
  // picking one for them is how that happens.
  //
  // Any row will do for the fallback, not just this kind's: a student's zone is theirs, not
  // their morning brief's, so a second run inherits it from the first.
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

  const enabled = body.enabled !== false;

  // Upsert on (agent37_id, kind) — the unique key migration 0026 put there. Only the columns
  // named here are written, so last_run_on and last_status survive an edit: turning a run off
  // and back on keeps both the hour they picked and the record of when it last fired.
  const { data: saved, error } = await db
    .from("checkin_schedules")
    .upsert(
      {
        agent37_id: id,
        user_id: user.id,
        kind,
        hour,
        days,
        timezone,
        enabled,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "agent37_id,kind" }
    )
    .select("last_run_on, last_status")
    .maybeSingle();
  if (error) throw new ApiError(500, "db_error", error.message);

  const def = SCHEDULED_RUNS.find((r) => r.id === kind)!;
  return json({
    run: {
      kind,
      name: def.name,
      description: def.description,
      enabled,
      hour,
      days,
      timezone,
      lastRunOn: (saved?.last_run_on as string | null | undefined) ?? null,
      lastStatus: (saved?.last_status as string | null | undefined) ?? null,
    } satisfies ScheduledRunView,
  });
});
