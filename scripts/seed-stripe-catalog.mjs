// Seed the Stripe catalog (products + prices) idempotently.
//
//   node --env-file=.env.local scripts/seed-stripe-catalog.mjs
//
// Safe to re-run: products are matched by metadata.catalog_key, prices by lookup_key.
// Run it against whichever mode your STRIPE_SECRET_KEY points at (test sandbox now; live
// later). The app resolves prices by lookup_key at runtime (lib/stripe/prices.ts), so no
// ids need to be copied anywhere.

import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("STRIPE_SECRET_KEY not set. Run with: node --env-file=.env.local scripts/seed-stripe-catalog.mjs");
  process.exit(1);
}
const stripe = new Stripe(key);

// lookup_key, display name, amount (cents), recurring monthly?  Mirrors lib/pricing.ts.
const CATALOG = [
  { key: "plan_undergraduate", name: "The Undergraduate", amount: 19900, recurring: false },
  { key: "plan_graduate", name: "The Graduate", amount: 39900, recurring: false },
  { key: "plan_scholar", name: "The Scholar", amount: 59900, recurring: false },
  { key: "support_sixmonths", name: "6 Months Support", amount: 75000, recurring: false },
  { key: "support_annual", name: "Annual Support", amount: 120000, recurring: false },
  { key: "onboarding_whiteglove", name: "White Glove Onboarding", amount: 65000, recurring: false },
  { key: "hosting_basic", name: "Hosting - Basic", amount: 1999, recurring: true },
  { key: "hosting_plus", name: "Hosting - Plus", amount: 2999, recurring: true },
  { key: "hosting_pro", name: "Hosting - Pro", amount: 4999, recurring: true },
  { key: "hosting_max", name: "Hosting - Max", amount: 9900, recurring: true },
];

// lookup_keys renamed during development — archive the old prices/products so the catalog
// stays clean and priceIdFor never resolves a stale key. Safe no-op once they're gone.
const ARCHIVED_KEYS = ["plan_basic", "support_6mo"];

async function findProduct(catalogKey) {
  const res = await stripe.products.search({ query: `metadata['catalog_key']:'${catalogKey}'`, limit: 1 });
  return res.data[0] ?? null;
}

async function findPrice(lookupKey) {
  const res = await stripe.prices.list({ lookup_keys: [lookupKey], limit: 1 });
  return res.data[0] ?? null;
}

async function upsert(item) {
  let product = await findProduct(item.key);
  if (!product) {
    product = await stripe.products.create({ name: item.name, metadata: { catalog_key: item.key } });
  } else if (product.name !== item.name) {
    product = await stripe.products.update(product.id, { name: item.name });
  }

  let price = await findPrice(item.key);
  let created = false;
  if (!price) {
    price = await stripe.prices.create({
      product: product.id,
      currency: "usd",
      unit_amount: item.amount,
      lookup_key: item.key,
      transfer_lookup_key: true,
      ...(item.recurring ? { recurring: { interval: "month" } } : {}),
    });
    created = true;
  } else if (price.unit_amount !== item.amount) {
    // Prices are immutable; mint a new one and move the lookup_key to it.
    const old = price;
    price = await stripe.prices.create({
      product: product.id,
      currency: "usd",
      unit_amount: item.amount,
      lookup_key: item.key,
      transfer_lookup_key: true,
      ...(item.recurring ? { recurring: { interval: "month" } } : {}),
    });
    await stripe.prices.update(old.id, { active: false });
    created = true;
  }

  return { key: item.key, name: item.name, amount: item.amount, product: product.id, price: price.id, created };
}

const acct = await stripe.accounts.retrieve();
const live = key.startsWith("sk_live");
console.log(`Seeding catalog into ${live ? "LIVE" : "TEST"} mode — account ${acct.id}\n`);

const results = [];
for (const item of CATALOG) {
  results.push(await upsert(item));
}

// Archive any renamed/stale catalog entries.
for (const key of ARCHIVED_KEYS) {
  const price = await findPrice(key);
  if (price) await stripe.prices.update(price.id, { active: false });
  const product = await findProduct(key);
  if (product && product.active) await stripe.products.update(product.id, { active: false });
  if (price || product) console.log(`archived stale '${key}'`);
}

console.log("PRODUCT".padEnd(26) + "AMOUNT".padEnd(10) + "LOOKUP_KEY".padEnd(24) + "PRICE_ID");
console.log("-".repeat(96));
for (const r of results) {
  const amt = "$" + (r.amount / 100).toLocaleString("en-US");
  console.log(r.name.padEnd(26) + amt.padEnd(10) + r.key.padEnd(24) + r.price + (r.created ? "  (new)" : ""));
}
console.log("-".repeat(96));
console.log(`Done — ${results.length} products/prices ensured.`);
