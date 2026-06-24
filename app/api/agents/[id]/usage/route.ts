import { agent37 } from "@/lib/agent37";
import { requireAgentAccess } from "@/lib/auth";
import { json, route } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export const GET = route(async (request: Request, { params }: Ctx) => {
  const { id } = await params;
  await requireAgentAccess(id, "member");

  const month = new URL(request.url).searchParams.get("month") || undefined;
  return json(await agent37.getUsage(id, month));
});
