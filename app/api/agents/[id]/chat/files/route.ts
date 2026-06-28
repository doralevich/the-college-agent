import { instanceFetch } from "@/lib/agent37";
import { requireAgentAccess } from "@/lib/auth";
import { ApiError, assertUpstreamOk, json, route } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

// Upload one chat attachment onto the instance and return its path, which the composer then passes
// in the turn's `files` array. The Agents API's multipart POST /v1/files was removed, so we take
// the browser's multipart upload (unchanged contract: field `file`, response `{ path }`) and write
// the raw bytes via PUT /v1/files/content to a collision-proof name under ~/uploads. We send the
// File (a Blob) as the body directly — no multipart, no streaming opt-in needed.
export const POST = route(async (request: Request, { params }: Ctx) => {
  const { id } = await params;
  await requireAgentAccess(id, "member");

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) throw new ApiError(400, "invalid_request", "file is required");

  // Short random prefix keeps concurrent uploads of the same filename from clobbering each other;
  // strip path separators from the original name so it stays a single basename under ~/uploads.
  const prefix = Math.random().toString(36).slice(2, 10);
  const safeName = (file.name || "file").replace(/[/\\]/g, "_");
  const target = `~/uploads/${prefix}-${safeName}`;

  const upstream = await instanceFetch(id, `/v1/files/content?path=${encodeURIComponent(target)}`, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  await assertUpstreamOk(upstream, "chat/files", "Upload failed", "upload_error");
  const text = await upstream.text().catch(() => "");

  // Return the gateway's resolved path so the composer can reference it in the turn's `files`.
  const entry = text ? (JSON.parse(text) as { path?: string }) : {};
  return json({ path: entry.path }, 201);
});

export const maxDuration = 120;
