import "server-only";
import { agent37 } from "@/lib/agent37";

// Hermes (Nous Research) provisioning, run over the Agent37 `exec` endpoint.
//
// The `college-agent` template (built FROM the agent37 full Hermes image) ships Hermes
// pre-installed and pre-wired to Agent37's metered model gateway — config.yaml declares a
// `custom:Agent37` provider (base_url = the metering proxy) as model.provider, which is how
// usage counts against the budget cap. We map the onboarding intake onto the files Hermes
// actually reads, each in its documented slot, then (re)start the gateway:
//   1. Telegram bot token + numeric user id              -> ~/.hermes/.env
//   2. (optional, BYO) ANTHROPIC_API_KEY / OPENAI_API_KEY -> ~/.hermes/.env
//   3. agent identity/voice (name + tone)                -> ~/.hermes/SOUL.md          (system-prompt slot #1)
//   4. durable facts about the student                   -> ~/.hermes/memories/USER.md (user-profile memory)
//   5. proactive check-in cadence                        -> a `hermes cron` job delivered to Telegram
//   6. start the messaging gateway (managed service, with a nohup loop fallback)
//
// BYO model keys (step 2): config.yaml outranks .env, so the key alone is inert. We also
// repoint model.provider/default off the metered gateway (see configureHermes), which moves
// that student's usage onto their own provider bill, off the Agent37 cap. No key => gateway stays.
//
// Anything that can't be automated falls back to an operator finishing it in /admin.

export type HermesPersonaInput = {
  agentName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  school?: string | null;
  year?: string | null;
  major?: string | null;
  questionnaire?: Record<string, unknown> | null;
};

// Read a questionnaire answer as a clean string ("" when absent). Arrays are comma-joined and
// long free-text answers are capped so one textarea can't dominate the file it lands in. The
// keys here are the ACTUAL onboarding form field names (agentTone, topPriority, …) — the older
// builder guessed at keys like `tone`/`handleFirst`/`channels` that the form never emits.
function q(p: HermesPersonaInput, key: string, cap = 280): string {
  const v = p.questionnaire?.[key];
  if (v == null) return "";
  const s = (Array.isArray(v) ? v.filter(Boolean).join(", ") : String(v)).trim();
  return s.length > cap ? s.slice(0, cap).trimEnd() + "…" : s;
}

// SOUL.md is the agent's IDENTITY (slot #1 of the Hermes system prompt). Per the Hermes docs it
// holds durable voice/personality ONLY — tone, style, what to avoid — never facts about the
// student (those go to USER.md) and never a raw questionnaire dump. Keep it to a few lines.
export function buildSoul(p: HermesPersonaInput): string {
  // Student's chosen name wins; otherwise the agent identifies as the brand, never the
  // underlying "Hermes" engine (students shouldn't see that name).
  const name = (p.agentName || "College Agent").toString().trim() || "College Agent";
  const tone = q(p, "agentTone") || "warm, focused, and direct";
  const responseStyle = q(p, "responseStyle");
  const verbosity = /short|direct|bullet/i.test(responseStyle)
    ? "Keep replies short and direct: lead with the action, skip the fluff."
    : /detail|full|context/i.test(responseStyle)
    ? "Give full context and explanation when it helps."
    : "Concise by default; add detail when it genuinely helps.";
  const offLimits = q(p, "agentOffLimits");
  const boundaries = q(p, "wellbeingBoundaries");

  const avoid = [
    "- Sycophancy and hype language.",
    "- Overexplaining the obvious.",
    offLimits ? `- Never bring up: ${offLimits}.` : null,
    boundaries ? `- Respect these boundaries: ${boundaries}.` : null,
  ].filter((l): l is string => l !== null);

  return [
    "# Identity",
    `You are ${name}, a personal AI agent for a college student. You help them stay on top of ` +
      "school and life: deadlines, planning, study scheduling, email drafting, the internship " +
      "and job search, and proactive check-ins. Be proactive and concrete.",
    "",
    "# Style",
    `- Tone: ${tone}.`,
    `- ${verbosity}`,
    "- Ask a clarifying question when a request is ambiguous.",
    "",
    "# Avoid",
    ...avoid,
    "",
    "# Defaults",
    "- When unsure what to surface, lead with upcoming deadlines and the next concrete step.",
    "- Early in your first conversations, ask which tools they already use (Canvas, Gmail, " +
      "Google Calendar, Outlook, Google Drive, Notion, ...) and offer to connect them via the " +
      "dashboard's Integrations tab — one tool at a time, with the concrete next step.",
  ].join("\n") + "\n";
}

