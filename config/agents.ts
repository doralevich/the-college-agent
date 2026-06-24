// The agent provisioned for each student is HERMES (Nous Research), hosted on
// Agent 37. (NOT OpenClaw — apolloclaw2's source used OpenClaw.)
//
// TODO(Phase 8 / hermes spike): verify `template` against Agent37 GET /v1/templates
// (a prebuilt Hermes template may exist; otherwise use a base Linux template and
// install Hermes via the install.sh exec step) and confirm the Hermes control/gateway
// PORT. The 9119 value below is from apolloclaw2's own note ("Hermes' 9119"); confirm.
export const DEFAULT_AGENT = {
  template: "agent37-hermes",
  cpu: 2,
  memory: 4,
  disk: 6,
  monthlyCapUsd: 20,
} as const;

export const PORTS = {
  // Hermes serves its control/gateway UI on 9119 (per apolloclaw2's note).
  // terminal/files are the shared Agent37 ports. Verify in Phase 8.
  dashboard: 9119,
  terminal: 7681,
  files: 8080,
} as const;
