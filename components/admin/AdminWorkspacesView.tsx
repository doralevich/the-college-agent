"use client";

import { type ReactNode, useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { formatDate, statusVariant, usd } from "@/lib/format";
import type { AdminAgentDetail, AdminWorkspaceSummary } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreateAgentButton } from "@/components/CreateAgentButton";
import { AgentActionsMenu } from "@/components/AgentActionsMenu";
import { AgentNameCell } from "@/components/AgentNameCell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { IntakeDialog } from "@/components/admin/IntakeDialog";

type Detail = { loading: boolean; agents: AdminAgentDetail[] | null };

export function AdminWorkspacesView() {
  const [workspaces, setWorkspaces] = useState<AdminWorkspaceSummary[] | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [details, setDetails] = useState<Record<string, Detail>>({});
  const [editWs, setEditWs] = useState<AdminWorkspaceSummary | null>(null);
  const [deleteWs, setDeleteWs] = useState<AdminWorkspaceSummary | null>(null);

  const loadWorkspaces = useCallback(async () => {
    try {
      const data = await apiFetch<{ workspaces: AdminWorkspaceSummary[] }>("/api/admin/workspaces");
      setWorkspaces(data.workspaces);
      return data.workspaces;
    } catch (e) {
      toast.error((e as Error).message);
      setWorkspaces([]);
      return [];
    }
  }, []);

  const loadDetail = useCallback(async (workspaceId: string) => {
    setDetails((d) => ({ ...d, [workspaceId]: { loading: true, agents: d[workspaceId]?.agents ?? null } }));
    try {
      const data = await apiFetch<{ agents: AdminAgentDetail[] }>(
        `/api/admin/workspaces/${workspaceId}/agents`
      );
      setDetails((d) => ({ ...d, [workspaceId]: { loading: false, agents: data.agents } }));
    } catch (e) {
      toast.error((e as Error).message);
      setDetails((d) => ({ ...d, [workspaceId]: { loading: false, agents: [] } }));
    }
  }, []);

  useEffect(() => {
    // Load the workspace list on mount and leave every row COLLAPSED — the god-view is a
    // fast, scannable list by default. Each row's instances load lazily the first time it's
    // expanded (see toggle), so we never fetch N budget/usage payloads up front. The async
    // IIFE keeps the setState inside loadWorkspaces off the synchronous effect path.
    void (async () => {
      await loadWorkspaces();
    })();
  }, [loadWorkspaces]);

  const toggle = useCallback(
    (workspaceId: string) => {
      setExpanded((prev) => {
        const next = new Set(prev);
        if (next.has(workspaceId)) {
          next.delete(workspaceId);
        } else {
          next.add(workspaceId);
          // Fetch detail the first time a row opens; afterwards we keep the cached rows.
          if (!details[workspaceId]) void loadDetail(workspaceId);
        }
        return next;
      });
    },
    [details, loadDetail]
  );

  // After provisioning into a workspace, refresh the top-level counts and (if open) its
  // instance list so the new agent shows up immediately.
  const onCreated = useCallback(
    (workspaceId: string) => {
      void loadWorkspaces();
      if (expanded.has(workspaceId)) void loadDetail(workspaceId);
    },
    [loadWorkspaces, loadDetail, expanded]
  );

  // After a workspace is deleted, drop its (now-stale) expanded/detail state and refresh
  // the top-level list so the row disappears.
  const onDeleted = useCallback(
    (workspaceId: string) => {
      setExpanded((prev) => {
        const next = new Set(prev);
        next.delete(workspaceId);
        return next;
      });
      setDetails((d) => {
        const next = { ...d };
        delete next[workspaceId];
        return next;
      });
      void loadWorkspaces();
    },
    [loadWorkspaces]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Workspaces</h1>
        <p className="text-sm text-muted-foreground">
          All workspaces across the platform (newest 50). Expand a workspace to see its instances.
        </p>
      </div>

      {workspaces === null ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : workspaces.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">No workspaces yet.</p>
        </div>
      ) : (
        <div className="divide-y overflow-hidden rounded-xl border bg-card shadow-sm">
          {workspaces.map((w) => {
            const isOpen = expanded.has(w.id);
            const detail = details[w.id];
            const noAgent = w.agent_count === 0;
            return (
              <div key={w.id}>
                {/* Compact scan row — the whole row toggles this workspace's instances */}
                <button
                  type="button"
                  onClick={() => toggle(w.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40"
                >
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{w.name}</span>
                      <span
                        className={
                          "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium " +
                          (noAgent ? "bg-muted text-muted-foreground" : "bg-emerald-100 text-emerald-700")
                        }
                      >
                        {noAgent
                          ? "No agent"
                          : `${w.agent_count} agent${w.agent_count > 1 ? "s" : ""} · ${w.running_count} running`}
                      </span>
                    </div>
                    <div className="truncate text-xs text-muted-foreground">{w.owner_email ?? "No owner"}</div>
                  </div>
                  <div className="hidden shrink-0 items-center gap-3 text-xs text-muted-foreground sm:flex">
                    <span>
                      {w.member_count} member{w.member_count === 1 ? "" : "s"}
                    </span>
                    <span>·</span>
                    <span>{formatDate(w.created_at)}</span>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t bg-muted/20 px-4 py-3">
                    {/* Workspace-level actions live in the expanded panel to keep the list scannable */}
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditWs(w)}>
                        <Pencil className="h-4 w-4" />
                        Edit intake
                      </Button>
                      <CreateAgentButton
                        workspaceId={w.id}
                        onCreated={() => onCreated(w.id)}
                        label="Create Agent"
                        size="sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        disabled={w.agent_count > 0}
                        title={w.agent_count > 0 ? "Delete this workspace's instances first" : "Delete workspace"}
                        onClick={() => setDeleteWs(w)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                      <span className="ml-auto select-all font-mono text-[11px] text-muted-foreground">{w.id}</span>
                    </div>
                    <InstanceList detail={detail} onChanged={() => onCreated(w.id)} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <IntakeDialog
        open={!!editWs}
        onOpenChange={(o) => { if (!o) setEditWs(null); }}
        workspaceId={editWs?.id ?? null}
        ownerEmail={editWs?.owner_email ?? null}
        onSaved={() => { if (editWs) onCreated(editWs.id); }}
      />

      <ConfirmDialog
        open={!!deleteWs}
        onOpenChange={(o) => { if (!o) setDeleteWs(null); }}
        title="Delete workspace?"
        description={
          deleteWs
            ? `Permanently delete "${deleteWs.name}" (${deleteWs.owner_email ?? "no owner"}) and its memberships. This cannot be undone.`
            : undefined
        }
        confirmText="Delete"
        destructive
        onConfirm={async () => {
          if (!deleteWs) return;
          const id = deleteWs.id;
          await apiFetch(`/api/admin/workspaces/${id}`, { method: "DELETE" });
          toast.success("Workspace deleted");
          onDeleted(id);
        }}
      />
    </div>
  );
}

// Instances render as stacked cards (not a wide table): each instance's facts reflow with
// the container and never force the horizontal scroll the old table did.
function InstanceList({ detail, onChanged }: { detail: Detail | undefined; onChanged: () => void }) {
  if (!detail || detail.loading) {
    return <p className="py-2 text-xs text-muted-foreground">Loading instances…</p>;
  }
  if (!detail.agents || detail.agents.length === 0) {
    return <p className="py-2 text-xs text-muted-foreground">No instances in this workspace.</p>;
  }

  return (
    <div className="space-y-2.5">
      {detail.agents.map((a) => (
        <div key={a.agent37_id} className="rounded-lg border bg-background p-3">
          {/* Header: name + live status + id, with the actions menu pinned right */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <AgentNameCell agent={a} canEdit onRenamed={onChanged} />
                <Badge variant={statusVariant(a.live_status)}>{a.live_status ?? "unknown"}</Badge>
                {a.past_due && <Badge variant="warning">past due</Badge>}
                <span className="font-mono text-[11px] text-muted-foreground">{a.agent37_id}</span>
              </div>
              {a.status_reason && (
                <div className="mt-1 max-w-md truncate text-[11px] text-destructive" title={a.status_reason.message}>
                  {a.status_reason.message}
                </div>
              )}
            </div>
            <AgentActionsMenu agent={a} role="admin" onChanged={onChanged} />
          </div>

          {/* Facts wrap freely — no fixed columns, no horizontal scroll */}
          <div className="mt-3 flex flex-wrap gap-x-8 gap-y-3">
            <Field label="Template">{a.template ?? "-"}</Field>
            <Field label="Resources">
              {a.cpu} vCPU · {a.memory} GB · {a.disk} GB
            </Field>
            <Field label="Budget · spent / cap">
              {a.budget ? `${usd(a.budget.monthly_consumed_micros)} / ${usd(a.budget.monthly_cap_micros)}` : "-"}
            </Field>
            {/* Real spendable money: one-time credit headroom (starter grant + top-ups); the
                monthly cap above deliberately ignores it. This is the student's "Balance". */}
            <Field label="Credits balance">
              <span className="font-semibold">{a.budget ? usd(a.budget.credit_remaining_micros) : "-"}</span>
            </Field>
            <Field label="Created">{formatDate(a.created_at)}</Field>
          </div>

          <div className="mt-3 border-t pt-3">
            <UsageBreakdown usage={a.usage} />
          </div>
        </div>
      ))}
    </div>
  );
}

// One labeled fact. The uppercase micro-label + value stacks read as a scannable spec sheet
// and wrap without the column-alignment the old table needed.
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm tabular-nums text-foreground">{children}</div>
    </div>
  );
}

// Period usage for one instance: the total plus the per-integration breakdown (cost + call
// count for LLM, Search, Tools), laid out inline so it never adds table width.
function UsageBreakdown({ usage }: { usage: AdminAgentDetail["usage"] }) {
  if (!usage) return <div className="text-xs text-muted-foreground">No usage this period.</div>;
  const { llm, brave, composio } = usage.by_integration;
  const rows = [
    { label: "LLM", cost: llm.cost_micros, calls: llm.calls },
    { label: "Search", cost: brave.cost_micros, calls: brave.calls },
    { label: "Tools", cost: composio.cost_micros, calls: composio.calls },
  ];
  return (
    <div>
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        Usage · {usage.period}
      </div>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="text-sm font-semibold tabular-nums text-foreground">{usd(usage.total_micros)}</span>
        {rows.map((r) => (
          <span key={r.label} className="text-xs text-muted-foreground tabular-nums">
            {r.label} {usd(r.cost)} · {r.calls} calls
          </span>
        ))}
      </div>
    </div>
  );
}
