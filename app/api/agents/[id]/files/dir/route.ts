import { agent37 } from "@/lib/agent37";
import { requireAgentAccess } from "@/lib/auth";
import { json, requireTrimmed, route } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

// Create a directory (mkdir -p, recursive + idempotent) on the instance. Returns the resolved
// FileEntry of the directory.
export const POST = route(async (request: Request, { params }: Ctx) => {
  const { id } = await params;
  await requireAgentAccess(id, "member");
  const path = requireTrimmed(new URL(request.url).searchParams.get("path"), "path is required");
  return json(await agent37.makeDir(id, path), 201);
});
