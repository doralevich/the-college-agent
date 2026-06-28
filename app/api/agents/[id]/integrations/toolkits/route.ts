import { agent37 } from "@/lib/agent37";
import { requireAgentAccess } from "@/lib/auth";
import { json, route } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

// Search or browse the managed app catalog. `search` is optional; omitting it returns the
// default popularity-ranked page (the v1 route 400s a non-empty query shorter than 3 chars).
export const GET = route(async (request: Request, { params }: Ctx) => {
  const { id } = await params;
  await requireAgentAccess(id, "member");
  const url = new URL(request.url);
  const search = url.searchParams.get("search")?.trim() || undefined;
  const limitRaw = Number(url.searchParams.get("limit"));
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(24, Math.floor(limitRaw)) : undefined;
  return json(await agent37.listIntegrationToolkits(id, { search, limit }));
});
