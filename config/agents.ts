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
// Machine shape is driven by the student's HOSTING plan (lib/pricing). Each tier is what
// students see on /build, and what the provisioner actually requests — both the student
// auto-provision path (app/api/provision) and the admin path (app/api/agents) resolve the
// shape from the purchased plan via shapeForHosting(), so they stay in sync.
export type AgentShape = { cpu: number; memory: number; disk: number };

export const HOSTING_SHAPES: Record<HostingKey, AgentShape> = {
  basic: { cpu: 1, memory: 4, disk: 12 },
  plus:  { cpu: 2, memory: 6, disk: 20 },
  pro:   { cpu: 4, memory: 8, disk: 30 },
  max:   { cpu: 6, memory: 12, disk: 50 },
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
} as const;
