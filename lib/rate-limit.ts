import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// Per-IP rate limiting for public (unauthenticated) endpoints, backed by the atomic
// `rate_limit_hit` Postgres function (migration 0020) so counts hold across Vercel's
// serverless instances. Fails OPEN on any limiter error — a limiter/DB hiccup must never
// take down signups or the contact form.

// Best-effort client IP. On Vercel the real client IP is the first entry of
// x-forwarded-for; x-real-ip is a fallback. "unknown" buckets everyone together, which is
// the safe (stricter) degradation.
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

// Returns true if the request is ALLOWED, false if the caller has exceeded `max` in the
// window. Logs when a caller is limited so hits are visible in Vercel logs.
export async function limit(
  req: Request,
  endpoint: string,
  { max, windowSeconds }: { max: number; windowSeconds: number }
): Promise<boolean> {
  const ip = clientIp(req);
  try {
    const db = createAdminClient();
    const { data, error } = await db.rpc("rate_limit_hit", {
      p_bucket: `${endpoint}:${ip}`,
      p_max: max,
      p_window_seconds: windowSeconds,
    });
    if (error) {
      console.error("[rate-limit] rpc error", endpoint, error.message);
      return true; // fail open
    }
    const allowed = data === true;
    if (!allowed) console.warn("[rate-limit] blocked", endpoint, ip);
    return allowed;
  } catch (e) {
    console.error("[rate-limit] error", endpoint, e);
    return true; // fail open
  }
}

// Standard 429 body for a limited request.
export function tooManyRequests(): Response {
  return new Response(
    JSON.stringify({ error: "Too many requests. Please slow down and try again in a minute." }),
    { status: 429, headers: { "content-type": "application/json" } }
  );
}
