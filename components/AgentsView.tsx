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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Your Agent</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          This is your personal AI agent: a private assistant that runs on its own cloud computer,
          around the clock, built from your intake answers. Here you can check that it&apos;s
          healthy, rename it, open its files, or start over with a fresh one.
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
                      reonboardOnDelete
                      confirmDeleteDescription="This deletes your agent and clears your onboarding answers (Tell the Agent About You). Your technical setup stays intact. You'll redo onboarding to create a new agent. This cannot be undone."
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && agents.length > 0 && <AgentKey />}
    </div>
  );
}

// A plain-language legend for the table above — students shouldn't have to guess what
// "running" or "2 vCPU" means, or what the icon buttons do.
function AgentKey() {
  return (
    <div className="rounded-xl border bg-muted/30 p-5">
      <h3 className="text-sm font-semibold">What everything means</h3>
      <dl className="mt-3 space-y-3 text-sm">
        <KeyRow term="Name">
          Your agent&apos;s name. Click it to rename your agent anytime.
        </KeyRow>
        <KeyRow term="Status">
          <span className="font-medium text-foreground">running</span> means your agent is live
          and ready to chat. Anything else (starting, provisioning) means it&apos;s coming online;
          give it a minute and it will sort itself out.
        </KeyRow>
        <KeyRow term="Resources">
          The dedicated cloud computer your agent runs on: processor, memory, and disk. This is
          what your monthly hosting pays for.
        </KeyRow>
        <KeyRow term="Chat">
          Opens a conversation with your agent right here in the dashboard.
        </KeyRow>
        <KeyRow term="File browser">
          The files your agent keeps for you: notes, plans, and documents. View or download
          anything, anytime.
        </KeyRow>
        <KeyRow term="Terminal">
          A direct window into your agent&apos;s computer, for advanced users. You&apos;ll never
          need it day to day.
        </KeyRow>
        <KeyRow term="More (…) menu">
          Restart, stop, or delete your agent. Deleting clears your intake answers so you can
          redo them and build a fresh agent; your account and billing stay intact.
        </KeyRow>
      </dl>
    </div>
  );
}

function KeyRow({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <dt className="w-32 shrink-0 font-medium">{term}</dt>
      <dd className="text-muted-foreground">{children}</dd>
    </div>
  );
}
