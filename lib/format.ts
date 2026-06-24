export function usd(micros: number): string {
  return `$${(micros / 1_000_000).toFixed(2)}`;
}

export function usdToMicros(usdValue: number): number {
  return Math.round(usdValue * 1_000_000);
}

export type StatusVariant = "success" | "warning" | "destructive" | "muted";

export function statusVariant(status?: string | null): StatusVariant {
  switch (status) {
    case "running":
      return "success";
    case "provisioning":
    case "starting":
    case "restarting":
    case "updating":
      return "warning";
    case "failed":
    case "error":
      return "destructive";
    default:
      return "muted";
  }
}

export function isTransitional(status?: string | null): boolean {
  return ["provisioning", "starting", "restarting", "updating", "deleting"].includes(status || "");
}

// An agent whose Agent37 instance is up or moving toward up — running, or any transitional
// lifecycle state. Used to block destructive workspace ops that would pull a live instance
// out from under the student. A stopped/failed/absent box does NOT count as active.
export function isActiveStatus(status?: string | null): boolean {
  return status === "running" || isTransitional(status);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString();
}
