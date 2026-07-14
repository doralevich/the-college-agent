"use client";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { useConsent } from "./CookieConsent";

const GA_ID = "G-3KS91J2QK3";

function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined") return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gtagFn = (window as any).gtag as ((...args: unknown[]) => void) | undefined;
    if (typeof gtagFn !== "function") return;
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");
    gtagFn("event", "page_view", {
      page_path: url,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, searchParams]);

  return null;
}

export default function GoogleAnalytics() {
  // Load only after the visitor accepts cookies (GDPR/CCPA) — see CookieConsent.tsx.
  const consent = useConsent();
  if (consent !== "accepted") return null;
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            page_path: window.location.pathname,
            send_page_view: true
          });
        `}
      </Script>
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
    </>
  );
}
