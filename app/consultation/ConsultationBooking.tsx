"use client";

import { useEffect } from "react";
import { trackMeta, trackMetaCustom } from "@/app/components/MetaPixel";

// Embedded Calendly booking for the consultation landing page. Reuses the same Calendly
// David already links from the footer, so consultations land on his existing calendar.
// When a booking actually completes, Calendly posts a message to the parent window and we
// fire a Meta conversion (Schedule + a custom Consultation event) — no Calendly-side pixel
// setup needed. All Meta calls are no-ops until the Pixel is live, so this ships safely.

const CALENDLY_URL = "https://calendly.com/therealdaveo/apolloai";
const WIDGET_SRC = "https://assets.calendly.com/assets/external/widget.js";

type CalendlyGlobal = { initInlineWidgets?: () => void };

export default function ConsultationBooking() {
  useEffect(() => {
    // If Calendly is already loaded (e.g. client-side navigation back to this page), just
    // re-scan for the inline widget; otherwise load the script once.
    const cal = (window as unknown as { Calendly?: CalendlyGlobal }).Calendly;
    if (cal?.initInlineWidgets) {
      cal.initInlineWidgets();
    } else if (!document.querySelector(`script[src="${WIDGET_SRC}"]`)) {
      const script = document.createElement("script");
      script.src = WIDGET_SRC;
      script.async = true;
      document.body.appendChild(script);
    }

    function onMessage(e: MessageEvent) {
      if (
        e.origin === "https://calendly.com" &&
        (e.data as { event?: string })?.event === "calendly.event_scheduled"
      ) {
        trackMeta("Schedule");
        trackMetaCustom("Consultation");
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <div
      className="calendly-inline-widget"
      data-url={CALENDLY_URL}
      style={{ minWidth: 320, width: "100%", height: 700 }}
    />
  );
}
