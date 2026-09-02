import { agent37 } from "@/lib/agent37";
import { requireAgentAccess } from "@/lib/auth";
import { allOpenablePorts } from "@/config/agents";
import { ApiError, json, readJson, route } from "@/lib/http";

// Every port openable on ANY template. The fleet is mixed after the template switch - Hermes
// boxes serve 9119, Apollo/OpenClaw ones 18789 - and this is a guard against a member opening an
// arbitrary internal port, not a per-agent capability check. Asking Agent37 which template this
// instance runs, on every signed-url mint, would be a network round trip to narrow an allowlist
// that is already only the four surfaces we deliberately expose.
const ALLOWED_PORTS = allOpenablePorts();

type Ctx = { params: Promise<{ id: string }> };

// Mints a short-lived edge signed URL to one of the agent's allow-listed ports — the dashboard
// (9119 on Hermes, 18789 on the Apollo/OpenClaw build), the terminal (7681) or the file browser
// (8080). The signed
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
