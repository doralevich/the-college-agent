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

export const DEFAULT_AGENT = {
  template: "college-agent",
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
