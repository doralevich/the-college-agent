"use client";

import { useEffect } from "react";

// Embedded Calendly booking for the consultation landing page. Reuses the same Calendly David
// already links from the footer. The Meta conversion fires on the /thank-you page that Calendly
// redirects to after a completed booking (see app/thank-you), so there is intentionally no
// tracking here — keeping it in one place avoids double-counting a single booking.

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
  }, []);

  return (
    <div
      className="calendly-inline-widget"
      data-url={CALENDLY_URL}
      style={{ minWidth: 320, width: "100%", height: 700 }}
    />
  );
}
