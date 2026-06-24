import { agent37 } from "@/lib/agent37";
import { requireAgentAccess, requireEntitled } from "@/lib/auth";
import { ApiError, json, route } from "@/lib/http";

type Ctx = { params: Promise<{ id: string; action: string }> };

const ACTIONS = {
  start: agent37.start,
  stop: agent37.stop,
  restart: agent37.restart,
  update: agent37.update,
} as const;

// Actions that resume or raise Agent37 spend must pass the entitlement gate.
// `stop` (and delete elsewhere) reduce spend, so a lapsed user keeps those.
const SPEND_ACTIONS = new Set(["start", "restart", "update"]);

export const POST = route(async (_request: Request, { params }: Ctx) => {
  const { id, action } = await params;
  const fn = ACTIONS[action as keyof typeof ACTIONS];
  if (!fn) throw new ApiError(404, "not_found", `Unknown action: ${action}`);

  const { supabase, isPlatformAdmin } = await requireAgentAccess(id, "admin");
  // Operators acting from /admin aren't subject to the per-user entitlement gate — that
  // gate is the student's Stripe seam, not the operator's.
  if (SPEND_ACTIONS.has(action) && !isPlatformAdmin) await requireEntitled(supabase);

  const result = await fn(id);
  if (result.status) {
    await supabase.rpc("set_agent_status", { p_agent37_id: id, p_status: result.status });
  }

  return json(result);
});
