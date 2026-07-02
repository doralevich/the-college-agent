import type { HostingKey } from "@/lib/pricing";

// The agent provisioned for each student is HERMES (Nous Research), hosted on Agent 37,
// via our custom workspace template `college-agent` — the full Hermes image plus a
// preinstalled Claude Code CLI. The template image + publish/register scripts live in
// ./template (see template/release.sh).
//
// Because `college-agent` is a CUSTOM template, it cannot reuse Agent37's reserved ports
// (3737/7681/8080/9119); the image remaps those surfaces to the non-reserved ports below
// and the template declares them (template/release.sh). The signed-url allowlist tracks
// PORTS automatically (app/api/agents/[id]/signed-url/route.ts).
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
  // Remapped, non-reserved ports declared by the `college-agent` template.
  dashboard: 9120, // Hermes dashboard      (stock 9119, reserved)
  terminal: 7682,  // ttyd terminal — where students run `claude` (stock 7681, reserved)
  files: 8081,     // file browser          (stock 8080, reserved)
} as const;
