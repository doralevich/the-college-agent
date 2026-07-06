import "server-only";
import { agent37 } from "@/lib/agent37";
import { fundedMicros } from "@/lib/markup";
import type { Budget } from "@/lib/types";

// Fund a student's credit budget for `payerMicros` of credit they PAID for (or that we're
// granting them at face value). This is the ONE place credit reaches Agent37: it applies
// the operator markup — funding fundedMicros(payerMicros) of real headroom and keeping the
// spread — before the raw top-up. Every funding path (checkout top-up, starter grant,
// auto-recharge, operator comp, cron reconcile) MUST go through here so the margin is taken
// exactly once and the display multiplier stays consistent. `idempotencyKey` (the ledger
// row id / payment intent id) dedupes upstream so retries can't double-fund.
export function fundCredits(
  agentId: string,
  payerMicros: number,
  idempotencyKey?: string
): Promise<Budget> {
  return agent37.topUpBudget(agentId, fundedMicros(payerMicros), idempotencyKey);
}
