import "server-only";
import { randomBytes } from "crypto";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// Referral plumbing shared by /api/referral (the student's card), the /build
// checkout (friend's first hosting month free), and the Stripe webhook (the
// referrer's $25 credit).

export const REFERRAL_REWARD_CENTS = 2500; // one month of hosting

// Fixed coupon id so we create it once per Stripe account and reuse it forever.
const REFERRAL_COUPON_ID = "ca_referral_month";

// Unambiguous alphabet (no 0/O/1/I/L) — codes get read off Instagram stories.
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

function generateCode(): string {
  const bytes = randomBytes(8);
  let out = "";
  for (let i = 0; i < 8; i++) out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return out;
}

// The student's stable share code, created on first ask. Retries once on the
// (astronomically unlikely) code collision.
export async function getOrCreateReferralCode(userId: string): Promise<string> {
  const db = createAdminClient();
  const { data: existing } = await db
    .from("referral_codes")
    .select("code")
    .eq("user_id", userId)
    .maybeSingle();
  if (existing?.code) return existing.code as string;

  for (let attempt = 0; attempt < 2; attempt++) {
    const code = generateCode();
    const { error } = await db.from("referral_codes").insert({ user_id: userId, code });
    if (!error) return code;
    // 23505 unique violation on user_id means a concurrent request won — reread.
    const { data: raced } = await db
      .from("referral_codes")
      .select("code")
      .eq("user_id", userId)
      .maybeSingle();
    if (raced?.code) return raced.code as string;
  }
  throw new Error("couldn't allocate a referral code");
}

// Resolve a share code to its owner, or null for unknown codes. Also returns the
// owner's email so checkout can refuse self-referrals.
export async function resolveReferralCode(
  code: string
): Promise<{ userId: string; email: string | null } | null> {
  const trimmed = code.trim().toUpperCase();
  if (!/^[A-Z0-9]{6,12}$/.test(trimmed)) return null;
  const db = createAdminClient();
  const { data } = await db.from("referral_codes").select("user_id").eq("code", trimmed).maybeSingle();
  if (!data?.user_id) return null;
  const userId = data.user_id as string;
  const { data: userRes } = await db.auth.admin.getUserById(userId);
  return { userId, email: (userRes?.user?.email ?? "").toLowerCase() || null };
}

// The $25-off-once coupon referred friends get at checkout — exactly their first
// month of hosting free ($499 plan stays intact). Created lazily on first use.
export async function ensureReferralCoupon(stripe: Stripe): Promise<string> {
  try {
    await stripe.coupons.retrieve(REFERRAL_COUPON_ID);
    return REFERRAL_COUPON_ID;
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code !== "resource_missing") throw err;
  }
  await stripe.coupons.create({
    id: REFERRAL_COUPON_ID,
    amount_off: REFERRAL_REWARD_CENTS,
    currency: "usd",
    duration: "once",
    name: "Referral: first month of hosting free",
  });
  return REFERRAL_COUPON_ID;
}
