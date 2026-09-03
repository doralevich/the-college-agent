import "server-only";
import { instanceFetch } from "@/lib/agent37";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTelegramMessage } from "@/lib/telegram";
import { isDue, localNow } from "@/lib/schedule-timing";
import { buildCheckinPrompt, isValidTimezone, type HermesPersonaInput } from "@/lib/hermes";
import { getChannelConfig } from "@/lib/channels/store";
import * as telegramChannel from "@/lib/channels/telegram";
import * as slackChannel from "@/lib/channels/slack";
import * as whatsappChannel from "@/lib/channels/whatsapp";
import type { ChannelId } from "@/config/channels";

// The proactive check-in, driven from here instead of from inside the agent box.
//
// A check-in is the one thing the agent does that nobody asks it for, and it used to be a
// `hermes cron` job written onto the instance at provision time. That coupled the product's
// headline feature to one runtime: an OpenClaw box has no `hermes cron`, so a College Agent
// provisioned from the Apollo template would simply never check in, silently.
//
// Driving it from the app removes that coupling entirely, because invoking an agent goes through
// Agent37's own /v1/responses API, which every template serves. It also puts the schedule on the
// STUDENT's clock rather than the box's (which is UTC) — see lib/schedule-timing.ts.

type DB = ReturnType<typeof createAdminClient>;

export interface CheckinScheduleRow {
  id: number;
  agent37_id: string;
  user_id: string | null;
  hour: number;
  days: string;
  timezone: string;
  enabled: boolean;
  last_run_on: string | null;
  last_status: string | null;
  last_error: string | null;
}

/**
 * The student's chosen cadence -> the rows that implement it.
 *
 * Mirrors mapCheckinToCron (lib/hermes.ts), which produced cron expressions for the in-box job:
 * the same cadences, the same 8am/12pm/5pm hours, expressed as (hour, days) pairs the sweep can
 * compare against a wall clock. Reactive cadences ("only when I ask", "real-time") produce no
 * rows at all — they are things the student initiates, not things that arrive.
 */
export function planForCadence(cadence: string | null | undefined): { hour: number; days: string }[] {
  const c = (cadence || "").toLowerCase();
  if (!c) return [];
  // Highest frequency wins when several are selected — the form allows multiple, and a student
  // who asked for both "daily morning" and "weekly digest" should get the daily one.
  if (c.includes("multiple")) {
    return [
      { hour: 8, days: "daily" },
      { hour: 12, days: "daily" },
      { hour: 17, days: "daily" },
    ];
  }
  if (c.includes("daily") || c.includes("morning briefing")) return [{ hour: 8, days: "daily" }];
  if (c.includes("twice")) return [{ hour: 8, days: "monday,thursday" }];
  if (c.includes("weekly")) return [{ hour: 8, days: "monday" }];
  return [];
}

