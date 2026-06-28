import { agent37 } from "@/lib/agent37";
import { requireAgentAccess } from "@/lib/auth";
import { ApiError, json, readJson, route } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

// Recursive force delete (rm -rf) of one path on the instance. The Agents API owns the filesystem
// and applies no guards — confirmation lives in the UI. A symlink is removed itself, not followed.
export const DELETE = route(async (request: Request, { params }: Ctx) => {
  const { id } = await params;
  await requireAgentAccess(id, "member");
  const path = new URL(request.url).searchParams.get("path");
  if (!path) throw new ApiError(400, "invalid_request", "path is required");
  return json(await agent37.deleteFile(id, path));
});

// Rename/move a path (fs.rename on the instance; the OS decides overwrite/dir rules). Returns the
// resolved FileEntry of the new path so the browser can reflect the move without a relist.
export const PATCH = route(async (request: Request, { params }: Ctx) => {
  const { id } = await params;
  await requireAgentAccess(id, "member");
  const { from, to } = await readJson<{ from?: string; to?: string }>(request);
  if (!from || !to) throw new ApiError(400, "invalid_request", "from and to are required");
  return json(await agent37.moveFile(id, from, to));
});
