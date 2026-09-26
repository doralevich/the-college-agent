import "server-only";
import { fundCredits } from "@/lib/credits";
import { findAgent37IdForUser } from "@/lib/provisioning";
import { allowanceCentsFor, tierForLookup } from "@/lib/pricing/intro-cutoff";
import type { createAdminClient } from "@/lib/supabase/admin";

// The monthly AI allowance that comes with every plan: $5 / $15 / $40 of usage a month on
// Essentials / Plus / Pro, loaded each time the plan's invoice is paid.
//
// Two steps, deliberately separate, because the first invoice is paid BEFORE the agent
// exists - a student pays, then does the intake, and only then is their agent built:
//
//   1. RECORD the grant on the wallet ledger as a pending 'allowance' row, keyed by the
//      Stripe invoice id. The unique index on stripe_invoice_id means an invoice grants once,
//      however many times Stripe delivers it (it sends invoice.paid and
//      invoice.payment_succeeded for every invoice, and retries both).
//
//   2. DELIVER every pending allowance row to the agent, with the row id as the idempotency
//      key so a retry never double-funds. That happens here when the agent already exists (a
//      renewal), at provisioning when it does not (the first month), and in the hourly
//      credits-watch sweep for anything that failed in between.
//
// This replaces the one-time $20 starter credit: the first invoice's allowance IS the
// starting balance now.

type DB = ReturnType<typeof createAdminClient>;

/** Postgres unique_violation: this invoice's allowance is already on the ledger. */
const UNIQUE_VIOLATION = "23505";

export type AllowanceResult = "delivered" | "pending" | "skipped";

/**
 * Record one invoice's allowance and deliver it if the agent exists.
 *
 * Returns "skipped" for a price that is not one of our plan tiers - an ApolloClaw invoice
 * (the Stripe account is shared, and every event reaches this webhook) or a legacy price.
 * Neither is an error, and neither may throw: a throw 500s the webhook and Stripe would retry
 * somebody else's invoice at us forever.
 *
 * Throws only when the ledger itself cannot be written, so Stripe retries the delivery - the
 * student paid for this allowance and it must not be lost silently.
 */
export async function grantPlanAllowance(
  db: DB,
  args: { userId: string; invoiceId: string | null; lookupKey: string | null | undefined }
): Promise<AllowanceResult> {
  const plan = tierForLookup(args.lookupKey);
  if (!plan || !args.invoiceId) return "skipped";

  const { error } = await db.from("wallet_transactions").insert({
    user_id: args.userId,
    amount_cents: allowanceCentsFor(plan.tier, plan.interval),
    type: "allowance",
    status: "pending",
    stripe_invoice_id: args.invoiceId,
  });
  // Already recorded is fine - fall through and deliver, which also finishes a grant that a
  // previous attempt recorded and then crashed before funding.
  if (error && error.code !== UNIQUE_VIOLATION) {
    throw new Error(`allowance ledger insert failed: ${error.message}`);
  }

  const agentId = await findAgent37IdForUser(db, args.userId);
  if (!agentId) return "pending"; // first month: provisioning delivers it
  await deliverPendingAllowances(db, args.userId, agentId);
  return "delivered";
}

/**
 * Fund every allowance row for this student that has not landed yet. Returns how many did.
 *
 * Never throws. A failure is written onto the row (status 'failed' plus the reason) so it is
 * diagnosable from the database, and credits-watch picks it up on its next sweep.
 */
export async function deliverPendingAllowances(db: DB, userId: string, agentId: string): Promise<number> {
  const { data: rows } = await db
    .from("wallet_transactions")
    .select("id, amount_cents")
    .eq("user_id", userId)
    .eq("type", "allowance")
    .neq("status", "succeeded");

  let delivered = 0;
  for (const row of rows ?? []) {
    try {
      // 1 cent = 10,000 micros. fundCredits applies the operator markup, same as every other
      // grant, so the student sees the full allowance.
      await fundCredits(agentId, (row.amount_cents as number) * 10_000, row.id as string);
      await db
        .from("wallet_transactions")
        .update({ status: "succeeded", failure_reason: null })
        .eq("id", row.id);
      delivered += 1;
    } catch (e) {
      const reason = String((e as Error)?.message ?? e).slice(0, 500);
      console.error("[plan-allowance] delivery failed", row.id, reason);
      await db
        .from("wallet_transactions")
        .update({ status: "failed", failure_reason: reason })
        .eq("id", row.id);
    }
  }
  return delivered;
}
