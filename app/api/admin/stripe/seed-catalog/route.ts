import { requirePlatformAdmin } from "@/lib/admin";
import { json, route } from "@/lib/http";
import { seedStripeCatalog } from "@/lib/stripe/seed-catalog";

// Admin-only one-click sync that brings the Stripe catalog in line with lib/pricing.ts.
// Mirrors scripts/seed-stripe-catalog.mjs so we don't need shell access in prod — the
// admin can fix lookup_key drift from the UI when prices are edited in the dashboard.
export const POST = route(async () => {
  await requirePlatformAdmin();
  const result = await seedStripeCatalog();
  return json(result);
});
