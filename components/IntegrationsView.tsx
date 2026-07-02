"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ExternalLink, Loader2, Plug, Plus, Search, Star, Unplug } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import {
  DEFAULT_INTEGRATION_TOOLKITS,
  FAVORITE_INTEGRATION_SLUGS,
  INTEGRATION_CATEGORIES,
} from "@/lib/integration-catalog";
import { cn } from "@/lib/utils";
import type {
  IntegrationConnection,
  IntegrationConnectionsResult,
  IntegrationToolkit,
  IntegrationToolkitsResult,
} from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SEARCH_DEBOUNCE_MS = 250;
const MIN_SEARCH = 3; // the v1 toolkits route 400s a non-empty query shorter than this
const BROWSE_LIMIT = 24; // the v1 route clamps to 24; ask for a full page so Browse feels real
const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 22; // give up polling for the connect to land after ~45s

type SubTab = "browse" | "connected";

function toolkitKey(slug: string): string {
  return slug.toLowerCase();
}

function connectRedirectHref(agentId: string, slug: string): string {
  return `/api/agents/${encodeURIComponent(agentId)}/integrations/connect/redirect?toolkit=${encodeURIComponent(slug)}`;
}

function connToolkitSlug(c: IntegrationConnection): string {
  return (c.toolkitSlug || "").toLowerCase();
}

function isActive(c: IntegrationConnection): boolean {
  return (c.status || "").toUpperCase() === "ACTIVE";
}

function isToolkitConnected(conns: IntegrationConnection[], slug: string): boolean {
  return conns.some((c) => connToolkitSlug(c) === slug.toLowerCase() && isActive(c));
}

// Case/underscore/space-insensitive match against a toolkit's name, slug, or description,
// so "one drive", "onedrive", and "OneDrive" all find the one_drive toolkit.
function matchesQuery(t: IntegrationToolkit, q: string): boolean {
  const needle = q.toLowerCase().replace(/[\s_]+/g, "");
  return (
    t.name.toLowerCase().replace(/[\s_]+/g, "").includes(needle) ||
    t.slug.toLowerCase().replace(/[\s_]+/g, "").includes(needle) ||
    (t.description ?? "").toLowerCase().replace(/[\s_]+/g, "").includes(needle)
  );
}

// The pinned Favorites row, in FAVORITE_INTEGRATION_SLUGS order. Favorites also appear in
// their category below (like an app store's featured shelf) — the row is quick access,
// the categories are the organized catalog.
const FAVORITE_TOOLKITS: IntegrationToolkit[] = FAVORITE_INTEGRATION_SLUGS.map((slug) =>
  DEFAULT_INTEGRATION_TOOLKITS.find((t) => toolkitKey(t.slug) === toolkitKey(slug))
).filter((t): t is IntegrationToolkit => !!t);

