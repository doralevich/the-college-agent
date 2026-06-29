// Single source of truth for the /build catalog — used by the SERVER to resolve each
// student choice to a Stripe price (by lookup_key) and to compute the amount actually
// charged. The Configurator UI owns its own display copy; these KEYS must stay in sync
// with the keys the Configurator emits in ConfigSummary.
//
// Amounts are in USD CENTS. $0 items have `lookupKey: null` and are never sent to Stripe.
// Plan/Support/Onboarding are ONE-TIME (billed on the subscription's first invoice);
// Hosting is the recurring MONTHLY line.

export type PlanKey = "undergraduate" | "graduate" | "scholar";
export type HostingKey = "basic" | "plus" | "pro" | "max";
export type SupportKey = "none" | "sixmonths" | "annual";
export type OnboardingKey = "standard" | "whiteglove";

export const CURRENCY = "usd";

export const PLANS: Record<PlanKey, { label: string; amount: number; lookupKey: string }> = {
  undergraduate: { label: "The Undergraduate", amount: 19900, lookupKey: "plan_undergraduate" },
  graduate:      { label: "The Graduate",      amount: 39900, lookupKey: "plan_graduate" },
  scholar:       { label: "The Scholar",       amount: 59900, lookupKey: "plan_scholar" },
};

export const HOSTING: Record<HostingKey, { label: string; amount: number; lookupKey: string }> = {
  basic: { label: "Basic", amount: 1999, lookupKey: "hosting_basic" },
  plus:  { label: "Plus",  amount: 2999, lookupKey: "hosting_plus" },
  pro:   { label: "Pro",   amount: 4999, lookupKey: "hosting_pro" },
  max:   { label: "Max",   amount: 9900, lookupKey: "hosting_max" },
};

export const SUPPORT: Record<SupportKey, { label: string; amount: number; lookupKey: string | null }> = {
  none:      { label: "No Support Plan",  amount: 0,      lookupKey: null },
  sixmonths: { label: "6 Months Support", amount: 75000,  lookupKey: "support_sixmonths" },
  annual:    { label: "Annual Support",   amount: 120000, lookupKey: "support_annual" },
};

export const ONBOARDING: Record<OnboardingKey, { label: string; amount: number; lookupKey: string | null }> = {
  standard:   { label: "Standard Onboarding",   amount: 0,     lookupKey: null },
  whiteglove: { label: "White Glove Onboarding", amount: 65000, lookupKey: "onboarding_whiteglove" },
};

export interface Selection {
  plan: PlanKey;
  hosting: HostingKey;
  support: SupportKey;
  onboarding: OnboardingKey;
}

// Validate that an untrusted object from the client names real catalog keys. Returns a
// typed Selection or throws — the server NEVER trusts client-supplied amounts, only keys.
export function parseSelection(input: unknown): Selection {
  const o = (input ?? {}) as Record<string, unknown>;
  const plan = o.plan as PlanKey;
  const hosting = o.hosting as HostingKey;
  const support = o.support as SupportKey;
  const onboarding = o.onboarding as OnboardingKey;
  if (!PLANS[plan]) throw new Error(`Unknown plan: ${String(plan)}`);
  if (!HOSTING[hosting]) throw new Error(`Unknown hosting: ${String(hosting)}`);
  if (!SUPPORT[support]) throw new Error(`Unknown support: ${String(support)}`);
  if (!ONBOARDING[onboarding]) throw new Error(`Unknown onboarding: ${String(onboarding)}`);
  return { plan, hosting, support, onboarding };
}

// Charged immediately (first invoice): one-time plan + support + onboarding, plus the
// first month of hosting. Hosting then recurs monthly.
export function dueToday(s: Selection): number {
  return PLANS[s.plan].amount + SUPPORT[s.support].amount + ONBOARDING[s.onboarding].amount + HOSTING[s.hosting].amount;
}

export function monthlyRecurring(s: Selection): number {
  return HOSTING[s.hosting].amount;
}

// All non-free lookup_keys for a selection, in invoice order (recurring hosting first,
// then the one-time items). Used to assemble Stripe Checkout line items.
export function lineItemLookupKeys(s: Selection): string[] {
  const keys = [HOSTING[s.hosting].lookupKey, PLANS[s.plan].lookupKey];
  if (SUPPORT[s.support].lookupKey) keys.push(SUPPORT[s.support].lookupKey!);
  if (ONBOARDING[s.onboarding].lookupKey) keys.push(ONBOARDING[s.onboarding].lookupKey!);
  return keys;
}

export function formatUSD(cents: number): string {
  const dollars = cents / 100;
  const hasCents = cents % 100 !== 0;
  return "$" + dollars.toLocaleString("en-US", {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  });
}
