import { agent37 } from "@/lib/agent37";
import { fundCredits } from "@/lib/credits";
import { displayBudget } from "@/lib/markup";
import { requireAgentAccess } from "@/lib/auth";
import { requirePlatformAdmin } from "@/lib/admin";
import { usdToMicros } from "@/lib/format";
import { ApiError, json, readJson, route } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

// Student-facing (member access): restate the raw Agent37 budget in student dollars so the
// hidden markup never leaks. The operator's raw view is the /admin workspaces route, not this.
export const GET = route(async (_request: Request, { params }: Ctx) => {
  const { id } = await params;
  await requireAgentAccess(id, "member");

  return json(displayBudget(await agent37.getBudget(id)));
});

// Operator-only: raise the monthly cap or add a one-off top-up for a student whose
// agent ran out. Accepts either { monthly_cap_usd } or { topup_usd } (or both).
export const PATCH = route(async (request: Request, { params }: Ctx) => {
  const { id } = await params;
  await requirePlatformAdmin();

  const body = await readJson<{ monthly_cap_usd?: number; topup_usd?: number }>(request);
  const hasCap = typeof body.monthly_cap_usd === "number";
  const hasTopup = typeof body.topup_usd === "number";
  if (!hasCap && !hasTopup) {
    throw new ApiError(400, "invalid_request", "Provide monthly_cap_usd and/or topup_usd");
  }

  // Caps and top-ups are different upstream calls: caps update the budget subresource,
  // top-ups go through the one-time-headroom action. Return the freshest RAW budget — this
  // is an operator tool, so it reports Agent37's wholesale figures (not the student view).
  // The top-up runs through fundCredits so an operator comp of $N lands as $N of the
  // student's marked-up balance, same exchange rate as every other credit grant.
  let budget = null;
  if (hasCap) {
    budget = await agent37.setBudget(id, { monthly_cap_micros: usdToMicros(body.monthly_cap_usd as number) });
  }
  if (hasTopup) {
    budget = await fundCredits(id, usdToMicros(body.topup_usd as number));
  }
  return json(budget);
});
