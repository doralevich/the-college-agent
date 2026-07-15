import { ApiError, json, readJson, route } from "@/lib/http";
import { requireUser, assertStepUp } from "@/lib/auth";
import { isAdminEmail } from "@/config/admins";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { getStripe } from "@/lib/stripe/client";
import { approveAmbassador } from "@/lib/ambassador";
import { sendAmbassadorWelcomeEmail } from "@/lib/email/ambassador-welcome";

// Admin controls for the ambassador program: approve applicants (mints the Stripe
// promo code + /r link), suspend, W-9 flag, payout details, fraud-review decisions,
// and marking queued payouts paid AFTER the human actually sends the money.
// Releasing funds is never automated (PRD automation boundary).

async function requireAdmin() {
  const { supabase, user } = await requireUser();
  // 404 (not 403) here so this route never confirms its own existence to a non-admin.
  if (!isAdminEmail(user.email)) throw new ApiError(404, "not_found", "Not found");
  // Same enforced second factor as every other admin surface.
  await assertStepUp(supabase);
  return user;
}

export const GET = route(async () => {
  await requireAdmin();
  const db = createAdminClient();

  const [ambassadors, reviewSales, recentSales, payouts] = await Promise.all([
    db.from("ambassadors").select("*").order("created_at", { ascending: false }).limit(200),
    db.from("ambassador_sales").select("*").eq("status", "review").order("created_at", { ascending: false }),
    db.from("ambassador_sales").select("*").order("created_at", { ascending: false }).limit(50),
    db.from("ambassador_payouts").select("*").order("created_at", { ascending: false }).limit(100),
  ]);

  return json({
    ambassadors: ambassadors.data ?? [],
    reviewSales: reviewSales.data ?? [],
    recentSales: recentSales.data ?? [],
    payouts: payouts.data ?? [],
  });
});

type Body = {
  action:
    | "approve"
    | "suspend"
    | "set_w9"
    | "set_payout"
    | "release_sale"
    | "reject_sale"
    | "mark_paid";
  id: string;
  w9?: boolean;
  method?: string;
  handle?: string;
};

export const POST = route(async (req) => {
  const user = await requireAdmin();
  const body = await readJson<Body>(req);
  const db = createAdminClient();

  // Audit the admin action (approve/suspend/payout/fraud-review) — money + status changes.
  await logAudit({ actorEmail: user.email, action: `ambassador.${body.action}`, target: body.id, req });

  switch (body.action) {
    case "approve": {
      const amb = await approveAmbassador(getStripe(), body.id);
      // Welcome email with their code, link, dashboard, and where the assets live.
      // Best-effort: approval stands even if delivery hiccups.
      if (amb.stripe_promo_code && amb.referral_slug) {
        await sendAmbassadorWelcomeEmail({
          email: amb.email,
          fullName: amb.full_name,
          code: amb.stripe_promo_code,
          slug: amb.referral_slug,
        });
      }
      return json({ ok: true, ambassador: amb });
    }
    case "suspend": {
      await db.from("ambassadors").update({ status: "suspended" }).eq("id", body.id);
      return json({ ok: true });
    }
    case "set_w9": {
      await db.from("ambassadors").update({ w9_on_file: body.w9 === true }).eq("id", body.id);
      return json({ ok: true });
    }
    case "set_payout": {
      const method = body.method === "venmo" ? "venmo" : "paypal";
      await db
        .from("ambassadors")
        .update({ payout_method: method, payout_handle: (body.handle ?? "").trim().slice(0, 200) })
        .eq("id", body.id);
      return json({ ok: true });
    }
    // Fraud review verdicts. Releasing sends the sale back through the normal clearing
    // path (clears immediately on the next hourly run, keeping tier counting sequential).
    case "release_sale": {
      await db
        .from("ambassador_sales")
        .update({ status: "pending", clears_at: new Date().toISOString(), review_reason: null })
        .eq("id", body.id)
        .eq("status", "review");
      return json({ ok: true });
    }
    case "reject_sale": {
      await db.from("ambassador_sales").update({ status: "reversed" }).eq("id", body.id).eq("status", "review");
      return json({ ok: true });
    }
    case "mark_paid": {
      await db
        .from("ambassador_payouts")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("id", body.id)
        .in("status", ["queued", "held_no_w9"]);
      return json({ ok: true });
    }
    default:
      throw new ApiError(400, "invalid_request", "Unknown action");
  }
});
