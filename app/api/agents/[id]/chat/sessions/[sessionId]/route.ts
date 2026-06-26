import { agent37, Agent37Error } from "@/lib/agent37";
import { requireAgentAccess } from "@/lib/auth";
import { ApiError, json, readJson, route } from "@/lib/http";

type Ctx = { params: Promise<{ id: string; sessionId: string }> };

// Full conversation history for a thread (source of truth lives on the instance). Also used by
// the rail to derive a thread's label from its first message.
export const GET = route(async (_request: Request, { params }: Ctx) => {
  const { id, sessionId } = await params;
  await requireAgentAccess(id, "member");
  return json(await agent37.getSession(id, sessionId));
});

// Rename a thread (PATCH /v1/sessions/{id} on the instance). Newer Hermes builds store a title;
// builds without title support answer 404/405, which we translate into a clear 501 so the rail
// can roll back its optimistic rename and tell the student instead of failing opaquely.
export const PATCH = route(async (request: Request, { params }: Ctx) => {
  const { id, sessionId } = await params;
  await requireAgentAccess(id, "member");

  const { title } = await readJson<{ title?: string }>(request);
  const trimmed = (title ?? "").trim();
  if (!trimmed) throw new ApiError(400, "invalid_request", "title is required");

  try {
    return json(await agent37.renameSession(id, sessionId, trimmed.slice(0, 200)));
  } catch (e) {
    if (e instanceof Agent37Error && (e.status === 404 || e.status === 405)) {
      throw new ApiError(501, "rename_unsupported", "Renaming chats isn't supported on this agent build yet.");
    }
    throw e;
  }
});

// Delete a conversation on the instance. The Agents API owns the session lifecycle now — there
// is no local index row to clean up, so the upstream call is the one that surfaces.
export const DELETE = route(async (_request: Request, { params }: Ctx) => {
  const { id, sessionId } = await params;
  await requireAgentAccess(id, "member");
  return json(await agent37.deleteSession(id, sessionId));
});
