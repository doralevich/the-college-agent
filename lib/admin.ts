import "server-only";
import { requireUser } from "@/lib/auth";
import { isAdminEmail } from "@/config/admins";
import { ApiError } from "@/lib/http";

// The auth preamble every /api/admin route shares: authenticate, then enforce that the
// caller is a platform admin (by email). Returns the authenticated user/client so the
// handler can go on — though admin routes generally use the service-role client for the
// cross-tenant reads RLS would otherwise hide.
export async function requirePlatformAdmin() {
  const { supabase, user } = await requireUser();
  if (!isAdminEmail(user.email)) {
    // 403 (not 404): the caller is already authenticated, and these routes are only
    // ever hit by the gated /admin client. The route's *existence* isn't a secret to a
    // logged-in user the way the /admin page is, so a clear Forbidden is fine here.
    throw new ApiError(403, "forbidden", "Admin access required");
  }
  return { supabase, user };
}
