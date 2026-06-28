export const DASHBOARD_TAB_IDS = ["chat", "files", "integrations", "agent", "agents", "billing", "settings"] as const;

export type DashboardTabId = (typeof DASHBOARD_TAB_IDS)[number];

export function isDashboardTabId(value: string): value is DashboardTabId {
  return (DASHBOARD_TAB_IDS as readonly string[]).includes(value);
}

export function dashboardPath(tab: DashboardTabId) {
  return `/dashboard/${tab}`;
}
