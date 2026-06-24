"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { OnboardSummary, TelegramSummary } from "@/lib/types";

export function SettingsView({
  onboardSummary,
  telegramSummary,
}: {
  onboardSummary: OnboardSummary | null;
  telegramSummary: TelegramSummary | null;
}) {
  const { current, refresh, setCurrentId } = useWorkspace();
  const [name, setName] = useState(current?.name ?? "");
  const [syncedId, setSyncedId] = useState(current?.id);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const fullName = [onboardSummary?.first_name, onboardSummary?.last_name]
    .filter(Boolean)
    .join(" ");
  const telegramHandle = telegramSummary?.telegram_username
    ? `@${telegramSummary.telegram_username.replace(/^@/, "")}`
    : null;

  return (
    <div className="max-w-xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">{current.name}</p>
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

      <section className="space-y-3 rounded-lg border p-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-medium">Your details</h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/onboard">Update onboarding</Link>
          </Button>
        </div>
        {onboardSummary ? (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
            <Field label="Name" value={fullName} />
            <Field label="Agent name" value={onboardSummary.agent_name} />
            <Field label="School" value={onboardSummary.school} />
            <Field label="Year" value={onboardSummary.year} />
            <Field label="Major" value={onboardSummary.major} />
            <Field label="School email" value={onboardSummary.school_email} />
            <Field label="Personal email" value={onboardSummary.personal_email} />
            <Field label="Phone" value={onboardSummary.phone} />
            <div className="space-y-0.5">
              <dt className="text-xs text-muted-foreground">Resume</dt>
              <dd className="text-sm">
                {onboardSummary.resume_url ? (
                  <a
                    href={onboardSummary.resume_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline-offset-2 hover:underline"
                  >
                    View resume
                  </a>
                ) : (
                  <span className="text-muted-foreground">Not uploaded</span>
                )}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">No onboarding details on file yet.</p>
        )}
      </section>

      <section className="space-y-3 rounded-lg border p-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-medium">Telegram connection</h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/setup">Reconnect Telegram</Link>
          </Button>
        </div>
        {telegramSummary?.telegram_user_id ? (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
            <Field label="Username" value={telegramHandle} />
            <Field label="User ID" value={telegramSummary.telegram_user_id} mono />
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">Telegram isn&apos;t connected yet.</p>
        )}
      </section>

      {isAdmin && (
        <div className="rounded-lg border border-destructive/40 p-4">
          <h2 className="text-sm font-medium">Delete workspace</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Permanently deletes this workspace and your agent, and resets your onboarding. To get a
            new agent you&apos;ll fill out the setup forms again.
          </p>
          <Button variant="destructive" className="mt-3" onClick={() => setDeleting(true)}>
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

function Field({ label, value, mono }: { label: string; value: string | null; mono?: boolean }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={mono ? "font-mono text-xs" : "text-sm"}>
        {value ? value : <span className="text-muted-foreground">—</span>}
      </dd>
    </div>
  );
}
