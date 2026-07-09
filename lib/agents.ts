import { agent37 } from "@/lib/agent37";
import type { Agent, AgentRow, MergedAgent } from "@/lib/types";

// One account-wide listAgents() (live status/resources) + one listTemplates()
// (latest image per template, to flag available updates). Either agent37 failure
// degrades to an empty map rather than throwing, so the dashboard still renders the
// stored rows. Shared by the member and admin agent-list routes.
export async function loadLiveAgentState(): Promise<{
  live: Map<string, Agent>;
  templateImages: Map<string, string>;
}> {
  const [liveRes, tmplRes] = await Promise.allSettled([
    agent37.listAgents(),
    agent37.listTemplates(),
  ]);
  const live =
    liveRes.status === "fulfilled"
      ? new Map(liveRes.value.data.map((a) => [a.id, a]))
      : new Map<string, Agent>();
  const templateImages =
    tmplRes.status === "fulfilled"
      ? new Map(tmplRes.value.data.filter((t) => t.image_ref).map((t) => [t.name, t.image_ref]))
      : new Map<string, string>();
  return { live, templateImages };
}

// Project a stored AgentRow onto its live agent37 instance, preferring live values
// (resources/status) and flagging update_available when the running image lags
// the template's latest. `live` is undefined when the box isn't in the account listing.
export function mergeAgent(
  row: AgentRow,
  live: Agent | undefined,
  templateImages: Map<string, string>
): MergedAgent {
  const latestImage = live ? templateImages.get(live.template) : undefined;
  return {
    ...row,
    cpu: live?.resources.cpu ?? row.cpu,
    memory: live?.resources.memory ?? row.memory,
    disk: live?.resources.disk ?? row.disk,
    template: live?.template ?? row.template,
    live_status: live?.status ?? row.status,
    status_reason: live?.status_reason ?? null,
    past_due: live?.past_due ?? false,
    update_available: !!(live?.image_ref && latestImage && live.image_ref !== latestImage),
  };
}
