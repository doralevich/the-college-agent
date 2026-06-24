import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next 16 renamed `middleware` -> `proxy` (nodejs runtime). This refreshes the
// Supabase auth session and guards the dashboard. The matcher is scoped to the
// dashboard surfaces ONLY, so every marketing route runs with zero auth overhead.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/login",
    "/reset-password",
    "/auth/callback",
    "/api/agents/:path*",
    "/api/admin/:path*",
    "/api/workspaces/:path*",
  ],
};
