import { agent37 } from "@/lib/agent37";
import { requireAgentAccess } from "@/lib/auth";
import { PORTS } from "@/config/agents";
import { ApiError, json, readJson, route } from "@/lib/http";

const ALLOWED_PORTS = Object.values(PORTS) as number[];

// Reads OpenClaw's gateway auth token from the instance config. The Control UI served on the
// dashboard port (18789) reads this token from the URL fragment to authenticate the browser
// session — mirroring the B2C launch flow. Device-auth pairing is disabled and the edge origin
// is allow-listed on the openclaw image, so this token rides in alongside the edge signed URL.
const READ_OPENCLAW_TOKEN_CMD =
  'CONFIG="${OPENCLAW_CONFIG_PATH:-${OPENCLAW_STATE_DIR:-/home/node/.openclaw}/openclaw.json}"; ' +
  '[ -f "$CONFIG" ] && jq -r ".gateway.auth.token // empty" "$CONFIG" 2>/dev/null';

async function openclawDashboardToken(id: string): Promise<string | null> {
  try {
    const { stdout } = await agent37.exec(id, READ_OPENCLAW_TOKEN_CMD);
    // jq prints the token on its own line; take the last non-empty line and ignore any noise.
    const token = stdout.trim().split("\n").map((l) => l.trim()).filter(Boolean).pop() ?? "";
    return token || null;
  } catch (e) {
    console.error("[signed-url:openclaw-token]", id, (e as Error).message);
    return null;
  }
}

type Ctx = { params: Promise<{ id: string }> };

export const POST = route(async (request: Request, { params }: Ctx) => {
  const { id } = await params;
  await requireAgentAccess(id, "member");

  const { port, ttl_seconds } = await readJson<{ port?: number; ttl_seconds?: number }>(request);
  if (!port) throw new ApiError(400, "invalid_request", "port is required");
  // Enforce the allowlist server-side: a member must not open an arbitrary internal port.
  if (!ALLOWED_PORTS.includes(port)) throw new ApiError(400, "invalid_request", "port is not openable");

  // The OpenClaw Control UI (dashboard port) authenticates off the gateway token carried in the
  // URL fragment. Mint the signed URL and read that token concurrently — they're independent —
  // then append #token=...; if the token can't be read, fall back to the plain signed URL
  // (device-auth is disabled, so the edge signed URL may suffice on its own).
  const [result, token] = await Promise.all([
    agent37.signedUrl(id, port, ttl_seconds),
    port === PORTS.dashboard ? openclawDashboardToken(id) : Promise.resolve(null),
  ]);
  if (token) {
    const url = new URL(result.url);
    url.hash = `token=${encodeURIComponent(token)}`;
    result.url = url.toString();
  }

  return json(result);
});
