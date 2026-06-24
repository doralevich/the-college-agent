import "server-only";
import { createClient } from "@supabase/supabase-js";

// Service-role client — BYPASSES RLS. Server-only; the key never reaches the
// browser (this module is `server-only` and imported only by server code).
//
// Used for trusted server-side reads/writes of an ALREADY-authenticated user's
// OWN rows where the SSR + RLS auth context is unreliable — specifically the
// dashboard workspace bootstrap during a Server Component render, where the
// user-scoped client's PostgREST calls don't reliably carry the JWT, so RLS
// (correctly) returns nothing. All mutations and the public /api/** routes keep
// using the user-scoped, RLS-enforced client — this is bootstrap only.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
