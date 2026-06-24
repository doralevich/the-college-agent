// The agent provisioned for each student is HERMES (Nous Research), hosted on Agent 37,
// via our custom workspace template `college-agent` — the full Hermes image plus Minions
// Mission Control and a preinstalled Claude Code CLI. The template image + publish/register
// scripts live in ./template (see template/README.md).
//
// Because `college-agent` is a CUSTOM template, it cannot reuse Agent37's reserved ports
// (3737/7681/8080/9119); the image remaps those surfaces to the non-reserved ports below
// and the template declares them (template/register.sh). The signed-url allowlist tracks
// PORTS automatically (app/api/agents/[id]/signed-url/route.ts).
export const DEFAULT_AGENT = {
  template: "college-agent",
  cpu: 2,
  memory: 4,
  disk: 6,
  monthlyCapUsd: 20,
} as const;

export const PORTS = {
  // Remapped, non-reserved ports declared by the `college-agent` template.
  dashboard: 9120, // Hermes dashboard      (stock 9119, reserved)
  terminal: 7682,  // ttyd terminal — where students run `claude` (stock 7681, reserved)
  files: 8081,     // file browser          (stock 8080, reserved)
  minions: 6969,   // Minions Mission Control
} as const;
