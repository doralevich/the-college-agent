import { agent37 } from "@/lib/agent37";
import { requireAgentAccess } from "@/lib/auth";
import { json, route } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

// The agent's connected app accounts — drives the Connected list, the catalog badges, and the
// post-connect poll that detects when the OAuth flow finishes.
export const GET = route(async (_request: Request, { params }: Ctx) => {
  const { id } = await params;
  await requireAgentAccess(id, "member");
  return json(await agent37.listIntegrationConnections(id));
});
