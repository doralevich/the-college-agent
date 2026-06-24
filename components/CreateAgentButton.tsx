"use client";

import { Plus } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { useAsyncAction } from "@/lib/useAsyncAction";
import { Button, type ButtonProps } from "@/components/ui/button";

// Provisions an agent into a workspace via POST /api/agents (server-side: platform-admin
// only). Reused by the admin god-view's per-workspace "Create Hermes" action — the label
// and size are configurable so the same flow serves both the action button and the row.
export function CreateAgentButton({
  workspaceId,
  onCreated,
  label = "Create agent",
  size,
  variant,
}: {
  workspaceId: string;
  onCreated: () => void;
  label?: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
}) {
  const { busy, run } = useAsyncAction();

  function create() {
    return run(async () => {
      await apiFetch("/api/agents", {
        method: "POST",
        body: JSON.stringify({ workspace_id: workspaceId }),
      });
      toast.success("Agent is provisioning");
      onCreated();
    });
  }

  return (
    <Button onClick={create} disabled={busy} size={size} variant={variant}>
      <Plus className="h-4 w-4" />
      {busy ? "Creating..." : label}
    </Button>
  );
}
