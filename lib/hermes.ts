import "server-only";
import { agent37 } from "@/lib/agent37";
import { INTAKE_GROUPS, formatIntakeValue } from "@/lib/intake-schema";

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
  // Public URL of the student's uploaded résumé, if any — surfaced in the full-profile
  // reference file so the agent can fetch/reference it.
  resumeUrl?: string | null;
};

// Where the agent's COMPLETE, un-budgeted background lives on the box. USER.md (below) is the
// tight always-loaded summary; this file holds every intake answer + the résumé link, and the
// agent is told (in SOUL.md) to read it whenever it needs detail beyond memory. Kept off the
// per-session token cost because it's read on demand, not injected into the system prompt.
export const PROFILE_REFERENCE_PATH = "$HOME/.hermes/context/STUDENT_PROFILE.md";
// The human-readable path we show the agent (no shell var).
const PROFILE_REFERENCE_DISPLAY = "~/.hermes/context/STUDENT_PROFILE.md";

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
  // Role branch: faculty/administration/athletics agents identify as a professional
  // assistant for that person's job, not a student companion.
  const role = q(p, "role");
  const staff = !!role && role !== "Student";
  const roleTitle = q(p, "roleTitle");
  const department = q(p, "department");
  const school = (p.school || "").trim();
  const staffIdentity =
    `You are ${name}, a personal AI agent for ${roleTitle || `a member of ${role || "the staff"}`}` +
    `${department ? ` with ${department}` : ""}${school ? ` at ${school}` : ""}. You keep their work ` +
    "moving: calendar and scheduling, travel, communications and email drafting, deadlines and " +
    "compliance dates, meeting prep and follow-ups, and proactive check-ins. Be proactive and concrete.";
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
    staff
      ? staffIdentity
      : `You are ${name}, a personal AI agent for a college student. You help them stay on top of ` +
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
    "",
    "# Background file",
    `- Your always-loaded memory holds the essentials. Their COMPLETE profile from onboarding — every ` +
      `answer, plus their résumé link — is saved at \`${PROFILE_REFERENCE_DISPLAY}\`.`,
    "- Read that file whenever you need detail you don't already have in memory (their exact schedule, " +
      "clubs, wellbeing notes, job-search specifics, résumé, etc.). Prefer it over asking them to repeat " +
      "things they already told us at signup.",
  ].join("\n") + "\n";
}

// Render the student's course schedule into one compact line for USER.md. Prefers the
// structured `classes` array (the class-list onboarding step: {name, days, time, location,
// professor, sku}); falls back to the legacy `currentClasses` text blob. The `sku` is an
// internal identifier and is intentionally omitted. Capped so a long schedule can't swallow
// the whole profile budget. THIS is the field that was silently dropped before — a college
// agent is close to useless without knowing what classes the student is actually taking.
function renderClasses(qn: Record<string, unknown> | null | undefined, cap = 600): string {
  if (!qn) return "";
  let out = "";
  const arr = qn.classes;
  if (Array.isArray(arr)) {
    out = arr
      .map((c) => {
        if (!c || typeof c !== "object") return "";
        const e = c as Record<string, unknown>;
        const name = String(e.name ?? "").trim();
        if (!name) return "";
        const meta = [e.days, e.time, e.location, e.professor]
          .map((s) => String(s ?? "").trim())
          .filter(Boolean)
          .join(", ");
        return meta ? `${name} (${meta})` : name;
      })
      .filter(Boolean)
      .join("; ");
  }
  if (!out) {
    const legacy = qn.currentClasses; // "NAME - days - time - location - professor - sku; ..."
    out = typeof legacy === "string" ? legacy.trim() : "";
  }
  return out.length > cap ? out.slice(0, cap).trimEnd() + "…" : out;
}

