import { beforeEach, describe, expect, it, vi } from "vitest";

// The College Agent's own billing portal. The Stripe account is shared with ApolloClaw, so the
// failure modes are: touching ApolloClaw's (or the default) portal configuration, offering an
// annual plan to a monthly student (an interval switch invoices immediately and grants no
// allowance), or piling up a new configuration on every request.

const mocks = vi.hoisted(() => ({
  configs: [] as Array<{ id: string; metadata: Record<string, string> }>,
  create: vi.fn(),
  update: vi.fn(),
  subs: [] as unknown[],
}));

vi.mock("@/lib/stripe/prices", () => ({
  priceIdsFor: async (keys: string[]) => keys.map((k) => `price_${k}`),
}));

vi.mock("@/lib/stripe/client", () => ({
  getStripe: () => ({
    prices: { retrieve: async (id: string) => ({ id, product: `prod_${id}` }) },
    billingPortal: {
      configurations: {
        list: () => ({
          async *[Symbol.asyncIterator]() {
            yield* mocks.configs;
          },
        }),
        create: mocks.create,
        update: mocks.update,
      },
    },
    subscriptions: { list: async () => ({ data: mocks.subs }) },
  }),
}));

type Portal = typeof import("@/lib/stripe/portal");
let portal: Portal;

beforeEach(async () => {
  // The module memoizes configuration ids per process; start each test fresh.
  vi.resetModules();
  portal = await import("@/lib/stripe/portal");
  mocks.configs = [];
  mocks.subs = [];
  mocks.create.mockReset().mockResolvedValue({ id: "bpc_new" });
  mocks.update.mockReset().mockResolvedValue({ id: "bpc_updated" });
});

describe("portalConfigurationFor", () => {
  it("creates a configuration listing only the three plans on that interval", async () => {
    await expect(portal.portalConfigurationFor("monthly")).resolves.toBe("bpc_new");
    const params = mocks.create.mock.calls[0][0];
    expect(params.features.subscription_update.products).toEqual([
      { product: "prod_price_ca_hosting", prices: ["price_ca_hosting"] },
      { product: "prod_price_ca_tier_50", prices: ["price_ca_tier_50"] },
      { product: "prod_price_ca_tier_100", prices: ["price_ca_tier_100"] },
    ]);
    expect(params.metadata).toMatchObject({ app: "college-agent", interval: "monthly" });
  });

  it("gives annual students only the annual plans", async () => {
    await portal.portalConfigurationFor("annual");
    const prices = mocks.create.mock.calls[0][0].features.subscription_update.products.flatMap(
      (p: { prices: string[] }) => p.prices
    );
    expect(prices).toEqual(["price_ca_hosting_annual", "price_ca_tier_50_annual", "price_ca_tier_100_annual"]);
  });

  it("starts a plan change at the next billing date, with no mid-period charge or refund", async () => {
    await portal.portalConfigurationFor("monthly");
    const f = mocks.create.mock.calls[0][0].features;
    expect(f.subscription_update).toMatchObject({
      enabled: true,
      proration_behavior: "none",
      billing_cycle_anchor: "unchanged",
    });
    expect(f.subscription_cancel).toMatchObject({ enabled: true, mode: "at_period_end" });
  });

  it("reuses a matching configuration and never touches another app's", async () => {
    await portal.portalConfigurationFor("monthly");
    const signature = mocks.create.mock.calls[0][0].metadata.signature;

    vi.resetModules();
    portal = await import("@/lib/stripe/portal");
    mocks.create.mockClear();
    mocks.configs = [
      { id: "bpc_apollo", metadata: { app: "apolloclaw", interval: "monthly" } },
      { id: "bpc_default", metadata: {} },
      { id: "bpc_ours", metadata: { app: "college-agent", interval: "monthly", signature } },
    ];
    await expect(portal.portalConfigurationFor("monthly")).resolves.toBe("bpc_ours");
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("updates ours in place when a price has changed", async () => {
    mocks.configs = [{ id: "bpc_ours", metadata: { app: "college-agent", interval: "monthly", signature: "0:old" } }];
    await expect(portal.portalConfigurationFor("monthly")).resolves.toBe("bpc_updated");
    expect(mocks.update.mock.calls[0][0]).toBe("bpc_ours");
    expect(mocks.create).not.toHaveBeenCalled();
  });
});

describe("planSubscriptionFor", () => {
  const sub = (id: string, status: string, lookups: (string | null)[]) => ({
    id,
    status,
    items: { data: lookups.map((lookup_key) => ({ price: { lookup_key } })) },
  });

  it("finds the live plan subscription and its interval", async () => {
    mocks.subs = [sub("sub_old", "canceled", ["ca_tier_50"]), sub("sub_live", "active", ["ca_tier_100_annual"])];
    await expect(portal.planSubscriptionFor("cus_1")).resolves.toEqual({ id: "sub_live", interval: "annual" });
  });

  it("ignores ApolloClaw, legacy and multi-item subscriptions", async () => {
    mocks.subs = [
      sub("sub_apollo", "active", ["apolloclaw_hosting"]),
      sub("sub_legacy", "active", [null]),
      sub("sub_multi", "active", ["ca_hosting", "ca_tier_50"]),
    ];
    await expect(portal.planSubscriptionFor("cus_1")).resolves.toBeNull();
  });
});
