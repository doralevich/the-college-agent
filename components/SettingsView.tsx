"use client";

import { useEffect, useState } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { apiFetch } from "@/lib/api";
import { isActiveStatus } from "@/lib/format";
import type { MergedAgent } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export function SettingsView() {
  const { current, refresh, setCurrentId } = useWorkspace();
  const [name, setName] = useState(current?.name ?? "");
  const [syncedId, setSyncedId] = useState(current?.id);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // Whether any agent in this workspace has a live instance up. Deleting the workspace
  // tears its agents down, so we block that while one is active and tell the student to
  // stop/delete it first. Best-effort UI gate — the DELETE route enforces the same rule.
  const [hasActiveAgent, setHasActiveAgent] = useState(false);

  const workspaceId = current?.id;
  useEffect(() => {
    if (!workspaceId) return;
    let cancelled = false;
    apiFetch<{ agents: MergedAgent[] }>(`/api/agents?workspace=${workspaceId}`)
      .then(({ agents }) => {
        if (!cancelled) setHasActiveAgent(agents.some((a) => isActiveStatus(a.live_status)));
      })
      .catch(() => {}); // non-fatal: the API still blocks the delete if an agent is active
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  // Reset the editable field if the active workspace changes — the render-time pattern
  // React recommends over a state-syncing effect.
  if (current && current.id !== syncedId) {
    setSyncedId(current.id);
    setName(current.name);
  }

  if (!current) return <p className="text-sm text-muted-foreground">No workspace selected.</p>;

  const isAdmin = current.role === "admin";

  async function save() {
    if (!current) return;
    setBusy(true);
    try {
      await apiFetch(`/api/workspaces/${current.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: name.trim() }),
      });
      await refresh();
      toast.success("Workspace renamed");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!current) return;
    await apiFetch(`/api/workspaces/${current.id}`, { method: "DELETE" });
    const ws = await refresh();
    setCurrentId(ws[0]?.id ?? "");
    toast.success("Workspace deleted");
    window.location.href = "/dashboard";
  }

  return (
    <div className="max-w-xl space-y-8">
      <div>
        <h2 className="text-lg font-medium">General</h2>
        <p className="mt-1 text-sm text-muted-foreground">{current.name}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ws-name">Workspace name</Label>
        <div className="flex gap-2">
          <Input
            id="ws-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!isAdmin}
          />
          {isAdmin && (
            <Button onClick={save} disabled={busy || !name.trim() || name.trim() === current.name}>
              Save
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Workspace ID</Label>
        <div className="flex gap-2">
          <Input readOnly value={current.id} className="font-mono text-xs" />
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              navigator.clipboard.writeText(current.id);
              toast.success("Copied");
            }}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isAdmin && (
        <div className="rounded-lg border border-destructive/40 p-4">
          <h2 className="text-sm font-medium">Delete workspace</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Permanently deletes this workspace and your agent, and resets your onboarding. To get a
            new agent you&apos;ll fill out the setup forms again.
          </p>
          {hasActiveAgent && (
            <p className="mt-2 text-sm text-destructive">
              Your agent is still active. Stop or delete it first, you can&apos;t delete the
              workspace while it&apos;s running.
            </p>
          )}
          <Button
            variant="destructive"
            className="mt-3"
            disabled={hasActiveAgent}
            onClick={() => setDeleting(true)}
          >
            Delete workspace
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title="Delete workspace?"
        description="This deletes your workspace and your agent, and clears your onboarding answers. You'll need to fill out the setup forms again to create a new agent. This cannot be undone."
        confirmText="Delete workspace"
        destructive
        onConfirm={remove}
      />
    </div>
  );
}

