import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptSecret } from "@/lib/crypto/byo";
import {
  buildSoul,
  buildUserProfile,
  buildFullProfile,
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
  resume_url: string | null;
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
      .select("first_name, last_name, school, year, major, agent_name, questionnaire, resume_url")
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

// Best-effort, never throws. Always builds the persona (SOUL.md / USER.md) from the
// student's onboarding so the agent is never "blank" — the platform's metered gateway
// keeps the agent able to talk to an LLM without a BYO key. Telegram + BYO model keys
// layer on top when they exist, and the proactive check-in only runs when Telegram is
// connected (it's the delivery channel).
export async function configureAgentFromIntake(
  agent37Id: string,
  onboard: OnboardIntake,
  setup: SetupIntake
): Promise<ConfigureOutcome> {
  const hasTelegram = !!(setup?.telegram_token && setup?.telegram_user_id);

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
    resumeUrl: onboard?.resume_url ?? null,
  };
  const soul = buildSoul(persona);
  const userProfile = buildUserProfile(persona);
  const fullProfile = buildFullProfile(persona);

  // A scheduled check-in only makes sense when Telegram is connected (it's the delivery
  // channel) and the chosen cadence maps to a real cron schedule; otherwise we skip it and
  // the cadence still lives in USER.md as a fact.
  // checkinFrequency may now be either a single string (legacy single-pick) or an array
  // (the multi-pick form). Join arrays so mapCheckinToCron's substring match still works.
  const rawCadence = persona.questionnaire?.checkinFrequency;
  const cadence = Array.isArray(rawCadence)
    ? rawCadence.filter(Boolean).join(", ")
    : (rawCadence as string | undefined) ?? null;
  const cron = hasTelegram ? mapCheckinToCron(cadence) : null;
  const checkin = cron ? { schedule: cron.schedule, prompt: buildCheckinPrompt(persona, cron.label) } : null;

  try {
    const r = await configureHermes(agent37Id, {
      telegramBotToken: setup?.telegram_token ?? undefined,
      telegramUserId: setup?.telegram_user_id ?? undefined,
      // Stored encrypted at rest; decrypt back to the raw sk-... before it reaches the box.
      // decryptSecret passes legacy plaintext through unchanged during the migration window.
      anthropicKey: decryptSecret(setup?.anthropic_key) ?? undefined,
      openaiKey: decryptSecret(setup?.openai_key) ?? undefined,
      soul,
      userProfile,
      fullProfile,
      checkin,
    });
    return { configured: r.ok, detail: r.detail };
  } catch (e) {
    return { configured: false, detail: `configure failed: ${(e as Error).message}` };
  }
}

// Resolve the Agent37 instance id for a user's (single) agent: user -> workspace -> agents row.
async function findAgent37IdForUser(db: DB, userId: string): Promise<string | null> {
  const { data: ms } = await db.from("memberships").select("workspace_id").eq("user_id", userId).limit(1);
  const workspaceId = ms?.[0]?.workspace_id as string | undefined;
  if (!workspaceId) return null;
  const { data: agentRows } = await db
    .from("agents")
    .select("agent37_id")
    .eq("workspace_id", workspaceId)
    .limit(1);
  return (agentRows?.[0]?.agent37_id as string | undefined) ?? null;
}

// Push a student's LATEST intake to their ALREADY-provisioned agent. This is what makes an
// intake edit actually reach the brain: initial provisioning early-returns once an agent
// exists, so without this the live agent kept its first-provision SOUL.md/USER.md forever
// (e.g. classes added after signup never showed up). No-op (skipped) when the student has no
// agent yet — the normal /api/provision path does the first-time config. Best-effort; never
// throws. Meant to be run AFTER the intake row is saved (ideally via `after()` so the form
// response isn't blocked by the box's reconfigure, which waits for the instance + exec).
export async function reconfigureExistingAgentForUser(
  db: DB,
  userId: string
): Promise<{ reconfigured: boolean; detail: string }> {
  try {
    const agent37Id = await findAgent37IdForUser(db, userId);
    if (!agent37Id) return { reconfigured: false, detail: "no agent yet — nothing to reconfigure" };
    const { onboard, setup } = await readProvisioningIntake(db, userId);
    if (!onboard) return { reconfigured: false, detail: "no onboard intake" };
    const r = await configureAgentFromIntake(agent37Id, onboard, setup);
    return { reconfigured: r.configured, detail: r.detail };
  } catch (e) {
    return { reconfigured: false, detail: `reconfigure failed: ${(e as Error).message}` };
  }
}
