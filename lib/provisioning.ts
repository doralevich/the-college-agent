import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildSoul, configureHermes } from "@/lib/hermes";

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
      .select("telegram_token, telegram_user_id")
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

// Best-effort: if the user has Telegram credentials, build the persona from their onboarding
// answers and wire up Hermes (Telegram + SOUL.md + gateway). Without Telegram there's nothing
// to connect, so the agent is left bare — and we say so rather than failing. Never throws.
export async function configureAgentFromIntake(
  agent37Id: string,
  onboard: OnboardIntake,
  setup: SetupIntake
): Promise<ConfigureOutcome> {
  if (!setup?.telegram_token || !setup?.telegram_user_id) {
    return { configured: false, detail: "no Telegram credentials on file — agent left unconfigured" };
  }
  const soul = buildSoul({
    agentName: onboard?.agent_name ?? null,
    firstName: onboard?.first_name ?? null,
    lastName: onboard?.last_name ?? null,
    school: onboard?.school ?? null,
    year: onboard?.year ?? null,
    major: onboard?.major ?? null,
    questionnaire: onboard?.questionnaire ?? null,
  });
  try {
    const r = await configureHermes(agent37Id, {
      telegramBotToken: setup.telegram_token,
      telegramUserId: setup.telegram_user_id,
      soul,
    });
    return { configured: r.ok, detail: r.detail };
  } catch (e) {
    return { configured: false, detail: `configure failed: ${(e as Error).message}` };
  }
}
