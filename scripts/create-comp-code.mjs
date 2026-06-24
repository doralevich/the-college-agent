// Create a 100%-off "comp" promotion code for end-to-end testing without real charges.
//
//   node --env-file=.env.local scripts/create-comp-code.mjs
//   COMP_CODE=APOLLO-COMP node --env-file=.env.local scripts/create-comp-code.mjs   # pick your own code
//
// 100% off + duration:forever zeros BOTH the one-time fees and the monthly hosting.
// Idempotent: reuses the coupon/code if they already exist. Targets whichever mode the
// STRIPE_SECRET_KEY points at (run it once per mode). Limited to 25 redemptions; delete or
// deactivate it in the Dashboard (Product catalog → Coupons) once you're done testing.

import Stripe from "stripe";
import crypto from "node:crypto";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) { console.error("STRIPE_SECRET_KEY not set"); process.exit(1); }
const stripe = new Stripe(key);
const mode = key.startsWith("sk_live_") ? "LIVE" : "TEST";

// Reuse our comp coupon if it exists, else create it.
const coupons = await stripe.coupons.list({ limit: 100 });
let coupon = coupons.data.find(
  (c) => c.metadata?.purpose === "comp_test" && c.percent_off === 100 && c.duration === "forever" && c.valid
);
if (!coupon) {
  coupon = await stripe.coupons.create({
    percent_off: 100,
    duration: "forever",
    name: "Comp — internal testing (100% off)",
    metadata: { purpose: "comp_test" },
  });
}

const code = process.env.COMP_CODE || "COMP-" + crypto.randomBytes(4).toString("hex").toUpperCase();
const existing = await stripe.promotionCodes.list({ code, limit: 1 });
let promo = existing.data[0];
if (!promo) {
  promo = await stripe.promotionCodes.create({
    promotion: { type: "coupon", coupon: coupon.id }, // dahlia API nests the coupon here
    code,
    max_redemptions: 25,
    active: true,
    metadata: { purpose: "comp_test" },
  });
}

console.log(`\n${mode} comp code ready:  ${promo.code}`);
console.log(`  coupon: ${coupon.id} (100% off, forever)`);
console.log(`  active: ${promo.active} | max_redemptions: ${promo.max_redemptions} | times_redeemed: ${promo.times_redeemed}`);
console.log(`\nEnter "${promo.code}" in the promo box at checkout → total becomes $0 (one-time + monthly).`);
