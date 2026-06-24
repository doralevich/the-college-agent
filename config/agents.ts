import type { HostingKey } from "@/lib/pricing";

// The agent provisioned for each student is HERMES (Nous Research), hosted on Agent 37,
// via our custom workspace template `college-agent` — the full Hermes image plus Minions
// Mission Control and a preinstalled Claude Code CLI. The template image + publish/register
// scripts live in ./template (see template/README.md).
//
// Because `college-agent` is a CUSTOM template, it cannot reuse Agent37's reserved ports
// (3737/7681/8080/9119); the image remaps those surfaces to the non-reserved ports below
// and the template declares them (template/register.sh). The signed-url allowlist tracks
// PORTS automatically (app/api/agents/[id]/signed-url/route.ts).
// Machine shape is driven by the student's HOSTING plan (lib/pricing). Basic is the floor
// (4 vCPU / 8 GB / 20 GB); Pro doubles it across the board (8 vCPU / 16 GB / 40 GB). Both the
// student auto-provision path (app/api/provision) and the admin path (app/api/agents) resolve
// the shape from the purchased plan via shapeForHosting(), so they stay in sync.
export type AgentShape = { cpu: number; memory: number; disk: number };

// The 4/8 shape requires disk 20–40 GB (smaller 400s the create). 20 is the floor; the
// larger 8/16 Pro shape gets 40 GB (still within the supported range for that machine).
export const HOSTING_SHAPES: Record<HostingKey, AgentShape> = {
  basic: { cpu: 4, memory: 8, disk: 20 },
  pro: { cpu: 8, memory: 16, disk: 40 },
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
  monthlyCapUsd: 20,
} as const;

export const PORTS = {
  // Remapped, non-reserved ports declared by the `college-agent` template.
  dashboard: 9120, // Hermes dashboard      (stock 9119, reserved)
  terminal: 7682,  // ttyd terminal — where students run `claude` (stock 7681, reserved)
  files: 8081,     // file browser          (stock 8080, reserved)
  minions: 6969,   // Minions Mission Control
} as const;
