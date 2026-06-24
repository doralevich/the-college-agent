import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildSoul,
  buildUserProfile,
  buildCheckinPrompt,
  mapCheckinToCron,
  configureHermes,
  type HermesPersonaInput,
} from "@/lib/hermes";

type DB = ReturnType<typeof createAdminClient>;

// The slice of a student's intake that actually drives provisioning: the persona fields
// (-> SOUL.md) and the Telegram credentials (-> gateway). Both paths — the student's own
// "Create my agent" and an admin's "Create Hermes" — read these and configure the agent
// the same way, so the two stay in sync.
export type OnboardIntake = {
  first_name: string | null;
  last_name: string | null;
  school: string | null;
  year: string | null;
  major: string | null;
  agent_name: string | null;
  questionnaire: Record<string, unknown> | null;
} | null;

export type SetupIntake = {
  telegram_token: string | null;
  telegram_user_id: string | null;
  // Optional BYO model keys (-> the agent's ~/.hermes/.env).
  anthropic_key: string | null;
  openai_key: string | null;
} | null;

// Read a user's current intake (one row per user; we still order+limit defensively).
export async function readProvisioningIntake(
  db: DB,
  userId: string
): Promise<{ onboard: OnboardIntake; setup: SetupIntake }> {
  const [onboardRes, setupRes] = await Promise.all([
    db
      .from("onboard_submissions")
      .select("first_name, last_name, school, year, major, agent_name, questionnaire")
      .eq("user_id", userId)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    db
      .from("setup_submissions")
      .select("telegram_token, telegram_user_id, anthropic_key, openai_key")
      .eq("user_id", userId)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  return {
    onboard: (onboardRes.data as OnboardIntake) ?? null,
    setup: (setupRes.data as SetupIntake) ?? null,
  };
}

export type ConfigureOutcome = { configured: boolean; detail: string };

// Best-effort, never throws: with any credential on file (Telegram and/or a BYO model key),
// build the persona and wire up Hermes; with nothing to connect, leave the agent bare.
export async function configureAgentFromIntake(
  agent37Id: string,
  onboard: OnboardIntake,
  setup: SetupIntake
): Promise<ConfigureOutcome> {
  const hasTelegram = !!(setup?.telegram_token && setup?.telegram_user_id);
  const hasModelKey = !!(setup?.anthropic_key || setup?.openai_key);
  if (!hasTelegram && !hasModelKey) {
    return { configured: false, detail: "no credentials on file — agent left unconfigured" };
  }

  // Split the intake across the files Hermes reads: identity -> SOUL.md, durable student
  // facts -> USER.md, check-in cadence -> a cron job. (See lib/hermes.ts for each mapping.)
  const persona: HermesPersonaInput = {
    agentName: onboard?.agent_name ?? null,
    firstName: onboard?.first_name ?? null,
    lastName: onboard?.last_name ?? null,
    school: onboard?.school ?? null,
    year: onboard?.year ?? null,
    major: onboard?.major ?? null,
    questionnaire: onboard?.questionnaire ?? null,
  };
  const soul = buildSoul(persona);
  const userProfile = buildUserProfile(persona);

  // A scheduled check-in only makes sense when Telegram is connected (it's the delivery
  // channel) and the chosen cadence maps to a real cron schedule; otherwise we skip it and
  // the cadence still lives in USER.md as a fact.
  const cadence = (persona.questionnaire?.checkinFrequency as string | undefined) ?? null;
  const cron = hasTelegram ? mapCheckinToCron(cadence) : null;
  const checkin = cron ? { schedule: cron.schedule, prompt: buildCheckinPrompt(persona, cron.label) } : null;

  try {
    const r = await configureHermes(agent37Id, {
      telegramBotToken: setup?.telegram_token ?? undefined,
      telegramUserId: setup?.telegram_user_id ?? undefined,
      anthropicKey: setup?.anthropic_key ?? undefined,
      openaiKey: setup?.openai_key ?? undefined,
      soul,
      userProfile,
      checkin,
    });
    return { configured: r.ok, detail: r.detail };
  } catch (e) {
    return { configured: false, detail: `configure failed: ${(e as Error).message}` };
  }
}
