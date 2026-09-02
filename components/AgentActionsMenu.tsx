"use client";

import { useState } from "react";
import {
  ArrowDownToLine,
  Copy,
  FolderOpen,
  LayoutDashboard,
  MessageSquare,
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
import { portsForTemplate } from "@/config/agents";
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

// The "open a port in a new tab" surfaces students see — shown as icon buttons. The Hermes
// dashboard is intentionally NOT in this list: it's Hermes-branded and we don't want students
// seeing it. Admins get it from ADMIN_PORT_ACTIONS below, and "Copy dashboard URL" in the
// overflow menu still hands out the same signed URL.
const PORT_ACTIONS = [
  { name: "files", Icon: FolderOpen, label: "Open file browser", aria: "Open file browser" },
  { name: "terminal", Icon: Terminal, label: "Open terminal", aria: "Open terminal" },
] as const;

// Admin-only. The dashboard stays out of the list above on purpose - it is Hermes-branded and
// students should not be sent to it - but an operator supporting a student had no way in at all
// except copying the URL from the overflow menu and pasting it into a tab. Same signed URL, one
// click, and only for platform admins, so the student-facing surface is unchanged.
const ADMIN_PORT_ACTIONS = [
  {
    name: "dashboard",
    Icon: LayoutDashboard,
    label: "Open agent dashboard (admin)",
    aria: "Open agent dashboard",
  },
] as const;

export function AgentActionsMenu({
  agent,
  role,
  onChanged,
  onChat,
  confirmDeleteDescription = "This permanently deletes the agent and its data. This cannot be undone.",
  reonboardOnDelete = false,
}: {
  agent: MergedAgent;
  role: Role;
  onChanged: () => void;
  // When provided (student dashboard only), renders the primary "Chat" CTA that opens the
  // in-app Chat tab. Omitted in the admin cross-tenant view, which has no in-app chat.
  onChat?: () => void;
  // Copy for the delete confirmation. Defaults to the operator-grade wording; the
  // student view overrides it to explain the re-onboarding flow.
  confirmDeleteDescription?: string;
  // Self-service ("Your Agent") delete: also clear the student's onboarding intake so
  // they redo it before a new agent can be built. Distinguishes the student deleting
  // their OWN agent from an operator deleting one in the /admin god-view (where the
  // current user is the operator, not the agent's owner, so intake must be preserved).
  reonboardOnDelete?: boolean;
}) {
  const isAdmin = role === "admin";
  // Operators additionally get the dashboard button; students keep the two surfaces above.
  const portActions = isAdmin ? [...PORT_ACTIONS, ...ADMIN_PORT_ACTIONS] : PORT_ACTIONS;
  // Port NUMBERS come from this agent's own template, because the fleet is mixed: the dashboard
  // is 9119 on a Hermes box and 18789 on the Apollo build, and a hardcoded number would open a
  // tab that silently never loads for half of them.
  const ports = portsForTemplate(agent.template);
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
    // Open the tab SYNCHRONOUSLY inside the click. Awaiting the signed URL first means the
    // browser no longer counts this as user-initiated, so it silently blocks the popup —
    // window.open() returns null, throws nothing and shows no toast, and the button just
    // appears dead. Same idiom BillingView already uses for the Stripe portal.
    const tab = window.open("", "_blank");
    if (tab) tab.opener = null; // preserve the noopener guarantee the direct call had
    try {
      const url = await signedUrl(port);
      if (tab) tab.location.href = url;
      else window.location.assign(url); // popup blocked anyway → fall back to this tab
    } catch (e) {
      tab?.close();
      toast.error((e as Error).message);
    } finally {
      setOpening(null);
    }
  }

  async function copyDashboardUrl() {
    const toastId = toast.loading("Preparing dashboard URL…");
    try {
      // Same signed URL the "Open the dashboard" action uses.
      await navigator.clipboard.writeText(await signedUrl(ports.dashboard));
      toast.success("Dashboard URL copied to clipboard", { id: toastId });
    } catch (e) {
      toast.error((e as Error).message, { id: toastId });
    }
  }

  async function remove() {
    const qs = reonboardOnDelete ? "?reonboard=1" : "";
    await apiFetch(`/api/agents/${agent.agent37_id}${qs}`, { method: "DELETE" });
    toast.success("Agent deleted");
    onChanged();
  }

  return (
    <>
      <TooltipProvider delayDuration={200}>
      <div className="flex items-center justify-end gap-2">
        {/* Primary CTA — the one obvious thing to click. Opens the in-app Chat tab (student
            dashboard only; omitted for admins, who have no in-app chat). */}
        {onChat && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                className="h-8 gap-1.5 px-3.5"
                disabled={!running}
                onClick={onChat}
                aria-label="Chat with your agent"
              >
                <MessageSquare className="h-4 w-4" />
                Chat
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {running ? "Chat with your agent" : "Start the agent to chat"}
            </TooltipContent>
          </Tooltip>
        )}

        {portActions.map(({ name, Icon, label, aria }) => (
          <Tooltip key={name}>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
                disabled={!running || opening === ports[name]}
                onClick={() => openPort(ports[name])}
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
                className="h-8 w-8 rounded-full border-amber-400 text-amber-500 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-500/10"
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