// The Integrations tab: connect third-party apps (Gmail, GitHub, Slack…) to the student's agent.
// Browse searches the catalog (popular apps by default); Connected manages the linked accounts.
// Connecting opens a same-origin redirect route in a new tab; that route starts OAuth server-side.
export function IntegrationsView({ agentId }: { agentId: string }) {
  const [tab, setTab] = useState<SubTab>("browse");
  const [search, setSearch] = useState("");
  const [toolkits, setToolkits] = useState<IntegrationToolkit[]>([]);
  const [loadingToolkits, setLoadingToolkits] = useState(false);
  const [connections, setConnections] = useState<IntegrationConnection[]>([]);
  const [loadingConns, setLoadingConns] = useState(true);
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  // "Show more apps": pages through the full remote catalog (popularity-ranked) below the
  // curated categories. Fetched on demand, deduped against everything already on screen;
  // the button hides once the upstream cursor is exhausted (or a page adds nothing new).
  const [extraApps, setExtraApps] = useState<IntegrationToolkit[]>([]);
  const [extraCursor, setExtraCursor] = useState<string | null>(null);
  const [extraLoaded, setExtraLoaded] = useState(false);
  const [loadingExtra, setLoadingExtra] = useState(false);

  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchConnections = useCallback(async () => {
    const { connections: conns } = await apiFetch<IntegrationConnectionsResult>(
      `/api/agents/${agentId}/integrations/connections`
    );
    setConnections(conns);
    return conns;
  }, [agentId]);

  const stopPolling = useCallback(() => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
    setPendingSlug(null);
  }, []);

  // Load connections on mount; stop any poll on unmount (the tab unmounts on switch away). Every
  // setState lands in a promise callback, so the effect body does no synchronous state update.
  useEffect(() => {
    let cancelled = false;
    apiFetch<IntegrationConnectionsResult>(`/api/agents/${agentId}/integrations/connections`)
      .then((res) => {
        if (!cancelled) setConnections(res.connections);
      })
      .catch((e) => toast.error((e as Error).message))
      .finally(() => {
        if (!cancelled) setLoadingConns(false);
      });
    return () => {
      cancelled = true;
      stopPolling();
    };
  }, [agentId, stopPolling]);

  // Debounced live search. Empty query uses the static default catalog above so Browse does not
  // wait on Agent37/Composio; a query of 3+ chars searches live; 1-2 chars wait (the server 400s).
  useEffect(() => {
    const q = search.trim();
    if (q.length < MIN_SEARCH) return;
    let cancelled = false;

    const handle = setTimeout(() => {
      setLoadingToolkits(true);
      const qs = `?search=${encodeURIComponent(q)}&limit=${BROWSE_LIMIT}`;
      apiFetch<IntegrationToolkitsResult>(`/api/agents/${agentId}/integrations/toolkits${qs}`)
        .then((res) => {
          if (!cancelled) setToolkits(res.items);
        })
        .catch((e) => {
          if (!cancelled) toast.error((e as Error).message);
        })
        .finally(() => {
          if (!cancelled) setLoadingToolkits(false);
        });
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [search, agentId]);

  // Called from the connect handler (not render): poll connections until the toolkit shows ACTIVE
  // or we give up after POLL_MAX_ATTEMPTS. Stored lowercased so the per-card pending check matches
  // even if the catalog returns a mixed-case slug.
  function startPolling(slug: string) {
    setPendingSlug(toolkitKey(slug));
    let attempts = 0;
    if (pollTimer.current) clearInterval(pollTimer.current);
    pollTimer.current = setInterval(async () => {
      attempts += 1;
      try {
        const conns = await fetchConnections();
        if (isToolkitConnected(conns, slug)) {
          stopPolling();
          toast.success("Connected");
          return;
        }
      } catch {
        // transient; keep polling until the attempt cap
      }
      if (attempts >= POLL_MAX_ATTEMPTS) stopPolling();
    }, POLL_INTERVAL_MS);
  }

  async function loadMoreApps() {
    setLoadingExtra(true);
    try {
      const params = new URLSearchParams({ limit: String(BROWSE_LIMIT) });
      if (extraCursor) params.set("cursor", extraCursor);
      const res = await apiFetch<IntegrationToolkitsResult>(
        `/api/agents/${agentId}/integrations/toolkits?${params}`
      );
      const seen = new Set(
        [...DEFAULT_INTEGRATION_TOOLKITS, ...extraApps].map((t) => toolkitKey(t.slug))
      );
      const fresh = res.items.filter((t) => !seen.has(toolkitKey(t.slug)));
      setExtraApps((prev) => [...prev, ...fresh]);
      // Stop offering "load more" when the catalog is exhausted, or when paging isn't
      // actually advancing (a whole page of already-seen apps).
      setExtraCursor(res.items.length > 0 && fresh.length > 0 ? (res.nextCursor ?? null) : null);
      setExtraLoaded(true);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoadingExtra(false);
    }
  }

  async function disconnect(connectedAccountId: string) {
    setDisconnecting(connectedAccountId);
    try {
      await apiFetch(`/api/agents/${agentId}/integrations/connections/${connectedAccountId}`, {
        method: "DELETE",
      });
      toast.success("Disconnected");
      await fetchConnections();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setDisconnecting(null);
    }
  }

  const activeConnections = connections.filter((c) => !c.isDisabled);
  const q = search.trim();

  // Filtering is instant and local over the curated catalog from the first character; a 3+ char
  // query ALSO searches the full remote catalog (1,000+ apps) and appends whatever the curated
  // list doesn't already show once the live results land.
  const localMatches = useMemo(
    () => (q ? DEFAULT_INTEGRATION_TOOLKITS.filter((t) => matchesQuery(t, q)) : []),
    [q]
  );
  const remoteExtras = useMemo(() => {
    if (q.length < MIN_SEARCH || loadingToolkits) return [];
    const shown = new Set(localMatches.map((t) => toolkitKey(t.slug)));
    return toolkits.filter((t) => !shown.has(toolkitKey(t.slug)));
  }, [q, localMatches, toolkits, loadingToolkits]);
  const searchResults = [...localMatches, ...remoteExtras];
  const searchingRemote = q.length >= MIN_SEARCH && loadingToolkits;

  // One card, used by the Favorites row, the All-apps grid, and search results.
  const renderCard = (t: IntegrationToolkit) => {
    const connected = isToolkitConnected(connections, t.slug);
    const key = toolkitKey(t.slug);
    const isPending = pendingSlug === key;
    return (
      <div
        key={t.slug}
        className="flex items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-secondary/40"
      >
        <ToolkitLogo logo={t.logo} name={t.name} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{t.name}</div>
          {t.description && (
            <div className="truncate text-xs text-muted-foreground">{t.description}</div>
          )}
        </div>
        {connected ? (
          <Badge variant="success" className="shrink-0 gap-1">
            <Check className="h-3 w-3" />
            Added
          </Badge>
        ) : isPending ? (
          <Button size="sm" variant="outline" className="h-8 shrink-0 px-3 text-xs" disabled>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Waiting
          </Button>
        ) : (
          <Button asChild size="sm" variant="outline" className="h-8 shrink-0 px-3 text-xs">
            <a
              href={connectRedirectHref(agentId, t.slug)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => startPolling(t.slug)}
            >
              Connect
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Integrations</h1>
          <div className="inline-flex rounded-lg border bg-card p-0.5 text-sm">
            <SubTabButton active={tab === "browse"} onClick={() => setTab("browse")}>
              Browse
            </SubTabButton>
            <SubTabButton active={tab === "connected"} onClick={() => setTab("connected")}>
              Connected
              {activeConnections.length > 0 && (
                <span className="ml-1.5 text-xs text-muted-foreground">{activeConnections.length}</span>
              )}
            </SubTabButton>
          </div>
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Integrations connect your agent to the apps you already use. Once an app is connected,
          your agent can work in it for you: check Canvas deadlines, draft Gmail replies, add
          events to your calendar, or pull a file from Drive when you ask.
        </p>
      </div>

      {tab === "browse" ? (
        <div className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search 1,000+ apps (e.g. github, gmail, calendar)"
              className="h-11 pl-9"
            />
          </div>

          {q.length === 0 ? (
            <div className="space-y-6">
              <p className="rounded-lg border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
                Connecting takes about 30 seconds: click Connect, sign in to the app in the tab
                that opens, and you&apos;re done. Your agent can then use that app on your behalf.
                Disconnect any app anytime from the Connected tab.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 px-1 text-xs font-medium text-muted-foreground">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  Favorites
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {FAVORITE_TOOLKITS.map(renderCard)}
                </div>
              </div>
              {INTEGRATION_CATEGORIES.map((cat) => (
                <div key={cat.title} className="space-y-2">
                  <div className="px-1 text-xs font-medium text-muted-foreground">{cat.title}</div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {cat.toolkits.map(renderCard)}
                  </div>
                </div>
              ))}
              <div className="space-y-2">
                {extraApps.length > 0 && (
                  <>
                    <div className="px-1 text-xs font-medium text-muted-foreground">
                      More from the app store
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {extraApps.map(renderCard)}
                    </div>
                  </>
                )}
                {!extraLoaded || extraCursor ? (
                  <Button variant="outline" className="w-full" disabled={loadingExtra} onClick={loadMoreApps}>
                    {loadingExtra ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    {extraLoaded ? "Load more apps" : "Show more apps"}
                  </Button>
                ) : (
                  <p className="px-1 pt-1 text-center text-xs text-muted-foreground">
                    That&apos;s everything we can list here. Search above to find any of 1,000+ apps.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="px-1 text-xs font-medium text-muted-foreground">Search results</div>
              {searchResults.length === 0 && !searchingRemote ? (
                <p className="px-1 py-8 text-center text-sm text-muted-foreground">
                  No apps found for “{q}”.
                  {q.length < MIN_SEARCH && " Keep typing to search the full catalog."}
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {searchResults.map(renderCard)}
                </div>
              )}
              {searchingRemote && (
                <p className="flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Searching the full catalog…
                </p>
              )}
            </div>
          )}

          {pendingSlug && (
            <p className="px-1 text-xs text-muted-foreground">
              Waiting for you to finish connecting in the other tab…
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {loadingConns ? (
            <p className="py-2 text-sm text-muted-foreground">Loading…</p>
          ) : activeConnections.length === 0 ? (
            <div className="rounded-xl border border-dashed px-6 py-12 text-center">
              <Plug className="mx-auto h-6 w-6 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">No apps connected yet.</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setTab("browse")}>
                Browse apps
              </Button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border">
              {activeConnections.map((c, i) => {
                const slug = connToolkitSlug(c);
                const key = toolkitKey(slug);
                const isPending = pendingSlug === key;

                return (
                  <div
                    key={c.id}
                    className={cn(
                      "flex items-center justify-between gap-3 px-4 py-3 text-sm",
                      i === activeConnections.length - 1 ? "" : "border-b"
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate font-medium">
                        {c.toolkitName || c.toolkitSlug || slug || "Unknown app"}
                      </span>
                      {isActive(c) ? (
                        <Badge variant="success">Connected</Badge>
                      ) : (
                        <Badge variant="warning">{c.status || "Pending"}</Badge>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {isPending ? (
                        <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 text-xs" disabled>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Waiting
                        </Button>
                      ) : (
                        <>
                          {slug ? (
                            <Button asChild variant="ghost" size="sm" className="h-8 gap-1 px-2 text-xs">
                              <a
                                href={connectRedirectHref(agentId, slug)}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => startPolling(slug)}
                              >
                                <Plus className="h-3.5 w-3.5" />
                                Add another
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 text-xs" disabled>
                              <Plus className="h-3.5 w-3.5" />
                              Add another
                            </Button>
                          )}
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 px-2 text-xs text-destructive hover:text-destructive"
                        disabled={disconnecting === c.id}
                        onClick={() => disconnect(c.id)}
                      >
                        {disconnecting === c.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Unplug className="h-3.5 w-3.5" />
                        )}
                        Disconnect
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SubTabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-md px-3 py-1.5 font-medium transition-colors",
        active ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function ToolkitLogo({ logo, name }: { logo: string | null; name: string }) {
  if (logo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logo} alt="" loading="lazy" decoding="async" className="h-8 w-8 shrink-0 rounded-md object-contain" />;
  }
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
