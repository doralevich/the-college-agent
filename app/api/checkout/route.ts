import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ApiError, json, route } from "@/lib/http";

// PLACEHOLDER checkout. Flips the student's entitlement to "active" (= paid). This is
// the exact seam a real Stripe webhook will later fill (source 'stripe', by email) —
// `can_create_agent()` and the dashboard already key off entitlements.status.
export const POST = route(async () => {
  const { user } = await requireUser();
  const email = (user.email ?? "").toLowerCase();
  if (!email) throw new ApiError(400, "invalid_request", "No email on account");

  const db = createAdminClient();
  const { error } = await db.from("entitlements").upsert(
    {
      email,
      status: "active",
      source: "stripe",
      user_id: user.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "email" }
  );
  if (error) throw new ApiError(500, "db_error", error.message);

  return json({ ok: true });
});
