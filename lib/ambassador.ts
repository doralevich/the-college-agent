import "server-only";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * The whole program, on one switch. Currently OFF.
 *
 * Turned off while the economics are re-fitted: the bounty is $75 for the first 10 cleared
 * sales and $100 after, which was sized against a $599 one-time sale. The product is now
 * $25/month with the first two months discounted to zero by the ambassador's own coupon, so
 * a bounty pays out several times the revenue it brings in.
 *
 * Off means: the public pages 404, applications are refused, /r/{slug} links still resolve
 * but set no attribution cookie, and checkout stops reading one. NOTHING IS DELETED - the
 * tables, the approved ambassadors, their Stripe coupons and promotion codes and the admin
 * view all stay exactly as they are. Flipping this back to true restores the program whole.
 */
export const AMBASSADOR_PROGRAM_ENABLED = false;

// Ambassador program domain logic (July 2026 PRD). Business numbers are locked here:
// the coupon is worth $50 to the friend, the bounty is $75 for each of an ambassador's
// first 10 cleared sales and $100 after, tiers lock at clear time, and a sale clears after
// the same 7-day window as the product's refund policy.
//
// HOW THE $50 IS DELIVERED CHANGED when the $599 platform fee was retired. It used to be a
// single $50 off the first invoice, which was the invoice carrying that fee. Against a
// $25/month subscription a one-shot $50 coupon is worth only $25: Stripe caps the discount
// at the invoice total and does NOT carry the remainder forward, so half the ambassador's
// promise silently evaporated. It is now $25 off for two months - the same $50 to the
// friend, and every "$50 off" line in the flyer, dashboard and playbook stays true.
export const AMBASSADOR_COUPON_OFF_CENTS = Number(process.env.STRIPE_AMBASSADOR_COUPON_AMOUNT ?? 2500);
export const AMBASSADOR_COUPON_MONTHS = 2;
export const BOUNTY_TIER1_CENTS = 7500;
export const BOUNTY_TIER2_CENTS = 10000;
export const BOUNTY_TIER_THRESHOLD = 10; // lifetime cleared sales before the $100 tier
export const CLEARING_DAYS = 7;

export type AmbassadorRow = {
  id: string;
  full_name: string;
  email: string;
  status: string;
  stripe_promo_code: string | null;
  stripe_promo_code_id: string | null;
  stripe_coupon_id: string | null;
  referral_slug: string | null;
  cleared_referral_count: number;
  w9_on_file: boolean;
  payout_method: string | null;
  payout_handle: string | null;
  org_id: string | null;
  donate_share: boolean;
};

const AMB_COLS =
  "id, full_name, email, status, stripe_promo_code, stripe_promo_code_id, stripe_coupon_id, referral_slug, cleared_referral_count, w9_on_file, payout_method, payout_handle, org_id, donate_share";

export function bountyForClearedCount(lifetimeClearedBefore: number): number {
  return lifetimeClearedBefore < BOUNTY_TIER_THRESHOLD ? BOUNTY_TIER1_CENTS : BOUNTY_TIER2_CENTS;
}

export async function ambassadorBySlug(slug: string): Promise<AmbassadorRow | null> {
  const db = createAdminClient();
  const { data } = await db
    .from("ambassadors")
    .select(AMB_COLS)
    .eq("referral_slug", slug.toLowerCase())
    .eq("status", "approved")
    .maybeSingle();
  return (data as AmbassadorRow | null) ?? null;
}

export async function ambassadorByPromoCode(code: string): Promise<AmbassadorRow | null> {
  const db = createAdminClient();
  const { data } = await db
    .from("ambassadors")
    .select(AMB_COLS)
    .ilike("stripe_promo_code", code)
    .eq("status", "approved")
    .maybeSingle();
  return (data as AmbassadorRow | null) ?? null;
}

export async function ambassadorByEmail(email: string): Promise<AmbassadorRow | null> {
  const db = createAdminClient();
  const { data } = await db
    .from("ambassadors")
    .select(AMB_COLS)
    .eq("email", email.toLowerCase())
    .maybeSingle();
  return (data as AmbassadorRow | null) ?? null;
}

// URL slug from a name: "Jordan Lee" -> "jordan-lee", with a numeric suffix on collision.
async function uniqueSlug(fullName: string): Promise<string> {
  const db = createAdminClient();
  const base =
    fullName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 30) || "ambassador";
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    const { data } = await db.from("ambassadors").select("id").eq("referral_slug", candidate).maybeSingle();
    if (!data) return candidate;
  }
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}

// Promo code text from a first name: "JORDAN10". Digits re-roll on Stripe collision.
function codeCandidate(fullName: string, attempt: number): string {
  const first = (fullName.trim().split(/\s+/)[0] || "AGENT").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 12) || "AGENT";
  const digits = attempt === 0 ? "10" : String(10 + Math.floor(Math.random() * 89));
  return `${first}${digits}`;
}

// Approval: mint the ambassador's coupon + named promotion code (one object,
// both jobs: discount AND attribution), assign the /r/{slug} link, flip to approved.
// Idempotent: an already-approved ambassador with a code is returned as-is.
export async function approveAmbassador(stripe: Stripe, ambassadorId: string): Promise<AmbassadorRow> {
  const db = createAdminClient();
  const { data } = await db.from("ambassadors").select(AMB_COLS).eq("id", ambassadorId).maybeSingle();
  if (!data) throw new Error("ambassador not found");
  const amb = data as AmbassadorRow;

  if (amb.status === "approved" && amb.stripe_promo_code_id && amb.referral_slug) return amb;

  const slug = amb.referral_slug ?? (await uniqueSlug(amb.full_name));

  let couponId = amb.stripe_coupon_id;
  if (!couponId) {
    const coupon = await stripe.coupons.create({
      amount_off: AMBASSADOR_COUPON_OFF_CENTS,
      currency: "usd",
      // Two months rather than one shot: see AMBASSADOR_COUPON_OFF_CENTS above. Coupons
      // already minted for approved ambassadors keep their original shape - Stripe stores
      // them as created - so only ambassadors approved from here on get the split.
      duration: "repeating",
      duration_in_months: AMBASSADOR_COUPON_MONTHS,
      name: `Ambassador ${amb.full_name}`.slice(0, 40),
      metadata: { ambassador_id: amb.id },
    });
    couponId = coupon.id;
  }

  let promoCode = amb.stripe_promo_code;
  let promoCodeId = amb.stripe_promo_code_id;
  if (!promoCodeId) {
    for (let attempt = 0; attempt < 6 && !promoCodeId; attempt++) {
      const candidate = codeCandidate(amb.full_name, attempt);
      try {
        const promo = await stripe.promotionCodes.create({
          promotion: { type: "coupon", coupon: couponId },
          code: candidate,
          metadata: { ambassador_id: amb.id },
        });
        promoCode = promo.code;
        promoCodeId = promo.id;
      } catch (err) {
        // Code already exists in this Stripe account — re-roll the digits.
        if ((err as { code?: string }).code !== "resource_missing" && attempt === 5) throw err;
      }
    }
    if (!promoCodeId) throw new Error("could not allocate a unique promotion code");
  }

  const { data: updated, error } = await db
    .from("ambassadors")
    .update({
      status: "approved",
      referral_slug: slug,
      stripe_coupon_id: couponId,
      stripe_promo_code: promoCode,
      stripe_promo_code_id: promoCodeId,
    })
    .eq("id", amb.id)
    .select(AMB_COLS)
    .single();
  if (error) throw error;
  return updated as AmbassadorRow;
}
