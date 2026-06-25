"use client";

import { useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  Copy,
  FolderOpen,
  Loader2,
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

// Minions Mission Control is where students actually work with the agent (chat / tasks),
// so it's promoted to the primary "Open" CTA below instead of living in the row of
// equal-weight icon buttons. That gives every agent one obvious thing to click.
const PRIMARY_PORT = PORTS.minions;

// The remaining "open a port in a new tab" surfaces — secondary, shown as icon buttons.
// The Hermes dashboard is intentionally NOT exposed here: it's Hermes-branded and we don't
// want students seeing it. Admins can still grab its URL via "Copy dashboard URL" below.
const PORT_ACTIONS = [
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
      <div className="flex items-center justify-end gap-2">
        {/* Primary CTA — the one obvious thing to click. Opens Minions Mission Control. */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              className="h-8 gap-1.5 px-3.5"
              disabled={!running || opening === PRIMARY_PORT}
              onClick={() => openPort(PRIMARY_PORT)}
              aria-label="Open Minions"
            >
              {opening === PRIMARY_PORT ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Open
              {opening === PRIMARY_PORT ? null : <ArrowRight className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {running ? "Open Minions to chat with your agent" : "Start the agent to open it"}
          </TooltipContent>
        </Tooltip>

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

        {isAdmin && <div className="mx-0.5 h-5 w-px bg-border" aria-hidden />}

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
            <TooltipContent>Update available: roll to the latest image</TooltipContent>
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
