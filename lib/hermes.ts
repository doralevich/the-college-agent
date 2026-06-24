import "server-only";
import { agent37 } from "@/lib/agent37";

// Hermes (Nous Research) provisioning, run over the Agent37 `exec` endpoint.
//
// The `agent37-hermes` template ships Hermes pre-installed and pre-wired to Agent37's
// metered model gateway (that's how usage counts against the budget cap), so we do NOT
// touch ~/.hermes/config.yaml's model/provider config. We only:
//   1. write the student's Telegram bot token + numeric user id to ~/.hermes/.env
//   2. write the persona (from the onboarding questionnaire) to ~/.hermes/SOUL.md
//   3. start the messaging gateway (managed service, with a nohup loop fallback)
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

// Build a SOUL.md persona for Hermes from the student's onboarding answers.
export function buildSoul(p: HermesPersonaInput): string {
  const name = (p.agentName || "Hermes").toString().trim();
  const student = [p.firstName, p.lastName].filter(Boolean).join(" ").trim() || "the student";
  const q = p.questionnaire || {};
  const pick = (k: string) => {
    const v = (q as Record<string, unknown>)[k];
    if (v == null) return null;
    return Array.isArray(v) ? v.join(", ") : String(v);
  };
  const tone = pick("tone") || pick("responseStyle") || pick("communicationStyle") || "warm, focused, and direct";
  const priorities = pick("priorities") || pick("topPriority");
  const checkin = pick("checkinFrequency") || pick("checkInFreq");
  const handleFirst = pick("handleFirst");
  const channels = pick("preferredChannel") || pick("channels");

  const lines: string[] = [
    `# ${name}`,
    "",
    `You are **${name}**, a personal AI agent for ${student}` +
      `${p.year ? `, a ${p.year}` : ""}${p.school ? ` at ${p.school}` : ""}${p.major ? ` studying ${p.major}` : ""}.`,
    "",
    "## Your job",
    "Help your student stay on top of school and life — deadlines, planning, email drafting, study scheduling, internship/job search, and weekly check-ins. Be proactive and concrete.",
    "",
    "## How to behave",
    `- Tone: ${tone}.`,
    priorities ? `- Their top priorities right now: ${priorities}.` : null,
    handleFirst ? `- Help with first: ${handleFirst}.` : null,
    checkin ? `- Preferred check-in cadence: ${checkin}.` : null,
    channels ? `- Preferred channels: ${channels}.` : null,
    "- Keep replies actionable. Ask clarifying questions when a request is ambiguous.",
    "",
    "## Context about your student",
    "```json",
    JSON.stringify(q, null, 2).slice(0, 6000),
    "```",
  ].filter((l): l is string => l !== null);

  return lines.join("\n") + "\n";
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

export type ConfigureResult = { ok: boolean; detail: string };

export async function configureHermes(
  agent37Id: string,
  opts: { telegramBotToken: string; telegramUserId: string; soul: string }
): Promise<ConfigureResult> {
  const running = await waitForRunning(agent37Id);
  if (!running) return { ok: false, detail: "instance did not reach running state in time" };

  const envContent = `TELEGRAM_BOT_TOKEN=${opts.telegramBotToken}\nTELEGRAM_ALLOWED_USERS=${opts.telegramUserId}\n`;
  // base64 the file contents so arbitrary characters (persona text, tokens) can't break
  // the shell or inject commands.
  const envB64 = b64(envContent);
  const soulB64 = b64(opts.soul);

  // Single shell script (Agent37 exec runs it in a shell). Best-effort + idempotent.
  const script = [
    `export PATH="$HOME/.local/bin:$PATH"`,
    // install Hermes only if the template didn't ship it
    `command -v hermes >/dev/null 2>&1 || curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash -s -- --non-interactive --skip-setup --skip-browser`,
    `export PATH="$HOME/.local/bin:$PATH"`,
    `mkdir -p "$HOME/.hermes" "$HOME/.hermes/logs"`,
    // merge telegram vars into ~/.hermes/.env without clobbering any model config
    `touch "$HOME/.hermes/.env"`,
    `grep -v '^TELEGRAM_' "$HOME/.hermes/.env" > "$HOME/.hermes/.env.tmp" 2>/dev/null || true`,
    `echo "${envB64}" | base64 -d >> "$HOME/.hermes/.env.tmp"`,
    `mv "$HOME/.hermes/.env.tmp" "$HOME/.hermes/.env" && chmod 600 "$HOME/.hermes/.env"`,
    // persona
    `echo "${soulB64}" | base64 -d > "$HOME/.hermes/SOUL.md"`,
    // The template boots a gateway already (default persona, no Telegram). Stop it so the
    // restarted gateway reloads our new .env (Telegram) + SOUL.md (persona).
    `hermes gateway stop >/dev/null 2>&1 || true`,
    `pkill -f "hermes gateway" >/dev/null 2>&1 || true`,
    `sleep 1`,
    // start the gateway: prefer a managed service; fall back to a nohup run-loop for
    // containers without systemd (these Agent37 boxes run the gateway manually).
    `(hermes gateway install && hermes gateway start) >/dev/null 2>&1 || (nohup sh -c 'while true; do hermes gateway run >> "$HOME/.hermes/logs/gateway.log" 2>&1; sleep 3; done' >/dev/null 2>&1 &)`,
    `sleep 3`,
    `hermes gateway status 2>&1 | head -20 || true`,
    `echo HERMES_CONFIGURED_OK`,
  ].join("\n");

  try {
    const res = await agent37.exec(agent37Id, script);
    const ok = res.exit_code === 0 && res.stdout.includes("HERMES_CONFIGURED_OK");
    return {
      ok,
      detail: ok
        ? "configured"
        : `exec exit=${res.exit_code} stderr=${(res.stderr || "").slice(0, 300)}`,
    };
  } catch (e) {
    return { ok: false, detail: `exec failed: ${(e as Error).message}` };
  }
}
