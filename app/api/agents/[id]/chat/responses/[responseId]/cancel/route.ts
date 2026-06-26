import { agent37 } from "@/lib/agent37";
import { requireAgentAccess } from "@/lib/auth";
import { json, route } from "@/lib/http";

type Ctx = { params: Promise<{ id: string; responseId: string }> };

// Stop an in-flight turn (the composer's stop button).
export const POST = route(async (_request: Request, { params }: Ctx) => {
  const { id, responseId } = await params;
  await requireAgentAccess(id, "member");
  return json(await agent37.cancelResponse(id, responseId));
});
