"use client";

import { useState } from "react";
import {
  ArrowDownToLine,
  Copy,
  FolderOpen,
  KanbanSquare,
  LayoutDashboard,
  MoreHorizontal,
  Play,
  RotateCw,
  Square,
  Terminal,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { isTransitional } from "@/lib/format";
import { useAsyncAction } from "@/lib/useAsyncAction";
import { PORTS } from "@/config/agents";
import type { MergedAgent, Role } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ConfirmDialog } from "@/components/ConfirmDialog";

// The "open a port in a new tab" quick actions — identical button, varying port/icon/label.
const PORT_ACTIONS = [
  { port: PORTS.dashboard, Icon: LayoutDashboard, label: "Open the dashboard", aria: "Open dashboard" },
  { port: PORTS.minions, Icon: KanbanSquare, label: "Open Minions", aria: "Open Minions mission control" },
  { port: PORTS.files, Icon: FolderOpen, label: "Open file browser", aria: "Open file browser" },
  { port: PORTS.terminal, Icon: Terminal, label: "Open terminal", aria: "Open terminal" },
] as const;

export function AgentActionsMenu({
  agent,
  role,
  onChanged,
  confirmDeleteDescription = "This permanently deletes the agent and its data. This cannot be undone.",
}: {
  agent: MergedAgent;
  role: Role;
  onChanged: () => void;
  // Copy for the delete confirmation. Defaults to the operator-grade wording; the
  // student view overrides it to explain the re-onboarding flow.
  confirmDeleteDescription?: string;
}) {
  const isAdmin = role === "admin";
  const running = agent.live_status === "running";
  const transitional = isTransitional(agent.live_status);

  const [deleting, setDeleting] = useState(false);
  const [opening, setOpening] = useState<number | null>(null);
  const { busy, run } = useAsyncAction();

  function action(path: string, msg: string) {
    return run(async () => {
      await apiFetch(`/api/agents/${agent.agent37_id}/${path}`, { method: "POST" });
      toast.success(msg);
      onChanged();
    });
  }

  function signedUrl(port: number) {
    return apiFetch<{ url: string }>(`/api/agents/${agent.agent37_id}/signed-url`, {
      method: "POST",
      body: JSON.stringify({ port }),
    }).then((r) => r.url);
  }

  async function openPort(port: number) {
    setOpening(port);
    try {
      window.open(await signedUrl(port), "_blank", "noopener");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setOpening(null);
    }
  }

  async function copyDashboardUrl() {
    const toastId = toast.loading("Preparing dashboard URL…");
    try {
      // Same signed URL the "Open the dashboard" action uses.
      await navigator.clipboard.writeText(await signedUrl(PORTS.dashboard));
      toast.success("Dashboard URL copied to clipboard", { id: toastId });
    } catch (e) {
      toast.error((e as Error).message, { id: toastId });
    }
  }

  async function remove() {
    await apiFetch(`/api/agents/${agent.agent37_id}`, { method: "DELETE" });
    toast.success("Agent deleted");
    onChanged();
  }

  return (
    <>
      <TooltipProvider delayDuration={200}>
      <div className="flex items-center justify-center gap-2">
        {PORT_ACTIONS.map(({ port, Icon, label, aria }) => (
          <Tooltip key={port}>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
                disabled={!running || opening === port}
                onClick={() => openPort(port)}
                aria-label={aria}
              >
                <Icon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        ))}

        {isAdmin && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
                disabled={!running || busy}
                onClick={() => action("restart", "Restarting")}
                aria-label="Restart this agent"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Restart this agent</TooltipContent>
          </Tooltip>
        )}

        {isAdmin && agent.update_available && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full border-amber-400 text-amber-500 hover:bg-amber-50 hover:text-amber-600"
                disabled={transitional || busy}
                onClick={() => action("update", "Updating")}
                aria-label="Update agent (update available)"
              >
                <ArrowDownToLine className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Update available — roll to the latest image</TooltipContent>
          </Tooltip>
        )}

        {isAdmin && (
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    disabled={busy}
                    aria-label="More actions"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>More actions</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="min-w-[12rem]">
              <DropdownMenuItem disabled={!running} onClick={copyDashboardUrl}>
                <Copy />
                Copy dashboard URL
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {running ? (
                <DropdownMenuItem onClick={() => action("stop", "Stopping")}>
                  <Square />
                  Stop agent
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => action("start", "Starting")}>
                  <Play />
                  Start agent
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setDeleting(true)}>
                <Trash2 />
                Delete agent
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      </TooltipProvider>

      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title="Delete agent?"
        description={confirmDeleteDescription}
        confirmText="Delete"
        destructive
        onConfirm={remove}
      />
    </>
  );
}
