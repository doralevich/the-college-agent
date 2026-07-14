"use client";

import Script from "next/script";
import { useConsent } from "./CookieConsent";

// Meta (Facebook) Pixel — our live Pixel ID is the default so tracking works out of the box on
// deploy; NEXT_PUBLIC_META_PIXEL_ID overrides it (e.g. a separate test pixel) with no code change.
// A Pixel ID is a public identifier (exposed in the page source by design), not a secret.
// Mirrors the Google Analytics setup in app/layout.tsx (next/script, afterInteractive).
// Loads only after the visitor accepts cookies (GDPR/CCPA) — see CookieConsent.tsx.
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "1800539337578126";

export default function MetaPixel() {
  const consent = useConsent();
  if (!PIXEL_ID || consent !== "accepted") return null;
  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window,document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}

// Fire a standard Meta Pixel event (Lead, InitiateCheckout, Purchase, ...). Safe no-op when the
// pixel isn't loaded (no Pixel ID set, or fbq not ready), so callers never need to guard.
export function trackMeta(event: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const fbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq;
  if (typeof fbq === "function") {
    fbq("track", event, params);
  }
}

// Fire a CUSTOM Meta Pixel event (a name that isn't one of Meta's standard events, e.g. "Demo").
// Uses fbq('trackCustom', ...) so it shows up in Events Manager and can back a Custom Conversion.
// Same safe no-op guarding as trackMeta.
export function trackMetaCustom(event: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const fbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq;
  if (typeof fbq === "function") {
    fbq("trackCustom", event, params);
  }
}
