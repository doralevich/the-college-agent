import "server-only";
import { getStripe } from "./client";

// Same idempotent catalog seed as scripts/seed-stripe-catalog.mjs, but callable from a
// server route. Products are matched by metadata.catalog_key, prices by lookup_key.
// Stripe Prices are immutable — when an amount changes we mint a new price and transfer
// the lookup_key to it, then archive the old one. Renamed keys (ARCHIVED_KEYS) are
// deactivated so priceIdFor never resolves a stale entry.

type CatalogItem = {
  key: string;
  name: string;
  amount: number;
  recurring: false | "month" | "year";
};

const CATALOG: CatalogItem[] = [
  // The College Agent — new pricing model: one-time plan fee + monthly hosting.
  // Intro vs regular flips on the Aug 15 cutoff (lib/pricing/intro-cutoff.ts);
  // the checkout route picks the right key per-request, but both stay seeded so
  // either can resolve immediately.
  { key: "ca_plan_intro", name: "The College Agent (Intro, thru Aug 15)", amount: 49900, recurring: false },
  { key: "ca_plan_regular", name: "The College Agent (Plan)", amount: 59900, recurring: false },
  { key: "ca_hosting", name: "The College Agent — Hosting", amount: 2500, recurring: "month" },
  // Legacy configurator catalog (multi-tier /build configurator) — keep seeded for
  // back-compat until those routes go away.
  { key: "plan_undergraduate", name: "The Undergraduate", amount: 19900, recurring: false },
  { key: "plan_graduate", name: "The Graduate", amount: 39900, recurring: false },
  { key: "plan_scholar", name: "The Scholar", amount: 59900, recurring: false },
  { key: "support_sixmonths", name: "6 Months Support", amount: 75000, recurring: false },
  { key: "support_annual", name: "Annual Support", amount: 120000, recurring: false },
  { key: "onboarding_whiteglove", name: "White Glove Onboarding", amount: 65000, recurring: false },
  { key: "hosting_basic", name: "Hosting - Basic", amount: 1999, recurring: "month" },
  { key: "hosting_plus", name: "Hosting - Plus", amount: 2999, recurring: "month" },
  { key: "hosting_pro", name: "Hosting - Pro", amount: 4999, recurring: "month" },
  { key: "hosting_max", name: "Hosting - Max", amount: 9900, recurring: "month" },
];

// Old recurring College Agent prices ($29.99/mo, $299.99/yr). The new model splits
// the plan (one-time) from hosting (monthly), so these are deactivated. Existing
// subscribers keep paying their original price until they cancel/migrate.
const ARCHIVED_KEYS = ["plan_basic", "support_6mo", "ca_monthly", "ca_annual"];

export type SeedRow = {
  key: string;
  name: string;
  amount: number;
  product: string;
  price: string;
  action: "unchanged" | "created" | "repriced" | "renamed";
};

export type SeedResult = {
  mode: "test" | "live";
  rows: SeedRow[];
  archived: string[];
};

export async function seedStripeCatalog(): Promise<SeedResult> {
  const stripe = getStripe();
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  const live = key.startsWith("sk_live");

  const rows: SeedRow[] = [];
  for (const item of CATALOG) {
    rows.push(await upsert(item, stripe));
  }

  const archived: string[] = [];
  for (const stale of ARCHIVED_KEYS) {
    const price = await findPrice(stale, stripe);
    if (price && price.active) {
      await stripe.prices.update(price.id, { active: false });
      archived.push(stale);
    }
    const product = await findProduct(stale, stripe);
    if (product && product.active) {
      await stripe.products.update(product.id, { active: false });
      if (!archived.includes(stale)) archived.push(stale);
    }
  }

  return { mode: live ? "live" : "test", rows, archived };
}

type S = ReturnType<typeof getStripe>;

async function findProduct(catalogKey: string, stripe: S) {
  const res = await stripe.products.search({
    query: `metadata['catalog_key']:'${catalogKey}'`,
    limit: 1,
  });
  return res.data[0] ?? null;
}

async function findPrice(lookupKey: string, stripe: S) {
  const res = await stripe.prices.list({ lookup_keys: [lookupKey], limit: 1 });
  return res.data[0] ?? null;
}

async function upsert(item: CatalogItem, stripe: S): Promise<SeedRow> {
  let product = await findProduct(item.key, stripe);
  let action: SeedRow["action"] = "unchanged";

  if (!product) {
    product = await stripe.products.create({
      name: item.name,
      metadata: { catalog_key: item.key },
    });
    action = "created";
  } else if (product.name !== item.name) {
    product = await stripe.products.update(product.id, { name: item.name });
    if (action === "unchanged") action = "renamed";
  }

  let price = await findPrice(item.key, stripe);
  if (!price) {
    price = await stripe.prices.create({
      product: product.id,
      currency: "usd",
      unit_amount: item.amount,
      lookup_key: item.key,
      transfer_lookup_key: true,
      ...(item.recurring ? { recurring: { interval: item.recurring } } : {}),
    });
    action = "created";
  } else if (price.unit_amount !== item.amount) {
    const old = price;
    price = await stripe.prices.create({
      product: product.id,
      currency: "usd",
      unit_amount: item.amount,
      lookup_key: item.key,
      transfer_lookup_key: true,
      ...(item.recurring ? { recurring: { interval: item.recurring } } : {}),
    });
    await stripe.prices.update(old.id, { active: false });
    action = "repriced";
  }

  return {
    key: item.key,
    name: item.name,
    amount: item.amount,
    product: product.id,
    price: price.id,
    action,
  };
}
