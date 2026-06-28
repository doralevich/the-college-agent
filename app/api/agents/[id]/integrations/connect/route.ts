import { agent37, Agent37Error } from "@/lib/agent37";
import { requireAgentAccess } from "@/lib/auth";
import { ApiError, json, readJson, route } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

// Begin connecting an app: returns the OAuth `redirectUrl` the student opens to authorize.
export const POST = route(async (request: Request, { params }: Ctx) => {
  const { id } = await params;
  await requireAgentAccess(id, "member");

  const { toolkit } = await readJson<{ toolkit?: string }>(request);
  if (!toolkit || typeof toolkit !== "string") {
    throw new ApiError(400, "invalid_request", "toolkit is required");
  }

  try {
    return json(await agent37.connectIntegration(id, { toolkit }));
  } catch (e) {
    // Some apps need a bring-your-own-credentials flow we don't expose to students; the v1
    // route signals that with a 422. Map it to a clear message, not the bare "Unprocessable Entity".
    if (e instanceof Agent37Error && e.status === 422) {
      throw new ApiError(422, "custom_auth_required", "This app can't be connected here yet.");
    }
    throw e;
  }
});
