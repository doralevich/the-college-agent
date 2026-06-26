import { instanceFetch } from "@/lib/agent37";
import { requireAgentAccess } from "@/lib/auth";
import { ApiError, json, route, upstreamErrorMessage } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

// Upload one attachment onto the instance and return its path, which the composer then passes
// in the turn's `files` array. Re-streams the multipart body to the Agents API POST /v1/files.
// Don't set Content-Type — fetch derives the multipart boundary from FormData.
export const POST = route(async (request: Request, { params }: Ctx) => {
  const { id } = await params;
  await requireAgentAccess(id, "member");

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) throw new ApiError(400, "invalid_request", "file is required");

  const upstreamForm = new FormData();
  upstreamForm.append("file", file, file.name);

  const upstream = await instanceFetch(id, "/v1/files", { method: "POST", body: upstreamForm });
  const text = await upstream.text().catch(() => "");
  if (!upstream.ok) {
    const message = upstreamErrorMessage(text, upstream.status, "chat/files", "Upload failed");
    throw new ApiError(upstream.status || 502, "upload_error", message);
  }

  return json(text ? JSON.parse(text) : {}, 201);
});

export const maxDuration = 120;
