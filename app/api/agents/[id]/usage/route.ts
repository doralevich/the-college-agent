import { agent37 } from "@/lib/agent37";
import { displayUsage } from "@/lib/markup";
import { requireAgentAccess } from "@/lib/auth";
import { json, route } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

// Student-facing (member access): restate raw Agent37 usage in student dollars so the hidden
// markup stays hidden. Admin reads usage through the /admin workspaces route (raw), not this.
export const GET = route(async (request: Request, { params }: Ctx) => {
  const { id } = await params;
  await requireAgentAccess(id, "member");

  const month = new URL(request.url).searchParams.get("month") || undefined;
  return json(displayUsage(await agent37.getUsage(id, month)));
});
