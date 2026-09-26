import "server-only";
import type Stripe from "stripe";
import { getStripe } from "./client";
import { priceIdsFor } from "./prices";
import { PLAN_TIERS, lookupFor, tierForLookup, type BillingInterval } from "@/lib/pricing/intro-cutoff";

// The College Agent's own Stripe billing portal, so students can switch plans.
//
// WHY NOT THE DEFAULT PORTAL: this Stripe account is shared with ApolloClaw. Turning on plan
// switching in the account's default portal settings would list both products' plans to
// both products' customers. These configurations are created in code, are never the
// default, and list only our three plans - ApolloClaw's portal is untouched.
//
// ONE CONFIGURATION PER BILLING INTERVAL. A monthly student sees the three monthly plans, an
// annual student the three annual ones. Switching interval would reset the billing period and
// invoice immediately (billing_reason 'subscription_update'), which grants no allowance - a
// student could pay $500 and get no AI usage. Keeping each list to one interval rules it out.
//
// PLAN CHANGES START AT THE NEXT BILLING DATE (proration_behavior 'none'). Nothing is
// charged or refunded mid-period, and the new plan's allowance arrives with its first
// renewal invoice through the normal path (lib/plan-allowance.ts). The alternative -
// prorated charges with the allowance handed out immediately - lets a student upgrade, take
// the bigger allowance, downgrade for a prorated refund, and repeat.

const APP = "college-agent";

// Bump when the features below change, so existing configurations are updated in place.
const FEATURES_VERSION = "1";

function features(
  products: Stripe.BillingPortal.ConfigurationCreateParams.Features.SubscriptionUpdate.Product[]
): Stripe.BillingPortal.ConfigurationCreateParams.Features {
  return {
    invoice_history: { enabled: true },
    payment_method_update: { enabled: true },
    // Email is left out on purpose: entitlements are matched by email, and a student
    // changing it here would drift from the address they sign in with.
    customer_update: { enabled: true, allowed_updates: ["name", "address"] },
    // Matches the Terms: cancelling stops future charges and the agent stays live through
    // the period already paid for.
    subscription_cancel: { enabled: true, mode: "at_period_end" },
    subscription_update: {
      enabled: true,
      default_allowed_updates: ["price"],
      proration_behavior: "none",
      billing_cycle_anchor: "unchanged",
      products,
    },
  };
}

const memo = new Map<BillingInterval, string>();

/** The portal configuration id for students billed on this interval, created if missing. */
export async function portalConfigurationFor(interval: BillingInterval): Promise<string> {
  const cached = memo.get(interval);
  if (cached) return cached;

  const stripe = getStripe();
  const lookups = PLAN_TIERS.map((t) => lookupFor(t, interval));
  // priceIdsFor creates any plan price this Stripe account does not have yet.
  const priceIds = await priceIdsFor(lookups);
  const products = await Promise.all(
    priceIds.map(async (price) => {
      const p = await stripe.prices.retrieve(price);
      return { product: typeof p.product === "string" ? p.product : p.product.id, prices: [price] };
    })
  );

  const signature = `${FEATURES_VERSION}:${priceIds.join(",")}`;
  const metadata = { app: APP, interval, signature };
  const params = {
    name: `The College Agent (${interval})`,
    business_profile: {
      headline: "The College Agent",
      privacy_policy_url: "https://thecollegeagent.ai/privacy",
      terms_of_service_url: "https://thecollegeagent.ai/terms",
    },
    features: features(products),
    metadata,
  };

  let existing: Stripe.BillingPortal.Configuration | null = null;
  for await (const c of stripe.billingPortal.configurations.list({ active: true, limit: 100 })) {
    if (c.metadata?.app === APP && c.metadata?.interval === interval) {
      existing = c;
      break;
    }
  }

  let id: string;
  if (!existing) {
    id = (await stripe.billingPortal.configurations.create(params)).id;
  } else if (existing.metadata?.signature !== signature) {
    // A price or a feature changed since it was created: bring it up to date in place.
    id = (await stripe.billingPortal.configurations.update(existing.id, params)).id;
  } else {
    id = existing.id;
  }

  memo.set(interval, id);
  return id;
}

/**
 * The customer's live College Agent plan subscription, or null.
 *
 * Only a single-item subscription on one of our plan prices counts. Anything else - a legacy
 * price, a comped account, an ApolloClaw subscription on a shared customer - keeps the
 * default portal, exactly as before.
 */
export async function planSubscriptionFor(
  customerId: string
): Promise<{ id: string; interval: BillingInterval } | null> {
  const subs = await getStripe().subscriptions.list({ customer: customerId, status: "all", limit: 20 });
  for (const sub of subs.data) {
    if (!["active", "trialing", "past_due"].includes(sub.status)) continue;
    if (sub.items.data.length !== 1) continue;
    const plan = tierForLookup(sub.items.data[0].price.lookup_key);
    if (plan) return { id: sub.id, interval: plan.interval };
  }
  return null;
}
