import type { HostingKey } from "@/lib/pricing";

// The agent provisioned for each student is HERMES (Nous Research), hosted on Agent 37,
// via our custom workspace template `college-agent` — the full Hermes image plus a
// preinstalled Claude Code CLI. The template image + publish/register scripts live in
// ./template (see template/release.sh).
//
// The image runs stock Hermes — gateway on 3737, and its surfaces on the ports below.
// (Earlier builds remapped these off Agent37's reserved range because custom templates
// couldn't touch it; that restriction is gone — every container port is reachable at
// {id}-{port}.agent37.app — so the template declares nothing and the ports are stock.)
// The app opens the surfaces via signed URLs, which mint for any port; the allowlist below
// is the guard (app/api/agents/[id]/signed-url/route.ts). See template/release.sh.
// Machine shape is driven by the student's HOSTING plan (lib/pricing). Agent37 only
// accepts three exact (cpu, memory) combos right now — 2/4, 4/8, 8/16 — with disk
// bands of 6-20, 20-40, 40-80 GB respectively. We always meet-or-beat what the /build
// marketing page advertises:
//   Basic   marketed 1 vCPU / 4 GB → provisioned 2 vCPU / 4 GB  (more CPU)
//   Plus    marketed 2 vCPU / 6 GB → provisioned 4 vCPU / 8 GB  (more CPU + RAM)
//   Pro     marketed 4 vCPU / 8 GB → provisioned 4 vCPU / 8 GB  (matches)
//   Max     marketed 6 vCPU / 12 GB → provisioned 8 vCPU / 16 GB (more CPU + RAM)
// Both the student auto-provision path (app/api/provision) and the admin path
// (app/api/agents) resolve the shape via shapeForHosting(), so they stay in sync.
export type AgentShape = { cpu: number; memory: number; disk: number };

export const HOSTING_SHAPES: Record<HostingKey, AgentShape> = {
  basic: { cpu: 2, memory: 4,  disk: 12 },
  plus:  { cpu: 4, memory: 8,  disk: 20 },
  pro:   { cpu: 4, memory: 8,  disk: 30 },
  max:   { cpu: 8, memory: 16, disk: 50 },
};

// Resolve the machine shape for a hosting plan key (the DB stores it as plain text on the
// order). Falls back to the Basic floor for null/unknown values so provisioning never throws.
export function shapeForHosting(hosting: string | null | undefined): AgentShape {
  return (hosting && HOSTING_SHAPES[hosting as HostingKey]) || HOSTING_SHAPES.basic;
}

// Which app provisioned an instance. The College Agent and Apollo share ONE Agent37
// account, so `listAgents()` returns both apps' instances to whichever app asks. Without
// this stamp an app cannot tell "an instance of mine whose database row went missing" from
// "an instance that simply belongs to the other app", and Apollo's admin reported every
// College Agent box as an orphan of its own.
//
// Stamped into instance metadata at create (the only two places that call createAgent).
// Deliberately NOT the template name: Agent37 registers the Apollo image under
// "college-agent" too while it is renamed to "apollo-agent", so the template cannot tell
// the two apps apart. Instances created before this stamp existed carry no `app` key, and
// Agent37 exposes no way to set metadata on an existing instance - each app still
// recognises its own legacy boxes through its `agents` table, and anything neither app
// claims is reported as unattributed rather than guessed at.
export const APP_ID = "college-agent" as const;

export const DEFAULT_AGENT = {
  // THE APOLLO BUILD. David's call: one template across every product he sells, rather than the
  // College Agent being the last thing still on its own Hermes image.
  //
  // The switch was only possible once nothing about the product lived in the image any more:
  //   * persona files are written to whichever workspace the box's runtime reads (lib/hermes.ts)
  //   * check-ins are scheduled by this app, not by `hermes cron` (lib/checkin-schedules.ts)
  //   * Telegram is a webhook we own, not a bot token polled from inside the box (lib/channels)
  // Each of those was a silent failure waiting to happen on a non-Hermes box - a write that
  // succeeds into a directory nothing reads, a cron that does not exist, a bot nobody answers.
  // Reverting is this one line, and affects only agents built after it.
  //
  // EXISTING STUDENTS ARE NOT MIGRATED. Agent37 fixes an instance's template at create time, so
  // everyone provisioned before this stays on `college-agent` (Hermes) until their box is
  // rebuilt. The fleet is deliberately mixed, which is why ports are resolved per-template
  // (portsForTemplate below) rather than read from one global map.
  template: "agent37-openclaw",
  // Former names for the same build, tried in order when the one above isn't in the Agent37
  // registry. Renaming a template is two systems moving at different times - this repo and the
  // Agent37 account - and a student who pays during that gap must still get an agent.
  templateAliases: ["apollo-agent", "college-agent"],
  // Basic shape — the default/floor when no plan is known (e.g. admin box with no order).
  ...HOSTING_SHAPES.basic,
  // A small recurring allowance so an agent is never completely bricked between top-ups.
  // Real spending power comes from CREDITS: the one-time starter grant below plus the
  // top-ups students buy in Settings -> Billing. (Was 20 when every box ran on a free
  // recurring platform allowance; the credits model replaces that.)
  monthlyCapUsd: 1,
  // One-time AI credits included with the plan, granted when the agent is provisioned.
  starterCreditsUsd: 20,
} as const;

export const PORTS = {
  // Stock Hermes surface ports. Opened via signed URLs; reachable at {id}-{port}.agent37.app.
  dashboard: 9119, // Hermes dashboard
  terminal: 7681,  // ttyd terminal — where students run `claude`
  files: 8080,     // file browser
} as const;

export type PortName = keyof typeof PORTS;

// OpenClaw serves its Control UI on its own gateway port; the terminal and file browser sit on
// the same numbers under both runtimes.
const OPENCLAW_PORTS: Record<PortName, number> = { dashboard: 18789, terminal: 7681, files: 8080 };

// Which ports each template actually serves.
//
// This has to be per-template rather than global because the fleet is MIXED: students
// provisioned before the switch are on Hermes boxes serving 9119, and everyone after is on the
// Apollo build serving 18789. Getting it wrong is silent — the signed URL mints fine and the tab
// simply never loads — which is exactly the dead "Open dashboard" button ApolloClaw spent an
// afternoon on before it mapped these properly.
const TEMPLATE_PORTS: Record<string, Record<PortName, number>> = {
  "college-agent": { ...PORTS },
  // Both names of the Apollo build. `apollo-agent` is a Hermes image (per ApolloClaw's own
  // TEMPLATE_RUNTIMES); `agent37-openclaw` is the stock OpenClaw one.
  "apollo-agent": { ...PORTS },
  "agent37-openclaw": OPENCLAW_PORTS,
};

/**
 * The ports this agent's template serves.
 *
 * Falls back to the Hermes set for an unknown or missing template, which is what every instance
 * this app provisioned before the switch runs — a wrong guess there fails the same way it always
 * did rather than newly breaking an existing student.
 */
export function portsForTemplate(template: string | null | undefined): Record<PortName, number> {
  return { ...((template ? TEMPLATE_PORTS[template] : undefined) ?? PORTS) };
}

/** Every port number openable on any template — the server-side allowlist. */
export function allOpenablePorts(): number[] {
  return [...new Set(Object.values(TEMPLATE_PORTS).flatMap((p) => Object.values(p)))];
}
