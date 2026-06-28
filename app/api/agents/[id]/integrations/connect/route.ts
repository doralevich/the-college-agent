import { agent37, Agent37Error } from "@/lib/agent37";
import { requireAgentAccess } from "@/lib/auth";
import { publicSiteOrigin } from "@/lib/site-url";
import { ApiError, json, readJson, route } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

// Begin connecting an app: returns the OAuth `redirectUrl` to navigate to. We pass a `callbackUrl`
// so Composio returns the student to this tab when they finish (?composioConnect=1&toolkit=…). The
// v1 route requires it be absolute https, so on a local http origin we omit it (the connect still
// works; the student just lands on Composio's default page instead of back here).
export const POST = route(async (request: Request, { params }: Ctx) => {
  const { id } = await params;
  await requireAgentAccess(id, "member");

  const { toolkit } = await readJson<{ toolkit?: string }>(request);
  if (!toolkit || typeof toolkit !== "string") {
    throw new ApiError(400, "invalid_request", "toolkit is required");
  }

  const origin = publicSiteOrigin(new URL(request.url).origin);
  let callbackUrl: string | undefined;
  if (origin.startsWith("https://")) {
    const cb = new URL("/dashboard/integrations", origin);
    cb.searchParams.set("composioConnect", "1");
    cb.searchParams.set("toolkit", toolkit);
    callbackUrl = cb.toString();
  }

  try {
    return json(await agent37.connectIntegration(id, { toolkit, callbackUrl }));
  } catch (e) {
    // Some apps need a bring-your-own-credentials flow we don't expose to students; the v1
    // route signals that with a 422. Map it to a clear message, not the bare "Unprocessable Entity".
    if (e instanceof Agent37Error && e.status === 422) {
      throw new ApiError(422, "custom_auth_required", "This app can't be connected here yet.");
    }
    throw e;
  }
});
