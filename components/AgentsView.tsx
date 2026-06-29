"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { apiFetch } from "@/lib/api";
import { isTransitional, statusVariant } from "@/lib/format";
import type { MergedAgent, Role } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AgentActionsMenu } from "@/components/AgentActionsMenu";
import { AgentNameCell } from "@/components/AgentNameCell";
import { useChatContext } from "@/components/chat/ChatProvider";

// `onOpenChat` switches the dashboard to the Chat tab; combined with startNewChat it powers
// the per-row "Chat" CTA. Only the student dashboard (always under a ChatProvider) renders
// this view, so reading chat context here is safe.
export function AgentsView({ firstName, onOpenChat }: { firstName: string | null; onOpenChat: () => void }) {
  const router = useRouter();
  const { current } = useWorkspace();
  const { startNewChat } = useChatContext();
  const handleChat = () => {
    startNewChat();
    onOpenChat();
  };
  const [agents, setAgents] = useState<MergedAgent[]>([]);
  const [role, setRole] = useState<Role>("admin");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!current) return;
    try {
      const data = await apiFetch<{ agents: MergedAgent[]; role: Role }>(
        `/api/agents?workspace=${current.id}`
      );
      setAgents(data.agents);
      setRole(data.role);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [current]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  useEffect(() => {
    if (!agents.some((a) => isTransitional(a.live_status))) return;
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [agents, load]);

  if (!current) return <p className="text-sm text-muted-foreground">No workspace selected.</p>;

  const greetingName = firstName?.trim() || "there";
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          Hi {greetingName}, welcome to your agent&apos;s dashboard. Click on Chat to get started.
        </h1>
        <p className="text-sm text-muted-foreground">
          You can also select Integrations on the sidebar, this is where you&apos;ll connect all of
          your external programs. It&apos;s pretty simple and kind of easy...and completely secure.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : agents.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">No agents in this workspace yet.</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Tell us about you again, and we&apos;ll build you a fresh agent.
          </p>
          <Button className="mt-4" onClick={() => router.refresh()}>
            Create Agent
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Resources</th>
                <th className="px-4 py-2 text-right font-medium">Quick actions</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((a) => (
                <tr key={a.agent37_id} className="border-t [&>td]:align-middle">
                  <td className="px-4 py-3">
                    <AgentNameCell agent={a} canEdit={role === "admin"} onRenamed={load} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Badge variant={statusVariant(a.live_status)}>{a.live_status ?? "unknown"}</Badge>
                      {a.past_due && <Badge variant="warning">past due</Badge>}
                    </div>
                    {a.status_reason && (
                      <div
                        className="mt-1 max-w-[16rem] truncate text-xs text-destructive"
                        title={a.status_reason.message}
                      >
                        {a.status_reason.message}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {a.cpu} vCPU · {a.memory} GB · {a.disk} GB
                  </td>
                  <td className="px-4 py-3">
                    <AgentActionsMenu
                      agent={a}
                      role={role}
                      onChanged={load}
                      onChat={handleChat}
                      confirmDeleteDescription="This deletes your agent and clears your onboarding answers (Tell the Agent About You). Your technical setup stays intact. You'll redo onboarding to create a new agent. This cannot be undone."
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