// ~/.hermes/memories/USER.md — the durable profile of the STUDENT, auto-injected into every
// session as part of Hermes' always-loaded "Layer 1" (SOUL.md + MEMORY.md + USER.md, ~1.5–5k
// tokens total). Curated FACTS only, entries separated by the `§` section sign Hermes' memory
// format uses, packed most-important-first and capped so nothing truncates mid-fact. This is the
// high-signal SUMMARY the agent always has on hand; the exhaustive profile (every answer +
// résumé) lives in the on-demand reference file (see buildFullProfile / SOUL.md's Background
// section), so we don't pay for rarely-needed detail on every turn. Ordering is deliberate:
// academics + the proactive-care signals a college agent leans on come first.
const USER_MD_BUDGET = 2600;
export function buildUserProfile(p: HermesPersonaInput): string {
  const entries: string[] = [];
  const add = (label: string, val: string) => {
    if (val) entries.push(`${label}: ${val}`);
  };
  add("Name", [p.firstName, p.lastName].filter(Boolean).join(" ").trim());
  add("School", (p.school || "").trim());
  // Staff-flow facts (empty for students, so nothing is added).
  add("Role", q(p, "roleTitle") || (q(p, "role") !== "Student" ? q(p, "role") : ""));
  add("Team / department", q(p, "department"));
  add("Oversees", q(p, "sportsOversee"));
  add("Staff size", q(p, "staffSize"));
  add("Wants handled", q(p, "staffFocus"));
  add("Coordinates with", q(p, "coordinateWith"));
  add("Crunch periods", q(p, "crunchTimes"));
  // --- Academics: the heart of what a college agent needs to be useful (kept high so the
  //     budget never drops them). Classes were previously collected but never rendered here. ---
  add("Year", (p.year || "").trim());
  add("Major", [p.major?.trim(), q(p, "minor") && `minor in ${q(p, "minor")}`].filter(Boolean).join(", "));
  add("Current classes", renderClasses(p.questionnaire));
  add("Learning platform (LMS)", q(p, "lmsType"));
  add("Top priority this semester", q(p, "topPriority"));
  add("Wants the agent to handle first", q(p, "agentHandleFirst"));
  // --- Proactive-care signals: what to watch for and chase down on the student's behalf ---
  add("Biggest stressors", q(p, "biggestStressors"));
  add("Tends to let slip / fall through", q(p, "fallsThrough"));
  add("Stress level", q(p, "stressLevel"));
  add("GPA goal", q(p, "gpaGoal"));
  add("Academic goal", q(p, "academicGoal"));
  add("Academic challenges", q(p, "academicChallenges"));
  add(
    "Study habits",
    [q(p, "studyStyle"), q(p, "studyMethods"), q(p, "studyTime") && `best ${q(p, "studyTime")}`, q(p, "studyLocation")]
      .filter(Boolean)
      .join("; ")
  );
  add("Typical class days", q(p, "classDays"));
  add(
    "Daily rhythm",
    [q(p, "wakeTime") && `up ${q(p, "wakeTime")}`, q(p, "sleepTime") && `sleep ${q(p, "sleepTime")}`, q(p, "productiveTime") && `most productive ${q(p, "productiveTime")}`]
      .filter(Boolean)
      .join(", ")
  );
  add("Work / job", [q(p, "workStatus"), q(p, "weeklyHours") && `${q(p, "weeklyHours")}/wk`].filter(Boolean).join(", "));
  add("Living situation", q(p, "livingSituation"));
  // --- Career context ---
  add("Career goal", q(p, "careerGoal"));
  add("Industry interest", q(p, "industryInterest"));
  add("Dream company", q(p, "dreamCompany"));
  add("Internship / job search", [q(p, "internshipStatus"), q(p, "jobSearchActivities")].filter(Boolean).join("; "));
  add("Graduation year", q(p, "graduationYear"));
  add("LinkedIn", q(p, "linkedin"));
  add("Résumé on file", p.resumeUrl ? "yes — full text in the profile file" : "");
  // --- Working style: the tools they live in + how they like to communicate ---
  add(
    "Tools they use",
    [q(p, "calendarApp") && `calendar ${q(p, "calendarApp")}`, q(p, "taskManager") && `tasks ${q(p, "taskManager")}`, q(p, "noteTaking") && `notes ${q(p, "noteTaking")}`, q(p, "apps")]
      .filter(Boolean)
      .join(", ")
  );
  add("Writing / comm style", q(p, "commStyle"));
  add("Wants to stop", q(p, "stopDoing"));
  add("Wants to start", q(p, "startDoing"));
  // --- Goals & the softer context (dropped first if the budget is tight) ---
  add("Personal goal", q(p, "personalGoal"));
  add("Summer plans", q(p, "summerPlans"));
  add("Plan after college", [q(p, "afterCollege"), q(p, "afterCollegeDetail")].filter(Boolean).join(" — "));
  add("Clubs / orgs", [q(p, "clubs"), q(p, "clubsDetail"), q(p, "leadershipRole")].filter(Boolean).join(" — "));
  add("Fraternity / sorority", [q(p, "greekOrg"), q(p, "greekRole")].filter(Boolean).join(", "));
  add("Preferred contact channels", q(p, "preferredChannels"));
  add("Preferred check-in cadence", q(p, "checkinFrequency"));
  add("Wants proactively surfaced", q(p, "agentTopics"));
  add("Other context", q(p, "anythingElse"));

  // Pack entries (most important first) until the budget is hit; drop the rest rather than
  // letting Hermes truncate the file mid-entry. Anything dropped here still lives in the
  // on-demand reference file, so no answer is ever lost — only deferred.
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

// The COMPLETE onboarding profile, rendered as a readable markdown doc for the on-demand
// reference file (PROFILE_REFERENCE_PATH). Unlike USER.md this is NOT budget-capped and NOT
// injected each session — the agent reads it when it needs detail. Every answered field from
// the shared intake schema is included (empty answers skipped), grouped like the wizard, with
// the class schedule rendered nicely and the résumé link surfaced.
export function buildFullProfile(p: HermesPersonaInput): string {
  const qn = p.questionnaire ?? {};
  const name = [p.firstName, p.lastName].filter(Boolean).join(" ").trim();
  const out: string[] = ["# Student profile", ""];
  if (name) out.push(`**Name:** ${name}`);
  if (p.school) out.push(`**School:** ${p.school}`);
  if (out.length > 2) out.push("");

  for (const group of INTAKE_GROUPS) {
    const lines: string[] = [];
    for (const [key, label] of group.fields) {
      // Render the structured schedule for the classes field; plain value otherwise.
      const value = key === "currentClasses" ? renderClasses(qn, 4000) : formatIntakeValue(qn[key]);
      if (value) lines.push(`- **${label}:** ${value}`);
    }
    if (lines.length) out.push(`## ${group.heading}`, ...lines, "");
  }

  const resumeText = typeof qn.resumeText === "string" ? qn.resumeText.trim() : "";
  if (p.resumeUrl || resumeText) {
    out.push("## Résumé");
    if (p.resumeUrl) out.push(`- File: ${p.resumeUrl}`);
    if (resumeText) out.push("", "Extracted text:", "```", resumeText, "```");
    out.push("");
  }

  return out.join("\n").trimEnd() + "\n";
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
export const MANAGED_DEFAULT_MODEL = "anthropic/claude-sonnet-5";
const MANAGED_PROVIDER = "custom:Agent37";
const BYO_ANTHROPIC_MODEL = "claude-sonnet-5";
const BYO_OPENAI_MODEL = "gpt-5.6-sol";

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
    // The complete, un-budgeted profile written to the on-demand reference file the agent
    // reads for detail beyond USER.md (see buildFullProfile / SOUL.md Background section).
    fullProfile: string;
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
  const fullB64 = b64(opts.fullProfile);
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
  // both). Platform agents are explicitly pinned to the product default instead of inheriting the
  // Agent37 gateway's generic `default` alias.
  const byo = opts.anthropicKey
    ? { provider: "anthropic", model: BYO_ANTHROPIC_MODEL }
    : opts.openaiKey
      ? { provider: "openai", model: BYO_OPENAI_MODEL }
      : { provider: MANAGED_PROVIDER, model: MANAGED_DEFAULT_MODEL };
  const modelBlock = [
    `hermes config set model.provider ${byo.provider} >/dev/null 2>&1 || echo MODEL_SET_WARN`,
    `hermes config set model.default ${byo.model} >/dev/null 2>&1 || echo MODEL_SET_WARN`,
  ];

  // Single shell script (Agent37 exec runs it in a shell). Best-effort + idempotent.
  const script = [
    `export PATH="$HOME/.local/bin:$PATH"`,
    // install Hermes only if the template didn't ship it
    `command -v hermes >/dev/null 2>&1 || curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash -s -- --non-interactive --skip-setup --skip-browser`,
    `export PATH="$HOME/.local/bin:$PATH"`,
    `mkdir -p "$HOME/.hermes" "$HOME/.hermes/logs" "$HOME/.hermes/memories" "$HOME/.hermes/context"`,
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
    // COMPLETE profile + résumé link -> on-demand reference file. Not injected each session;
    // the agent reads it when it needs detail beyond USER.md (SOUL.md points it here).
    `echo "${fullB64}" | base64 -d > "${PROFILE_REFERENCE_PATH}"`,
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
      `[ -f "$HOME/.hermes/config.platform.yaml" ] && cp "$HOME/.hermes/config.platform.yaml" "$HOME/.hermes/config.yaml" || echo RESTORE_WARN`,
      `hermes config set model.provider ${MANAGED_PROVIDER} >/dev/null 2>&1 || echo MODEL_SET_WARN`,
      `hermes config set model.default ${MANAGED_DEFAULT_MODEL} >/dev/null 2>&1 || echo MODEL_SET_WARN`
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
