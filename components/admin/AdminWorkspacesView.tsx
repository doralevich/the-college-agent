"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
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
    // Initial fetch on mount. Pre-expand every row and load its instances up front so the
    // god-view shows all instances without manual clicks (rows can still be collapsed).
    // setState happens after the await (async), not synchronously in the effect body, so it
    // doesn't cause the cascading renders the rule guards against.
    void (async () => {
      const ws = await loadWorkspaces();
      setExpanded(new Set(ws.map((w) => w.id)));
      ws.forEach((w) => void loadDetail(w.id));
    })();
  }, [loadWorkspaces, loadDetail]);

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
          All workspaces across the platform (newest 50). Instances are shown inline; collapse a row to hide them.
        </p>
      </div>

      {workspaces === null ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : workspaces.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">No workspaces yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Workspace</th>
                <th className="px-4 py-2 font-medium">Owner</th>
                <th className="px-4 py-2 font-medium">Members</th>
                <th className="px-4 py-2 font-medium">Agents</th>
                <th className="px-4 py-2 font-medium">Created</th>
                <th className="px-4 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {workspaces.map((w) => {
                const isOpen = expanded.has(w.id);
                const detail = details[w.id];
                return (
                  <Fragment key={w.id}>
                    <tr className="border-t [&>td]:align-middle">
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggle(w.id)}
                          className="flex items-center gap-2 text-left font-medium hover:text-primary"
                          aria-expanded={isOpen}
                        >
                          {isOpen ? (
                            <ChevronDown className="h-4 w-4 shrink-0" />
                          ) : (
                            <ChevronRight className="h-4 w-4 shrink-0" />
                          )}
                          <span className="truncate">{w.name}</span>
                        </button>
                        <div className="pl-6 font-mono text-xs text-muted-foreground">{w.id}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{w.owner_email ?? "-"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{w.member_count}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {w.agent_count === 0 ? (
                          "0"
                        ) : (
                          <span>
                            {w.agent_count}
                            <span className="text-xs"> ({w.running_count} running)</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(w.created_at)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => setEditWs(w)}>
                            <Pencil className="h-4 w-4" />
                            Edit intake
                          </Button>
                          <CreateAgentButton
                            workspaceId={w.id}
                            onCreated={() => onCreated(w.id)}
                            label="Create Hermes"
                            size="sm"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            disabled={w.agent_count > 0}
                            title={
                              w.agent_count > 0
                                ? "Delete this workspace's instances first"
                                : "Delete workspace"
                            }
                            onClick={() => setDeleteWs(w)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>

                    {isOpen && (
                      <tr className="border-t bg-muted/30">
                        <td colSpan={6} className="px-4 py-3">
                          <InstanceList detail={detail} onChanged={() => onCreated(w.id)} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
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

function InstanceList({ detail, onChanged }: { detail: Detail | undefined; onChanged: () => void }) {
  if (!detail || detail.loading) {
    return <p className="px-2 py-2 text-xs text-muted-foreground">Loading instances...</p>;
  }
  if (!detail.agents || detail.agents.length === 0) {
    return <p className="px-2 py-2 text-xs text-muted-foreground">No instances in this workspace.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border bg-background">
      <table className="w-full text-xs">
        <thead className="bg-muted/50 text-left text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Instance</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Template</th>
            <th className="px-3 py-2 font-medium">Resources</th>
            <th className="px-3 py-2 font-medium">Budget (spent / cap)</th>
            <th className="px-3 py-2 font-medium">Usage (period)</th>
            <th className="px-3 py-2 font-medium">Created</th>
            <th className="px-3 py-2 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {detail.agents.map((a) => (
            <tr key={a.agent37_id} className="border-t [&>td]:align-middle">
              <td className="px-3 py-2">
                <AgentNameCell agent={a} canEdit onRenamed={onChanged} />
              </td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-1">
                  <Badge variant={statusVariant(a.live_status)}>{a.live_status ?? "unknown"}</Badge>
                  {a.past_due && <Badge variant="warning">past due</Badge>}
                </div>
                {a.status_reason && (
                  <div
                    className="mt-1 max-w-[16rem] truncate text-[11px] text-destructive"
                    title={a.status_reason.message}
                  >
                    {a.status_reason.message}
                  </div>
                )}
              </td>
              <td className="px-3 py-2 text-muted-foreground">{a.template ?? "-"}</td>
              <td className="px-3 py-2 text-muted-foreground">
                {a.cpu} vCPU · {a.memory} GB · {a.disk} GB
              </td>
              <td className="px-3 py-2 text-muted-foreground">
                {a.budget
                  ? `${usd(a.budget.monthly_consumed_micros)} / ${usd(a.budget.monthly_cap_micros)}`
                  : "-"}
              </td>
              <td className="px-3 py-2 text-muted-foreground">
                <UsageCell usage={a.usage} />
              </td>
              <td className="px-3 py-2 text-muted-foreground">{formatDate(a.created_at)}</td>
              <td className="px-3 py-2">
                <AgentActionsMenu agent={a} role="admin" onChanged={onChanged} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Period usage for one instance: the total, plus the per-integration breakdown (cost + call
// count for LLM, Search, Tools). The breakdown is already in the agent37 getUsage payload, so
// rendering it costs nothing extra.
function UsageCell({ usage }: { usage: AdminAgentDetail["usage"] }) {
  if (!usage) return <>-</>;
  const { llm, brave, composio } = usage.by_integration;
  const rows = [
    { label: "LLM", cost: llm.cost_micros, calls: llm.calls },
    { label: "Search", cost: brave.cost_micros, calls: brave.calls },
    { label: "Tools", cost: composio.cost_micros, calls: composio.calls },
  ];
  return (
    <div className="space-y-1">
      <div className="text-foreground">
        {usd(usage.total_micros)} <span className="text-[11px] text-muted-foreground">({usage.period})</span>
      </div>
      <div className="space-y-0.5 text-[11px]">
        {rows.map((r) => (
          <div key={r.label} className="flex gap-1.5">
            <span className="w-12 shrink-0">{r.label}</span>
            <span className="tabular-nums">{usd(r.cost)}</span>
            <span className="text-muted-foreground tabular-nums">· {r.calls} calls</span>
          </div>
        ))}
      </div>
    </div>
  );
}
