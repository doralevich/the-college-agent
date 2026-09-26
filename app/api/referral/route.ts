import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrCreateReferralCode, REFERRAL_REWARD_CENTS } from "@/lib/referral";
import { json, route } from "@/lib/http";

// The student's referral card: their share link plus how it's going. Months earned
// counts rewarded referrals only — each one is a $25 credit already sitting on their
// Stripe balance.
export const GET = route(async (req) => {
  const { user } = await requireUser();
  const code = await getOrCreateReferralCode(user.id);

  const db = createAdminClient();
  const { data: rows } = await db
    .from("referrals")
    .select("status")
    .eq("referrer_user_id", user.id);
  const joined = (rows ?? []).length;
  const monthsEarned = (rows ?? []).filter((r) => r.status === "rewarded").length;

  const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "https://thecollegeagent.ai";
  // rewardCents rides along so the card states the real amount. The reward is a flat $25 on
  // both sides, which is a free month on Essentials but not on Plus or Pro - so the card says
  // "$25", not "a free month".
  return json({ code, url: `${origin}/build?ref=${code}`, joined, monthsEarned, rewardCents: REFERRAL_REWARD_CENTS });
});