// ~/.hermes/memories/USER.md — the durable profile of the STUDENT. This is Hermes' "user profile"
// memory file, auto-injected into every session. Curated FACTS only, entries separated by the `§`
// section sign Hermes' memory format uses, packed most-important-first and capped to the docs'
// ~1,375-char (~500-token) budget (we stop well short so nothing gets truncated mid-fact).
const USER_MD_BUDGET = 1300;
export function buildUserProfile(p: HermesPersonaInput): string {
  const entries: string[] = [];
  const add = (label: string, val: string) => {
    if (val) entries.push(`${label}: ${val}`);
  };
  add("Name", [p.firstName, p.lastName].filter(Boolean).join(" ").trim());
  add("School", (p.school || "").trim());
  add("Year", (p.year || "").trim());
  add("Major", (p.major || "").trim());
  add("Top priority this semester", q(p, "topPriority"));
  add("Wants the agent to handle first", q(p, "agentHandleFirst"));
  add("Academic goal", q(p, "academicGoal"));
  add("Career goal", q(p, "careerGoal"));
  add("Personal goal", q(p, "personalGoal"));
  add("Preferred contact channels", q(p, "preferredChannels"));
  add("Preferred check-in cadence", q(p, "checkinFrequency"));
  add("Wants proactively surfaced", q(p, "agentTopics"));
  add("Other context", q(p, "anythingElse"));

  // Pack entries (most important first) until the budget is hit; drop the rest rather than
  // letting Hermes truncate the file mid-entry.
  const kept: string[] = [];
  let len = 0;
  for (const e of entries) {
    const cost = (kept.length ? 1 : 0) + e.length; // +1 for the § delimiter
    if (len + cost > USER_MD_BUDGET) break;
    kept.push(e);
    len += cost;
  }
  return kept.join("§") + "\n";
}

// Map the student's chosen check-in cadence (the onboarding CHECKIN_FREQ options) to a Hermes
// cron schedule. Hermes accepts cron expressions / intervals but NOT natural language, so any
// on-demand or unmappable cadence returns null — no job is scheduled and the preference simply
// lives in USER.md. NOTE: the schedule fires in the agent box's local timezone, not the student's.
export function mapCheckinToCron(
  checkin: string | null | undefined
): { schedule: string; label: string } | null {
  const c = (checkin || "").toLowerCase();
  if (!c) return null;
  // Highest-frequency wins when several cadences are selected (the form now allows
  // multiple) — students who want "daily morning" AND "weekly digest" still get the
  // daily cron, with the weekly preference living in USER.md as context.
  if (c.includes("multiple")) return { schedule: "0 8,12,17 * * *", label: "thrice-daily" };
  if (c.includes("daily") || c.includes("morning briefing")) return { schedule: "0 8 * * *", label: "daily morning" };
  if (c.includes("twice")) return { schedule: "0 8 * * 1,4", label: "twice-weekly" };
  if (c.includes("weekly")) return { schedule: "0 8 * * 1", label: "weekly" };
  // "Only when I ask" and "Real-time — whenever something comes up" are reactive, not scheduled.
  return null;
}

// A fully self-contained prompt for the scheduled check-in. Cron jobs run in a FRESH, memoryless
// Hermes session that does NOT see USER.md, so the student's context is embedded directly here.
// `[SILENT]` tells Hermes to stay quiet on runs with nothing worth sending.
export function buildCheckinPrompt(p: HermesPersonaInput, label: string): string {
  const who = [p.firstName, p.school ? `at ${p.school}` : null].filter(Boolean).join(" ") || "your student";
  const topics =
    q(p, "agentTopics") || "upcoming deadlines, unanswered emails, schedule conflicts, and study reminders";
  const priority = q(p, "topPriority");
  return [
    `Proactive ${label} check-in for ${who}. You are their personal college agent.`,
    `Review what matters right now: ${topics}${priority ? `, keeping their top priority (${priority}) in mind` : ""}.`,
    "and send a short, friendly, concrete message with the few things to focus on and any deadlines coming up.",
    "Keep it brief and actionable. If there is genuinely nothing worth flagging, reply with only [SILENT].",
  ].join(" ");
}

