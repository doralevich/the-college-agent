"use client";

import { useEffect } from "react";
import { trackMeta, trackMetaCustom } from "@/app/components/MetaPixel";

// Fires the consultation conversion once, when the thank-you page loads. This page is only
// reached after Calendly redirects here on a completed booking, so a load equals a confirmed
// consultation. The Meta pixel's inline init defines a queueing fbq stub, but on a fresh page
// load our effect can run a tick before that script executes, so we retry briefly until fbq
// exists rather than no-op and lose the conversion. All calls are no-ops until the Pixel is live.
export default function ThankYouTracking() {
  useEffect(() => {
    let fired = false;
    const deadline = Date.now() + 6000;

    function fire(): boolean {
      if (fired) return true;
      const fbq = (window as unknown as { fbq?: unknown }).fbq;
      if (typeof fbq === "function") {
        trackMeta("Schedule");
        trackMetaCustom("Consultation");
        fired = true;
      }
      return fired;
    }

    if (fire()) return;
    const interval = setInterval(() => {
      if (fire() || Date.now() > deadline) clearInterval(interval);
    }, 300);
    return () => clearInterval(interval);
  }, []);

  return null;
}
