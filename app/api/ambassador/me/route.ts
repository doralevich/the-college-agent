import { ApiError, json, readJson, route } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ambassadorByEmail } from "@/lib/ambassador";

// Self-service for a signed-in ambassador: read their own record + stats, and set
// their payout rail (PayPal or Venmo — Zelle intentionally unsupported, no records).

export const GET = route(async () => {
  const { user } = await requireUser();
  const amb = await ambassadorByEmail(user.email ?? "");
  if (!amb) throw new ApiError(404, "not_found", "No ambassador record for this account.");

  const db = createAdminClient();
  const [salesRes, payoutsRes, adjRes] = await Promise.all([
    db
      .from("ambassador_sales")
      .select("status, bounty_cents, payout_id, created_at, purchaser_email")
      .eq("ambassador_id", amb.id)
      .order("created_at", { ascending: false }),
    db
      .from("ambassador_payouts")
      .select("run_date, total_cents, status, payee_type")
      .eq("ambassador_id", amb.id)
      .eq("payee_type", "ambassador")
      .order("run_date", { ascending: false }),
    db
      .from("ambassador_ledger_adjustments")
      .select("amount_cents, applied_to_payout_id")
      .eq("ambassador_id", amb.id),
  ]);

  const sales = salesRes.data ?? [];
  const payouts = payoutsRes.data ?? [];
  const adjustments = adjRes.data ?? [];

  const pendingCount = sales.filter((s) => s.status === "pending" || s.status === "review").length;
  const clearedUnpaidCents = sales
    .filter((s) => s.status === "cleared" && !s.payout_id)
    .reduce((sum, s) => sum + ((s.bounty_cents as number | null) ?? 0), 0);
  const unappliedAdjCents = adjustments
    .filter((a) => !a.applied_to_payout_id)
    .reduce((sum, a) => sum + (a.amount_cents as number), 0);
  const paidCents = payouts
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + (p.total_cents as number), 0);

  // Individual signups, newest first, with the buyer's email masked: the ambassador
  // sees enough to recognize who converted without us leaking full addresses.
  const signups = sales.slice(0, 25).map((s) => {
    const email = String((s as { purchaser_email?: string | null }).purchaser_email ?? "");
    const [local = "", domain = ""] = email.split("@");
    const masked = email ? `${local.slice(0, 1)}***@${domain}` : "someone";
    return {
      when: s.created_at,
      who: masked,
      status: s.status,
      bounty_cents: s.bounty_cents ?? null,
    };
  });

  return json({
    signups,
    ambassador: {
      full_name: amb.full_name,
      status: amb.status,
      code: amb.stripe_promo_code,
      slug: amb.referral_slug,
      cleared_count: amb.cleared_referral_count,
      w9_on_file: amb.w9_on_file,
      payout_method: amb.payout_method,
      payout_handle: amb.payout_handle,
    },
    stats: {
      pendingCount,
      clearedUnpaidCents,
      unappliedAdjCents,
      paidCents,
    },
    payouts,
  });
});

export const POST = route(async (req) => {
  const { user } = await requireUser();
  const amb = await ambassadorByEmail(user.email ?? "");
  if (!amb) throw new ApiError(404, "not_found", "No ambassador record for this account.");

  const body = await readJson<{ method?: string; handle?: string }>(req);
  const method = body.method === "venmo" ? "venmo" : body.method === "paypal" ? "paypal" : null;
  const handle = (body.handle ?? "").trim().slice(0, 200);
  if (!method || !handle) throw new ApiError(400, "invalid_request", "Pick PayPal or Venmo and add your handle.");

  const db = createAdminClient();
  await db.from("ambassadors").update({ payout_method: method, payout_handle: handle }).eq("id", amb.id);
  return json({ ok: true });
});
