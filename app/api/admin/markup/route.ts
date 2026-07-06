import { agent37 } from "@/lib/agent37";
import { requirePlatformAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { MARKUP_RATE, markupMicros } from "@/lib/markup";
import { json, route } from "@/lib/http";

// Operator earnings from the hidden credit markup, for the /admin dashboard.
//
// Agent37 exposes no account-level billing endpoint (usage is per-instance, per-month), so
// we fan out getUsage across every instance and sum this month's managed spend — the bill
// Agent37 charges us. "Markup earned" is MARKUP_RATE of that bill (LLM + search + tools):
// the money we make on top of cost, realized as students consume their credits. Current
// calendar month (UTC), the only period the usage API returns cheaply.
//
// Admin-only and hit infrequently, so a live fan-out is fine; a box that errors counts as
// $0 rather than sinking the total.
export const GET = route(async () => {
  await requirePlatformAdmin();
  const db = createAdminClient();

  const { data: rows } = await db.from("agents").select("agent37_id");
  const ids = (rows ?? []).map((r) => r.agent37_id as string);

  const usages = await Promise.all(
    ids.map((id) =>
      agent37
        .getUsage(id)
        .then((u) => u.total_micros ?? 0)
        .catch(() => 0)
    )
  );
  const usageMicros = usages.reduce((sum, m) => sum + m, 0);

  const now = new Date();
  const period = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

  return json({
    period,
    rate: MARKUP_RATE,
    agents: ids.length,
    usage_micros: usageMicros, // raw Agent37 bill this month (our cost)
    markup_micros: markupMicros(usageMicros), // our cut on top
  });
});
