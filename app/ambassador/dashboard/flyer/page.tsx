import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ambassadorByEmail } from "@/lib/ambassador";
import { FlyerSheet } from "./FlyerSheet";

export const dynamic = "force-dynamic";

// Personalized, printable QR flyer (PRD asset library): the ambassador's own /r link
// and $50-off code baked into a dorm-board-ready page. Browser print = the asset.
export default async function FlyerPage() {
  const { user } = await getSession();
  if (!user) redirect("/login?next=/ambassador/dashboard/flyer");
  const amb = await ambassadorByEmail(user.email ?? "");
  if (!amb || amb.status !== "approved" || !amb.referral_slug) redirect("/ambassador/dashboard");

  return <FlyerSheet code={amb.stripe_promo_code ?? ""} slug={amb.referral_slug} />;
}