// Poll Agent37 until the instance reports `running` (exec needs a live box). Bounded.
async function waitForRunning(agent37Id: string, timeoutMs = 60_000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  // NOTE: Date.now() is fine here — this runs in a normal request, not a workflow script.
  while (Date.now() < deadline) {
    try {
      const { data } = await agent37.listAgents();
      const inst = data.find((i) => i.id === agent37Id);
      if (inst?.status === "running") return true;
    } catch {
      /* transient — retry */
    }
    await new Promise((r) => setTimeout(r, 4000));
  }
  return false;
}

const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64");

// Model to pin when a student brings their own provider key. Must be UN-prefixed for a direct
// provider — `hermes doctor` rejects vendor-prefixed slugs like `anthropic/...` (those are for
// aggregators like openrouter). Adjust freely.
const BYO_ANTHROPIC_MODEL = "claude-sonnet-4-6";
const BYO_OPENAI_MODEL = "gpt-5";

export type ConfigureResult = { ok: boolean; detail: string };

export async function configureHermes(
  agent37Id: string,
  opts: {
    telegramBotToken?: string;
    telegramUserId?: string;
    // BYO model keys. When present, Hermes uses the student's own quota for that provider.
    anthropicKey?: string;
    openaiKey?: string;
    soul: string;
    userProfile: string;
    // Recurring check-in -> a `hermes cron` job delivered to Telegram. Only pass this when the
    // student connected Telegram (cron delivery needs a channel) AND the cadence mapped to a
    // real schedule; otherwise omit it and no job is created.
    checkin?: { schedule: string; prompt: string } | null;
  }
): Promise<ConfigureResult> {
  const running = await waitForRunning(agent37Id);
  if (!running) return { ok: false, detail: "instance did not reach running state in time" };

  // Write only the creds provided. We strip+rewrite exactly these keys so re-provision is
  // idempotent and leaves other vars (incl. the gateway model config) untouched.
  const envVars: Array<[string, string]> = [];
  if (opts.telegramBotToken) envVars.push(["TELEGRAM_BOT_TOKEN", opts.telegramBotToken]);
  if (opts.telegramUserId) envVars.push(["TELEGRAM_ALLOWED_USERS", opts.telegramUserId]);
  if (opts.anthropicKey) envVars.push(["ANTHROPIC_API_KEY", opts.anthropicKey]);
  if (opts.openaiKey) envVars.push(["OPENAI_API_KEY", opts.openaiKey]);

  const soulB64 = b64(opts.soul);
  const userB64 = b64(opts.userProfile);
  const checkin = opts.checkin ?? null;
  const cronSchedB64 = checkin ? b64(checkin.schedule) : "";
  const cronPromptB64 = checkin ? b64(checkin.prompt) : "";

  // base64 the file contents so arbitrary characters (persona text, tokens) can't break
  // the shell or inject commands.
  const envBlock = envVars.length
    ? [
        `touch "$HOME/.hermes/.env"`,
        `grep -vE '^(${envVars.map(([k]) => k).join("|")})=' "$HOME/.hermes/.env" > "$HOME/.hermes/.env.tmp" 2>/dev/null || true`,
        `echo "${b64(envVars.map(([k, v]) => `${k}=${v}`).join("\n") + "\n")}" | base64 -d >> "$HOME/.hermes/.env.tmp"`,
        `mv "$HOME/.hermes/.env.tmp" "$HOME/.hermes/.env" && chmod 600 "$HOME/.hermes/.env"`,
      ]
    : [];

  // BYO key wins: repoint off the metered gateway to the standard provider (Anthropic first if
  // both). No key => leave the gateway config untouched.
  const byo = opts.anthropicKey
    ? { provider: "anthropic", model: BYO_ANTHROPIC_MODEL }
    : opts.openaiKey
      ? { provider: "openai", model: BYO_OPENAI_MODEL }
      : null;
  const modelBlock = byo
    ? [
        `hermes config set model.provider ${byo.provider} >/dev/null 2>&1 || echo MODEL_SET_WARN`,
        `hermes config set model.default ${byo.model} >/dev/null 2>&1 || echo MODEL_SET_WARN`,
      ]
    : [];

  // Single shell script (Agent37 exec runs it in a shell). Best-effort + idempotent.
  const script = [
    `export PATH="$HOME/.local/bin:$PATH"`,
    // install Hermes only if the template didn't ship it
    `command -v hermes >/dev/null 2>&1 || curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash -s -- --non-interactive --skip-setup --skip-browser`,
    `export PATH="$HOME/.local/bin:$PATH"`,
    `mkdir -p "$HOME/.hermes" "$HOME/.hermes/logs" "$HOME/.hermes/memories"`,
    // merge provided creds (telegram + BYO model keys) into ~/.hermes/.env
    ...envBlock,
    // identity / voice -> SOUL.md (system-prompt slot #1)
    `echo "${soulB64}" | base64 -d > "$HOME/.hermes/SOUL.md"`,
    // durable student facts -> USER.md (user-profile memory, auto-loaded each session). The Hermes
    // docs disagree on the exact path (~/.hermes/memories/USER.md vs ~/.hermes/USER.md), so write
    // BOTH — at most one is read, so there's no double-injection and the seed lands wherever Hermes
    // looks. The agent may later edit USER.md via its own memory tool; this is the initial seed.
    `echo "${userB64}" | base64 -d > "$HOME/.hermes/memories/USER.md"`,
    `echo "${userB64}" | base64 -d > "$HOME/.hermes/USER.md"`,
    // BYO model override -> config.yaml, before the gateway restart so it gets picked up.
    ...modelBlock,
    // The template boots a gateway already (default persona, no Telegram). Stop it so the
    // restarted gateway reloads our new .env (Telegram + model keys) + SOUL.md + USER.md
    // + any BYO model override.
    `hermes gateway stop >/dev/null 2>&1 || true`,
    `pkill -f "hermes gateway" >/dev/null 2>&1 || true`,
    `sleep 1`,
    // start the gateway: prefer a managed service; fall back to a nohup run-loop for
    // containers without systemd (these Agent37 boxes run the gateway manually).
    `(hermes gateway install && hermes gateway start) >/dev/null 2>&1 || (nohup sh -c 'while true; do hermes gateway run >> "$HOME/.hermes/logs/gateway.log" 2>&1; sleep 3; done' >/dev/null 2>&1 &)`,
    `sleep 3`,
    // proactive check-in -> a recurring cron job delivered to the student's Telegram. Idempotent
    // (drop any prior job of the same name first) and best-effort: a failure logs a marker but
    // never fails provisioning. Schedule + prompt are base64-decoded inline so cadence/persona
    // text can't break the shell. Only emitted when a check-in was mapped (Telegram + cadence).
    ...(checkin
      ? [
          `hermes cron remove "college-checkin" >/dev/null 2>&1 || true`,
          `hermes cron create "$(echo "${cronSchedB64}" | base64 -d)" "$(echo "${cronPromptB64}" | base64 -d)" --name "college-checkin" --deliver telegram >/dev/null 2>&1 || echo CRON_CREATE_WARN`,
        ]
      : []),
    `hermes gateway status 2>&1 | head -20 || true`,
    `echo HERMES_CONFIGURED_OK`,
  ].join("\n");

  try {
    const res = await agent37.exec(agent37Id, script);
    const ok = res.exit_code === 0 && res.stdout.includes("HERMES_CONFIGURED_OK");
    const warns: string[] = [];
    if (res.stdout.includes("MODEL_SET_WARN")) warns.push("BYO model override failed");
    if (res.stdout.includes("CRON_CREATE_WARN")) warns.push("check-in cron failed");
    return {
      ok,
      detail: ok
        ? warns.length
          ? `configured (${warns.join("; ")}, non-fatal)`
          : "configured"
        : `exec exit=${res.exit_code} stderr=${(res.stderr || "").slice(0, 300)}`,
    };
  } catch (e) {
    return { ok: false, detail: `exec failed: ${(e as Error).message}` };
  }
}