/** The cadence out of the questionnaire, which may be a single string or (newer form) an array. */
export function cadenceFrom(questionnaire: Record<string, unknown> | null | undefined): string | null {
  const raw = questionnaire?.checkinFrequency;
  if (Array.isArray(raw)) return raw.filter(Boolean).join(", ") || null;
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

/**
 * Make the stored schedule match the student's current answers. Idempotent — safe to call on
 * every provision and re-provision.
 *
 * A student with no captured timezone gets NO rows. That is deliberate: the alternative is
 * assuming UTC, which is the middle of the night for most of the base, and a check-in at 3am is
 * worse than no check-in. They pick one up as soon as they visit /setup, which backfills the
 * timezone and re-runs this.
 */
export async function syncCheckinSchedule(
  db: DB,
  agent37Id: string,
  userId: string | null,
  cadence: string | null | undefined,
  timezone: string | null | undefined
): Promise<{ rows: number; reason?: string }> {
  const wanted = isValidTimezone(timezone) ? planForCadence(cadence) : [];
  const reason = !isValidTimezone(timezone)
    ? "no valid timezone captured for this student"
    : wanted.length === 0
      ? "cadence is reactive or unset - nothing to schedule"
      : undefined;

  // Replace rather than merge: the student's cadence is the source of truth, and a stale row
  // from a previous answer would keep firing at an hour they no longer asked for.
  await db.from("checkin_schedules").delete().eq("agent37_id", agent37Id);
  if (wanted.length === 0) return { rows: 0, reason };

  const { error } = await db.from("checkin_schedules").insert(
    wanted.map((w) => ({
      agent37_id: agent37Id,
      user_id: userId,
      hour: w.hour,
      days: w.days,
      timezone: timezone as string,
      enabled: true,
    }))
  );
  if (error) throw new Error(error.message);
  return { rows: wanted.length };
}


// The student's intake, read here rather than imported from lib/provisioning.
//
// provisioning.ts calls syncCheckinSchedule (below) whenever it reconfigures an agent, so
// importing readProvisioningIntake back out of it would make the two modules import each other.
// ESM tolerates that until it doesn't — one of the two ends up half-initialised at run time,
// depending on which was loaded first, and the failure is a mystery `undefined is not a
// function` inside an hourly cron nobody is watching. Two small queries are cheaper than that.
//
// Only the fields a check-in actually needs: what to say, and where to send it. Telegram
// credentials are stored as given (only the BYO model keys are encrypted at rest).
async function readIntakeForCheckin(db: DB, userId: string) {
  const [onboardRes, setupRes] = await Promise.all([
    db
      .from("onboard_submissions")
      .select("first_name, last_name, school, year, major, agent_name, questionnaire")
      .eq("user_id", userId)
      .maybeSingle(),
    db
      .from("setup_submissions")
      .select("telegram_token, telegram_user_id")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);
  return {
    onboard: onboardRes.data as {
      first_name: string | null;
      last_name: string | null;
      school: string | null;
      year: string | null;
      major: string | null;
      agent_name: string | null;
      questionnaire: Record<string, unknown> | null;
    } | null,
    setup: setupRes.data as { telegram_token: string | null; telegram_user_id: string | null } | null,
  };
}

type Delivery = {
  channel: ChannelId;
  token: string;
  to: string;
  /** WhatsApp's Phone Number ID; unused by the others. */
  externalId: string | null;
};

/** The first connected channel with somewhere to send. */
async function pickChannel(agent37Id: string): Promise<Delivery | null> {
  for (const channel of ["telegram", "slack", "whatsapp"] as const) {
    const config = await getChannelConfig(agent37Id, channel).catch(() => null);
    if (!config?.ownerChatId) continue;
    if (channel === "whatsapp" && !config.externalId) continue;
    return {
      channel,
      token: config.token,
      to: config.ownerChatId,
      externalId: config.externalId,
    };
  }
  return null;
}

async function deliver(d: Delivery, text: string): Promise<void> {
  if (d.channel === "telegram") return telegramChannel.sendMessage(d.token, d.to, text);
  if (d.channel === "slack") return slackChannel.postMessage(d.token, d.to, text);
  return whatsappChannel.sendMessage(d.externalId!, d.token, d.to, text);
}

/** One agent turn, without naming a model. */
async function runAgentTurn(agent37Id: string, input: string): Promise<string> {
  // No `model` in the payload, on purpose. The metered gateway on some builds rejects a vendor
  // model id ("Invalid model. Use openclaw...") and returns 200 with that error wrapped INSIDE a
  // failed turn, so naming one breaks those instances in a way an HTTP status check never sees.
  // Omitting it lets each instance run its own default, which works on every build.
  //
  // No session_id either: a scheduled check-in starts clean rather than continuing yesterday's
  // chat, which would drag a week of unrelated context into every morning.
  const res = await instanceFetch(agent37Id, "/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input, stream: false }),
  });
  if (!res.ok) throw new Error(`agent turn failed: HTTP ${res.status}`);

  const body = (await res.json()) as {
    status?: string;
    output_text?: string;
    error?: { message?: string };
  };
  if (body.status === "completed" && body.output_text?.trim()) return body.output_text.trim();
  // A 200 carrying a failed turn. Surfacing the inner message is the difference between a row
  // that says what went wrong and one that says "error".
  throw new Error(body.error?.message || `turn did not complete (status=${body.status ?? "unknown"})`);
}

/**
 * Run one schedule: build the prompt from the student's intake, ask the agent, deliver it,
 * and record what happened.
 */
export async function runCheckin(row: CheckinScheduleRow): Promise<string> {
  const db = createAdminClient();
  const today = localNow(row.timezone)?.date ?? null;

  const finish = async (status: string, error?: string) => {
    await db
      .from("checkin_schedules")
      .update({
        last_run_on: today,
        last_status: status,
        last_error: error ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    return status;
  };

  try {
    if (!row.user_id) return finish("no_student");

    const { onboard, setup } = await readIntakeForCheckin(db, row.user_id);

    // Where this check-in should arrive.
    //
    // Order is preference, not capability: a student who connected two gets it in the one they
    // set up for conversation first. ownerChatId is the real test rather than "connected" -
    // until somebody has messaged the bot we have no address to send to, so a connected channel
    // nobody has spoken to cannot receive.
    const delivery = await pickChannel(row.agent37_id);

    // The legacy Telegram fields, from before channels existed: /setup wrote the token and the
    // student's numeric id straight into setup_submissions for the in-box gateway. Kept as the
    // fallback so students connected the old way keep getting check-ins without reconnecting.
    const legacyToken = setup?.telegram_token ?? null;
    const legacyChatId = setup?.telegram_user_id ?? null;

    // Telegram is not the only channel any more, but it is still the only fallback: a student
    // who never connected anything simply doesn't get one, and the row says so - which is what
    // lets the dashboard tell them to connect a chat app rather than showing "something went
    // wrong".
    if (!delivery && !(legacyToken && legacyChatId)) return finish("no_channel");

    const persona: HermesPersonaInput = {
      agentName: onboard?.agent_name ?? null,
      firstName: onboard?.first_name ?? null,
      lastName: onboard?.last_name ?? null,
      school: onboard?.school ?? null,
      year: onboard?.year ?? null,
      major: onboard?.major ?? null,
      questionnaire: onboard?.questionnaire ?? null,
    };
    const label = row.days === "daily" ? "daily" : row.days === "weekdays" ? "weekday" : "scheduled";

    const text = await runAgentTurn(row.agent37_id, buildCheckinPrompt(persona, label));

    // The prompt tells the agent to reply with only [SILENT] when there is genuinely nothing
    // worth sending. Honour it: an agent that messages every single morning regardless of
    // whether it has anything to say is one a student mutes within a week.
    if (/^\[SILENT\]$/i.test(text.trim())) return finish("silent");

    // Each provider caps a message length and REJECTS anything longer rather than truncating,
    // so a check-in listing a week of deadlines would be lost entirely. The channel helpers
    // split; the legacy path below does not, which is one more reason it is only a fallback.
    if (delivery) {
      try {
        await deliver(delivery, text);
        return finish(`delivered:${delivery.channel}`);
      } catch (e) {
        return finish("send_failed", (e as Error).message.slice(0, 500));
      }
    }
    const sent = await sendTelegramMessage(legacyToken!, legacyChatId!, text);
    return finish(sent ? "delivered:telegram_legacy" : "send_failed");
  } catch (err) {
    const message = (err as Error).message;
    console.error("[checkins] run failed", row.agent37_id, message);
    return finish("error", message.slice(0, 500));
  }
}

/**
 * The hourly sweep. Reads every enabled schedule, runs the due ones, returns a summary.
 *
 * Sequential. Each run is an agent turn — seconds to minutes — and a fleet of them at once would
 * be a lot of simultaneous load at exactly the hour every schedule clusters on, which is 8am.
 */
export async function sweepCheckins(): Promise<{
  considered: number;
  due: number;
  outcomes: Record<string, number>;
}> {
  const db = createAdminClient();
  const { data, error } = await db.from("checkin_schedules").select("*").eq("enabled", true);
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as CheckinScheduleRow[];
  const due = rows.filter((r) => isDue(r));

  const outcomes: Record<string, number> = {};
  for (const row of due) {
    const status = await runCheckin(row);
    outcomes[status] = (outcomes[status] ?? 0) + 1;
  }

  return { considered: rows.length, due: due.length, outcomes };
}
