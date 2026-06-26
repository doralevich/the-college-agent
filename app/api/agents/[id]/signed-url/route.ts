import { agent37 } from "@/lib/agent37";
import { requireAgentAccess } from "@/lib/auth";
import { PORTS } from "@/config/agents";
import { ApiError, json, readJson, route } from "@/lib/http";

const ALLOWED_PORTS = Object.values(PORTS) as number[];

type Ctx = { params: Promise<{ id: string }> };

// Mints a short-lived edge signed URL to one of the agent's allow-listed ports — the
// Hermes dashboard (9120), the terminal (7682), or the file browser (8081), all declared
// by the `college-agent` custom template. The signed
// URL is the auth boundary: it grants authenticated network access to that port, and
// Hermes' gateway handles its own session behind it. Members of the workspace and
// platform admins (operators, cross-tenant) may open these.
export const POST = route(async (request: Request, { params }: Ctx) => {
  const { id } = await params;
  await requireAgentAccess(id, "member");

  const { port, ttl_seconds } = await readJson<{ port?: number; ttl_seconds?: number }>(request);
  if (!port) throw new ApiError(400, "invalid_request", "port is required");
  // Enforce the allowlist server-side: a member must not open an arbitrary internal port.
  if (!ALLOWED_PORTS.includes(port)) throw new ApiError(400, "invalid_request", "port is not openable");

  return json(await agent37.signedUrl(id, port, ttl_seconds));
});
