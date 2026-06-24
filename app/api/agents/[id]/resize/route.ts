import { agent37 } from "@/lib/agent37";
import { requireAgentAccess, requireEntitled } from "@/lib/auth";
import { ApiError, json, readJson, route } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export const POST = route(async (request: Request, { params }: Ctx) => {
  const { id } = await params;
  const { supabase } = await requireAgentAccess(id, "admin");
  await requireEntitled(supabase);

  const body = await readJson<{ cpu?: number; memory?: number; disk?: number }>(request);
  if (!body.cpu && !body.memory && !body.disk) {
    throw new ApiError(400, "invalid_request", "Provide at least one of cpu, memory, disk");
  }

  const result = await agent37.resize(id, body);
  await supabase
    .from("agents")
    .update({
      cpu: result.resources.cpu,
      memory: result.resources.memory,
      disk: result.resources.disk,
      status: result.status,
    })
    .eq("agent37_id", id);

  return json(result);
});