// Switch a LIVE box between the metered Agent37 gateway (platform credits) and the
// student's own API key, without touching persona/telegram/cron. A one-time snapshot of
// the template's config.yaml makes the platform restore exact — no guessing the metered
// gateway's provider/model names. Used by Settings -> Usage Credits.
export async function switchModelProvider(
  agent37Id: string,
  target:
    | { provider: "anthropic"; key: string }
    | { provider: "openai"; key: string }
    | { provider: "platform" }
): Promise<ConfigureResult> {
  const running = await waitForRunning(agent37Id);
  if (!running) return { ok: false, detail: "instance did not reach running state in time" };

  const lines: string[] = [
    `export PATH="$HOME/.local/bin:$PATH"`,
    `mkdir -p "$HOME/.hermes" "$HOME/.hermes/logs"`,
    // One-time snapshot of the platform (template) model config; -n never clobbers.
    `cp -n "$HOME/.hermes/config.yaml" "$HOME/.hermes/config.platform.yaml" 2>/dev/null || true`,
  ];

  if (target.provider === "platform") {
    lines.push(
      // Strip BYO keys, restore the exact metered-gateway model config.
      `touch "$HOME/.hermes/.env"`,
      `grep -vE '^(ANTHROPIC_API_KEY|OPENAI_API_KEY)=' "$HOME/.hermes/.env" > "$HOME/.hermes/.env.tmp" 2>/dev/null || true`,
      `mv "$HOME/.hermes/.env.tmp" "$HOME/.hermes/.env" && chmod 600 "$HOME/.hermes/.env"`,
      `[ -f "$HOME/.hermes/config.platform.yaml" ] && cp "$HOME/.hermes/config.platform.yaml" "$HOME/.hermes/config.yaml" || echo RESTORE_WARN`
    );
  } else {
    const envKey = target.provider === "anthropic" ? "ANTHROPIC_API_KEY" : "OPENAI_API_KEY";
    const model = target.provider === "anthropic" ? BYO_ANTHROPIC_MODEL : BYO_OPENAI_MODEL;
    lines.push(
      // Replace BOTH provider keys with just the new one — switching providers must not
      // leave the previous key live. Key is base64'd so it can't break the shell.
      `touch "$HOME/.hermes/.env"`,
      `grep -vE '^(ANTHROPIC_API_KEY|OPENAI_API_KEY)=' "$HOME/.hermes/.env" > "$HOME/.hermes/.env.tmp" 2>/dev/null || true`,
      `echo "${b64(`${envKey}=${target.key}\n`)}" | base64 -d >> "$HOME/.hermes/.env.tmp"`,
      `mv "$HOME/.hermes/.env.tmp" "$HOME/.hermes/.env" && chmod 600 "$HOME/.hermes/.env"`,
      `hermes config set model.provider ${target.provider} >/dev/null 2>&1 || echo MODEL_SET_WARN`,
      `hermes config set model.default ${model} >/dev/null 2>&1 || echo MODEL_SET_WARN`
    );
  }

  lines.push(
    // Restart the gateway so the new .env + model config load (same pattern as provisioning).
    `hermes gateway stop >/dev/null 2>&1 || true`,
    `pkill -f "hermes gateway" >/dev/null 2>&1 || true`,
    `sleep 1`,
    `(hermes gateway install && hermes gateway start) >/dev/null 2>&1 || (nohup sh -c 'while true; do hermes gateway run >> "$HOME/.hermes/logs/gateway.log" 2>&1; sleep 3; done' >/dev/null 2>&1 &)`,
    `sleep 2`,
    `echo HERMES_SWITCHED_OK`
  );

  try {
    const res = await agent37.exec(agent37Id, lines.join("\n"));
    const ok = res.exit_code === 0 && res.stdout.includes("HERMES_SWITCHED_OK");
    const warn = res.stdout.includes("MODEL_SET_WARN") || res.stdout.includes("RESTORE_WARN");
    return {
      ok,
      detail: ok
        ? warn
          ? "switched (model config warning, non-fatal)"
          : "switched"
        : `exec exit=${res.exit_code} stderr=${(res.stderr || "").slice(0, 300)}`,
    };
  } catch (e) {
    return { ok: false, detail: `exec failed: ${(e as Error).message}` };
  }
}
