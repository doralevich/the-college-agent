export const DASHBOARD_TAB_IDS = ["welcome", "chat", "files", "integrations", "shortcuts", "agent", "agents", "billing", "credits", "settings"] as const;

export type DashboardTabId = (typeof DASHBOARD_TAB_IDS)[number];

export function isDashboardTabId(value: string): value is DashboardTabId {
  return (DASHBOARD_TAB_IDS as readonly string[]).includes(value);
}

// The path for a dashboard tab. The Chat tab can carry an open thread id as a third segment
// (/dashboard/chat/<sessionId>) so a refresh, the Back button, and shared links all reopen the
// same conversation; every other tab — and a brand-new unsaved chat — is just /dashboard/<tab>.
export function dashboardPath(tab: DashboardTabId, chatSessionId?: string | null) {
  if (tab === "chat" && chatSessionId) return `/dashboard/chat/${encodeURIComponent(chatSessionId)}`;
  return `/dashboard/${tab}`;
}

// The requested tab (null = none given, fall back to the default) plus the open chat thread id.
export type DashboardRoute = { tab: DashboardTabId | null; chatSessionId: string | null };

// Parse the catch-all segments after /dashboard into a route, or null for shapes that should 404.
// The single grammar shared by the server route guard and the client, so the two can't drift.
export function parseDashboardRoute(segments: string[] | undefined): DashboardRoute | null {
  if (!segments || segments.length === 0) return { tab: null, chatSessionId: null };
  if (segments.length === 1) {
    return isDashboardTabId(segments[0]) ? { tab: segments[0], chatSessionId: null } : null;
  }
  // /dashboard/chat/<sessionId> — the chat tab with a thread open.
  if (segments.length === 2 && segments[0] === "chat") {
    return { tab: "chat", chatSessionId: decodeURIComponent(segments[1]) };
  }
  return null;
}
