"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BuildNav from "../../components/BuildNav";

// Stripe redirects here after a successful Checkout. Fulfillment (entitlement → active,
// confirmation email) happens asynchronously in the webhook, so this page just confirms
// and auto-routes to the dashboard a few seconds later. The dashboard gates on
// entitlement either way, so even if the webhook hasn't landed yet, the student lands
// on the right surface for whatever state we're in.
export default function CheckoutSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.replace("/dashboard"), 3000);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <>
      <BuildNav />
      <main style={{ paddingTop: 72, minHeight: "78vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--cream)" }}>
        <div style={{ maxWidth: 540, margin: "0 auto", padding: "60px 24px", textAlign: "center" }}>
          <div
            style={{
              width: 64, height: 64, borderRadius: "50%", background: "rgba(61,139,61,.12)",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px",
              color: "var(--green)", fontSize: 30, fontWeight: 800,
            }}
          >
            ✓
          </div>
          <h1 style={{ fontSize: "clamp(26px, 3.5vw, 38px)", fontWeight: 800, letterSpacing: "-.02em", color: "var(--navy)", marginBottom: 14 }}>
            Payment received
          </h1>
          <p style={{ fontSize: 15, color: "rgba(11,23,41,.6)", lineHeight: 1.7, marginBottom: 32, maxWidth: 440, marginLeft: "auto", marginRight: "auto" }}>
            Your College Agent order is confirmed. We&apos;re taking you to your dashboard so you
            can finish setup and meet your agent. A confirmation email is on its way.
          </p>
          <Link href="/dashboard" className="btn-purple" style={{ fontSize: 14, padding: "16px 40px", borderRadius: 8, display: "inline-block" }}>
            Continue to Dashboard →
          </Link>
          <p style={{ marginTop: 16, fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(11,23,41,.35)", letterSpacing: ".04em" }}>
            Redirecting automatically in a few seconds...
          </p>
        </div>
      </main>
    </>
  );
}
