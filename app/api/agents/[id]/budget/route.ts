import { agent37 } from "@/lib/agent37";
import { requireAgentAccess } from "@/lib/auth";
import { requirePlatformAdmin } from "@/lib/admin";
import { usdToMicros } from "@/lib/format";
import { ApiError, json, readJson, route } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export const GET = route(async (_request: Request, { params }: Ctx) => {
  const { id } = await params;
  await requireAgentAccess(id, "member");

  return json(await agent37.getBudget(id));
});

// Operator-only: raise the monthly cap or add a one-off top-up for a student whose
// agent ran out. Accepts either { monthly_cap_usd } or { topup_usd } (or both).
export const PATCH = route(async (request: Request, { params }: Ctx) => {
  const { id } = await params;
  await requirePlatformAdmin();

  const body = await readJson<{ monthly_cap_usd?: number; topup_usd?: number }>(request);
  const patch: { monthly_cap_micros?: number; topup_micros?: number } = {};
  if (typeof body.monthly_cap_usd === "number") patch.monthly_cap_micros = usdToMicros(body.monthly_cap_usd);
  if (typeof body.topup_usd === "number") patch.topup_micros = usdToMicros(body.topup_usd);
  if (Object.keys(patch).length === 0) {
    throw new ApiError(400, "invalid_request", "Provide monthly_cap_usd and/or topup_usd");
  }

  return json(await agent37.setBudget(id, patch));
});
