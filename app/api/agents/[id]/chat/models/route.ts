import { agent37 } from "@/lib/agent37";
import { requireAgentAccess } from "@/lib/auth";
import { curateModelsResponse } from "@/lib/chat-models";
import { json, route } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

// List the models the student's agent can run, for the composer's model switcher.
export const GET = route(async (_request: Request, { params }: Ctx) => {
  const { id } = await params;
  await requireAgentAccess(id, "member");
  return json(curateModelsResponse(await agent37.listModels(id)));
});
