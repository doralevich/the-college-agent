"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, Plug, Plus, Search, Unplug } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { DEFAULT_INTEGRATION_TOOLKITS } from "@/lib/integration-catalog";
import { cn } from "@/lib/utils";
import type {
  IntegrationConnection,
  IntegrationConnectionsResult,
  IntegrationConnectResult,
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
const POLL_MAX_ATTEMPTS = 22; // give up confirming the connection after ~45s

type SubTab = "browse" | "connected";

function connToolkitSlug(c: IntegrationConnection): string {
  return (c.toolkitSlug || "").toLowerCase();
}

function isActive(c: IntegrationConnection): boolean {
  return (c.status || "").toUpperCase() === "ACTIVE";
}

function isToolkitConnected(conns: IntegrationConnection[], slug: string): boolean {
  return conns.some((c) => connToolkitSlug(c) === slug.toLowerCase() && isActive(c));
}

// The Integrations tab: connect third-party apps (Gmail, GitHub, Slack…) to the student's agent.
// Browse searches the catalog (popular apps by default); Connected manages the linked accounts.
// Connecting redirects this tab to the app's OAuth; the connect route sets a callbackUrl that
// returns the student here (?composioConnect=1&toolkit=…), where we confirm the new connection.
export function IntegrationsView({ agentId }: { agentId: string }) {
  const [tab, setTab] = useState<SubTab>("browse");
  const [search, setSearch] = useState("");
  const [toolkits, setToolkits] = useState<IntegrationToolkit[]>([]);
  const [loadingToolkits, setLoadingToolkits] = useState(false);
  const [connections, setConnections] = useState<IntegrationConnection[]>([]);
  const [loadingConns, setLoadingConns] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [finishingToolkit, setFinishingToolkit] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  const fetchConnections = useCallback(async () => {
    const { connections: conns } = await apiFetch<IntegrationConnectionsResult>(
      `/api/agents/${agentId}/integrations/connections`
    );
    setConnections(conns);
    return conns;
  }, [agentId]);

  // Load connections on mount. setState lands only in promise callbacks, so the effect body does
  // no synchronous state update (react-hooks/set-state-in-effect).
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
    };
  }, [agentId]);

  // Return handler: Composio bounces the student back to ?composioConnect=1&toolkit=… after the
  // OAuth. Land on Connected, then poll until the account shows ACTIVE (the finalize can lag the
  // redirect by a beat). The initial tab/finishing switch is deferred to a microtask so it isn't a
  // synchronous in-effect setState; the rest lands in the interval callback.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("composioConnect") !== "1") return;
    const tk = (params.get("toolkit") || "").toLowerCase();
    // Drop the one-shot params so a refresh doesn't replay this.
    window.history.replaceState({}, "", window.location.pathname);
    if (!tk) return;

    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      setTab("connected");
      setFinishingToolkit(tk);
    });

    let attempts = 0;
    const timer = setInterval(async () => {
      attempts += 1;
      try {
        const conns = await fetchConnections();
        if (isToolkitConnected(conns, tk)) {
          clearInterval(timer);
          if (!cancelled) {
            setFinishingToolkit(null);
            toast.success("Connected");
          }
          return;
        }
      } catch {
        // transient; keep polling until the attempt cap
      }
      if (attempts >= POLL_MAX_ATTEMPTS) {
        clearInterval(timer);
        if (!cancelled) setFinishingToolkit(null);
      }
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [fetchConnections]);

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

  async function connect(slug: string) {
    setConnecting(slug);
    try {
      const { redirectUrl } = await apiFetch<IntegrationConnectResult>(
        `/api/agents/${agentId}/integrations/connect`,
        { method: "POST", body: JSON.stringify({ toolkit: slug }) }
      );
      // Same-tab redirect into the app's OAuth — no popup, so nothing to block. The page unloads
      // here; we pick the flow back up via the return handler, so don't clear `connecting`.
      window.location.assign(redirectUrl);
    } catch (e) {
      toast.error((e as Error).message);
      setConnecting(null);
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
  const tooShort = q.length > 0 && q.length < MIN_SEARCH;
  const visibleToolkits = q.length === 0 ? DEFAULT_INTEGRATION_TOOLKITS : toolkits;
  const showLoadingToolkits = q.length >= MIN_SEARCH && loadingToolkits;

  return (
    <div className="max-w-5xl space-y-6">
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

          {tooShort ? (
            <p className="px-1 text-sm text-muted-foreground">Type at least {MIN_SEARCH} characters to search.</p>
          ) : (
            <div className="space-y-2">
              <div className="px-1 text-xs font-medium text-muted-foreground">
                {q.length === 0 ? "Popular integrations" : "Search results"}
              </div>
              {showLoadingToolkits ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-[68px] animate-pulse rounded-xl border bg-muted/40" />
                  ))}
                </div>
              ) : visibleToolkits.length === 0 ? (
                <p className="px-1 py-8 text-center text-sm text-muted-foreground">
                  No apps found for “{q}”.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {visibleToolkits.map((t) => {
                    const connected = isToolkitConnected(connections, t.slug);
                    const busy = connecting === t.slug;
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
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 shrink-0 px-3 text-xs"
                            disabled={busy}
                            onClick={() => connect(t.slug)}
                          >
                            {busy ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              "Connect"
                            )}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {finishingToolkit && (
            <div className="flex items-center gap-2 rounded-xl border bg-secondary/40 px-4 py-3 text-sm">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span>Finishing your {finishingToolkit} connection…</span>
            </div>
          )}
          {loadingConns ? (
            <p className="py-2 text-sm text-muted-foreground">Loading…</p>
          ) : activeConnections.length === 0 ? (
            !finishingToolkit && (
              <div className="rounded-xl border border-dashed px-6 py-12 text-center">
                <Plug className="mx-auto h-6 w-6 text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">No apps connected yet.</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => setTab("browse")}>
                  Browse apps
                </Button>
              </div>
            )
          ) : (
            <div className="overflow-hidden rounded-xl border">
              {activeConnections.map((c, i) => (
                <div
                  key={c.id}
                  className={cn(
                    "flex items-center justify-between gap-3 px-4 py-3 text-sm",
                    i === activeConnections.length - 1 ? "" : "border-b"
                  )}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-medium">
                      {c.toolkitName || c.toolkitSlug || connToolkitSlug(c) || "Unknown app"}
                    </span>
                    {isActive(c) ? (
                      <Badge variant="success">Connected</Badge>
                    ) : (
                      <Badge variant="warning">{c.status || "Pending"}</Badge>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1 px-2 text-xs"
                      disabled={connecting === connToolkitSlug(c)}
                      onClick={() => connect(connToolkitSlug(c))}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add another
                    </Button>
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
              ))}
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
