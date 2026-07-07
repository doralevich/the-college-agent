import crypto from "crypto";

// Meta Conversions API — server-side event delivery for Meta Ads. The Pixel ID defaults to our
// live pixel (matching the client), so the only thing left to activate server-side Purchase is
// the secret: it stays dormant until META_CAPI_ACCESS_TOKEN is set. Server-side Purchase is more
// reliable than the browser pixel (iOS / ad-blocker resilient) and is the right place to report a
// sale, since /build/success redirects before client JS runs.

const PIXEL_ID = process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID || "1800539337578126";
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
const API_VERSION = "v19.0";

// Meta requires PII to be SHA-256 hashed, lowercased and trimmed.
function hash(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

type PurchaseInput = {
  email: string;
  valueCents: number;
  currency: string;
  eventId: string; // stable dedup key (use the Stripe session id)
  clientIp?: string;
  userAgent?: string;
};

// Fire a server-side Purchase event. Throws on a non-OK response so callers can log it, but
// callers must treat it as best-effort and never block their own flow on it.
export async function sendMetaPurchase(input: PurchaseInput): Promise<void> {
  if (!PIXEL_ID || !ACCESS_TOKEN) return; // dormant until configured

  const url = `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${encodeURIComponent(
    ACCESS_TOKEN
  )}`;

  const body = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        action_source: "website",
        user_data: {
          ...(input.email ? { em: [hash(input.email)] } : {}),
          ...(input.clientIp ? { client_ip_address: input.clientIp } : {}),
          ...(input.userAgent ? { client_user_agent: input.userAgent } : {}),
        },
        custom_data: {
          value: Number((input.valueCents / 100).toFixed(2)),
          currency: input.currency,
        },
      },
    ],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Meta CAPI ${res.status}: ${text.slice(0, 300)}`);
  }
}
