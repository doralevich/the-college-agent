import { agent37 } from "@/lib/agent37";
import { requireAgentAccess } from "@/lib/auth";
import { ApiError, json, route } from "@/lib/http";

type Ctx = { params: Promise<{ id: string; connectedAccountId: string }> };

// Disconnect (revoke) one connected app account. The v1 endpoint verifies the account belongs
// to this instance before deleting.
export const DELETE = route(async (_request: Request, { params }: Ctx) => {
  const { id, connectedAccountId } = await params;
  if (!connectedAccountId) {
    throw new ApiError(400, "invalid_request", "connectedAccountId is required");
  }
  await requireAgentAccess(id, "member");
  return json(await agent37.disconnectIntegration(id, connectedAccountId));
});
