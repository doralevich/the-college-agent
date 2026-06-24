import { agent37 } from "@/lib/agent37";
import { requireAgentAccess } from "@/lib/auth";
import { ApiError, json, readJson, requireTrimmed, route } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = route(async (request: Request, { params }: Ctx) => {
  const { id } = await params;
  const { supabase } = await requireAgentAccess(id, "admin");

  const { name } = await readJson<{ name?: string }>(request);
  const trimmed = requireTrimmed(name, "name is required");

  const { error } = await supabase.from("agents").update({ name: trimmed }).eq("agent37_id", id);
  if (error) throw new ApiError(500, "db_error", error.message);

  return json({ id, name: trimmed });
});

export const DELETE = route(async (_request: Request, { params }: Ctx) => {
  const { id } = await params;
  const { supabase } = await requireAgentAccess(id, "admin");

  await agent37.deleteAgent(id);
  await supabase.from("agents").delete().eq("agent37_id", id);

  return json({ id, deleted: true });
});
