import type { Metadata } from "next";
import Link from "next/link";
import Nav from "../components/Nav";
import { Footer } from "../components/Footer";
import ThankYouTracking from "./ThankYouTracking";
import { CheckCircle2 } from "lucide-react";

// Consultation confirmation page. Calendly redirects here after a completed booking, and the
// conversion event fires on load (see ThankYouTracking). noindex — it is a confirmation page,
// not content, and should stay out of search and out of the sitemap.
export const metadata: Metadata = {
  title: "You're booked, The College Agent",
  description: "Your consultation is confirmed.",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://thecollegeagent.ai/thank-you" },
};

export default function ThankYouPage() {
  return (
    <>
      <Nav />
      <ThankYouTracking />
      <main style={{ paddingTop: 72, minHeight: "100vh", background: "var(--cream2)", display: "flex", flexDirection: "column" }}>
        <section style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 24px" }}>
          <div style={{ maxWidth: 600, width: "100%", textAlign: "center", background: "#fff", border: "1px solid rgba(11,23,41,.07)", borderRadius: 20, boxShadow: "0 12px 40px rgba(11,23,41,.06)", padding: "56px 40px" }}>
            <div style={{ width: 68, height: 68, borderRadius: "50%", background: "rgba(61,139,61,.1)", color: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
              <CheckCircle2 size={38} strokeWidth={2} />
            </div>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--green)", display: "block", marginBottom: 12 }}>
              You are all set
            </span>
            <h1 style={{ fontSize: "clamp(26px, 3.4vw, 38px)", fontWeight: 800, color: "var(--navy)", letterSpacing: "-.025em", marginBottom: 14 }}>
              Your consultation is booked.
            </h1>
            <p style={{ fontSize: 16.5, lineHeight: 1.7, color: "rgba(11,23,41,.7)", marginBottom: 26 }}>
              Check your email for the calendar invite and confirmation. We are looking forward to
              showing you around. If you ever need to reschedule, the links are right in that email.
            </p>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: "rgba(11,23,41,.6)", marginBottom: 30 }}>
              Want a head start? Try the free demo now and bring your questions to the call.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
              <Link href="/demo" className="btn-green">Try the Free Demo</Link>
              <Link href="/" className="btn-outline-dark">Back to Home</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />

      <style>{`
        .btn-green {
          display: inline-flex; align-items: center; justify-content: center;
          background: var(--green); color: #fff; font-size: 13px; font-weight: 700;
          letter-spacing: .08em; text-transform: uppercase; padding: 14px 30px;
          border-radius: 4px; box-shadow: 0 8px 24px rgba(61,139,61,.3);
          transition: filter .15s; border: none; cursor: pointer; text-decoration: none;
        }
        .btn-green:hover { filter: brightness(1.1); }
        .btn-outline-dark {
          display: inline-flex; align-items: center; justify-content: center;
          background: transparent; color: var(--navy); font-size: 13px; font-weight: 700;
          letter-spacing: .08em; text-transform: uppercase; padding: 13px 30px;
          border-radius: 4px; border: 1.5px solid rgba(11,23,41,.25);
          transition: border-color .15s; cursor: pointer; text-decoration: none;
        }
        .btn-outline-dark:hover { border-color: var(--navy); }
      `}</style>
    </>
  );
}
