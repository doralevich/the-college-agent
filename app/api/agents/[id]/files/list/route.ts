import { agent37 } from "@/lib/agent37";
import { requireAgentAccess } from "@/lib/auth";
import { json, route } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

// List one directory level of the instance's filesystem for the Files tab. `path` is optional —
// omitting it lists the agent's default workspace dir. The Agents API resolves ~ / absolute paths
// and returns the resolved absolute `path` + `parentPath`, so the browser navigates off the
// response alone. Upstream typed errors (e.g. not_a_directory) keep their code/status via route().
export const GET = route(async (request: Request, { params }: Ctx) => {
  const { id } = await params;
  await requireAgentAccess(id, "member");
  const path = new URL(request.url).searchParams.get("path") || undefined;
  return json(await agent37.listFiles(id, path));
});
