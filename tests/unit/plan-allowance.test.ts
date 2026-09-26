import { beforeEach, describe, expect, it, vi } from "vitest";

// The monthly AI allowance is money the student already paid for. The failure modes: an
// invoice funds twice (Stripe sends invoice.paid AND invoice.payment_succeeded, and retries
// both), an ApolloClaw invoice on the shared Stripe account funds a College Agent wallet, or
// the first month's allowance is lost because the agent did not exist yet when checkout paid.

const mocks = vi.hoisted(() => ({
  fundCredits: vi.fn(),
  findAgent37IdForUser: vi.fn(),
}));

vi.mock("@/lib/credits", () => ({ fundCredits: mocks.fundCredits }));
vi.mock("@/lib/provisioning", () => ({ findAgent37IdForUser: mocks.findAgent37IdForUser }));

import { deliverPendingAllowances, grantPlanAllowance } from "@/lib/plan-allowance";

type Row = { id: string; amount_cents: number; status: string };

// Just enough of the Supabase query builder for wallet_transactions.
function fakeDb(opts: { insertError?: { code: string; message: string } | null; pending?: Row[] } = {}) {
  const inserts: Record<string, unknown>[] = [];
  const updates: { id: unknown; patch: Record<string, unknown> }[] = [];
  const db = {
    from: () => ({
      insert: async (row: Record<string, unknown>) => {
        inserts.push(row);
        return { error: opts.insertError ?? null };
      },
      select: () => {
        const q = {
          eq: () => q,
          neq: async () => ({ data: opts.pending ?? [] }),
        };
        return q;
      },
      update: (patch: Record<string, unknown>) => ({
        eq: async (_col: string, id: unknown) => {
          updates.push({ id, patch });
          return { error: null };
        },
      }),
    }),
  };
  return { db: db as never, inserts, updates };
}

beforeEach(() => {
  mocks.fundCredits.mockReset().mockResolvedValue(undefined);
  mocks.findAgent37IdForUser.mockReset().mockResolvedValue("agent-1");
});

describe("grantPlanAllowance", () => {
  it("skips a price that is not a College Agent plan, without touching the ledger", async () => {
    const { db, inserts } = fakeDb();
    await expect(
      grantPlanAllowance(db, { userId: "u1", invoiceId: "in_1", lookupKey: "apolloclaw_hosting" })
    ).resolves.toBe("skipped");
    expect(inserts).toHaveLength(0);
    expect(mocks.fundCredits).not.toHaveBeenCalled();
  });

  it("skips when there is no invoice to key the grant on", async () => {
    const { db, inserts } = fakeDb();
    await expect(
      grantPlanAllowance(db, { userId: "u1", invoiceId: null, lookupKey: "ca_tier_50" })
    ).resolves.toBe("skipped");
    expect(inserts).toHaveLength(0);
  });

  it("records one month on a monthly plan and twelve on an annual one", async () => {
    const monthly = fakeDb();
    await grantPlanAllowance(monthly.db, { userId: "u1", invoiceId: "in_m", lookupKey: "ca_tier_50" });
    expect(monthly.inserts[0]).toMatchObject({
      type: "allowance",
      status: "pending",
      amount_cents: 1500,
      stripe_invoice_id: "in_m",
    });

    const annual = fakeDb();
    await grantPlanAllowance(annual.db, { userId: "u1", invoiceId: "in_a", lookupKey: "ca_tier_100_annual" });
    expect(annual.inserts[0]).toMatchObject({ amount_cents: 4000 * 12, stripe_invoice_id: "in_a" });
  });

  it("treats an invoice already on the ledger as recorded, not as an error", async () => {
    const { db } = fakeDb({ insertError: { code: "23505", message: "duplicate key" } });
    await expect(
      grantPlanAllowance(db, { userId: "u1", invoiceId: "in_1", lookupKey: "ca_hosting" })
    ).resolves.toBe("delivered");
  });

  it("throws when the ledger cannot be written, so Stripe retries the delivery", async () => {
    const { db } = fakeDb({ insertError: { code: "57014", message: "timeout" } });
    await expect(
      grantPlanAllowance(db, { userId: "u1", invoiceId: "in_1", lookupKey: "ca_hosting" })
    ).rejects.toThrow(/ledger insert failed/);
  });

  it("leaves the first month pending when the agent has not been built yet", async () => {
    mocks.findAgent37IdForUser.mockResolvedValue(null);
    const { db } = fakeDb();
    await expect(
      grantPlanAllowance(db, { userId: "u1", invoiceId: "in_1", lookupKey: "ca_hosting" })
    ).resolves.toBe("pending");
    expect(mocks.fundCredits).not.toHaveBeenCalled();
  });
});

describe("deliverPendingAllowances", () => {
  it("funds each pending row in micros, keyed by the row id so a retry cannot double-fund", async () => {
    const { db, updates } = fakeDb({
      pending: [
        { id: "row-a", amount_cents: 500, status: "pending" },
        { id: "row-b", amount_cents: 1500, status: "failed" },
      ],
    });
    await expect(deliverPendingAllowances(db, "u1", "agent-1")).resolves.toBe(2);
    expect(mocks.fundCredits).toHaveBeenCalledWith("agent-1", 5_000_000, "row-a");
    expect(mocks.fundCredits).toHaveBeenCalledWith("agent-1", 15_000_000, "row-b");
    expect(updates.map((u) => [u.id, u.patch.status])).toEqual([
      ["row-a", "succeeded"],
      ["row-b", "succeeded"],
    ]);
  });

  it("marks a failed delivery with its reason and keeps going, never throwing", async () => {
    mocks.fundCredits.mockRejectedValueOnce(new Error("agent37 down"));
    const { db, updates } = fakeDb({
      pending: [
        { id: "row-a", amount_cents: 500, status: "pending" },
        { id: "row-b", amount_cents: 500, status: "pending" },
      ],
    });
    await expect(deliverPendingAllowances(db, "u1", "agent-1")).resolves.toBe(1);
    expect(updates[0]).toEqual({ id: "row-a", patch: { status: "failed", failure_reason: "agent37 down" } });
    expect(updates[1]).toMatchObject({ id: "row-b", patch: { status: "succeeded" } });
  });
});
