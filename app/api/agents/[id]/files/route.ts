import { agent37 } from "@/lib/agent37";
import { requireAgentAccess } from "@/lib/auth";
import { json, readJson, requireTrimmed, route } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

// Recursive force delete (rm -rf) of one path on the instance. The Agents API owns the filesystem
// and applies no guards — confirmation lives in the UI. A symlink is removed itself, not followed.
export const DELETE = route(async (request: Request, { params }: Ctx) => {
  const { id } = await params;
  await requireAgentAccess(id, "member");
  const path = requireTrimmed(new URL(request.url).searchParams.get("path"), "path is required");
  return json(await agent37.deleteFile(id, path));
});

// Rename/move a path (fs.rename on the instance; the OS decides overwrite/dir rules). Returns the
// resolved FileEntry of the new path so the browser can reflect the move without a relist.
export const PATCH = route(async (request: Request, { params }: Ctx) => {
  const { id } = await params;
  await requireAgentAccess(id, "member");
  const { from, to } = await readJson<{ from?: string; to?: string }>(request);
  return json(await agent37.moveFile(id, requireTrimmed(from, "from is required"), requireTrimmed(to, "to is required")));
});
