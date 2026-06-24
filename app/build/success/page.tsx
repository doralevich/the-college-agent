import Link from "next/link";
import BuildNav from "../../components/BuildNav";

// Stripe redirects here after a successful Checkout. Fulfillment (order -> paid,
// entitlement -> active, confirmation email) happens asynchronously in the webhook, so
// this page just confirms and points to the dashboard. The webhook usually lands within
// a second or two; the dashboard gates on entitlement either way.
export default function CheckoutSuccessPage() {
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
            Your College Agent order is confirmed. We&apos;re setting up your account now. Next,
            complete a quick onboarding and your agent goes live automatically. A confirmation
            email is on its way.
          </p>
          <Link href="/dashboard" className="btn-purple" style={{ fontSize: 14, padding: "16px 40px", borderRadius: 8, display: "inline-block" }}>
            Go to your dashboard →
          </Link>
          <p style={{ marginTop: 16, fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(11,23,41,.35)", letterSpacing: ".04em" }}>
            Hosting renews monthly. Manage or cancel anytime from your dashboard.
          </p>
        </div>
      </main>
    </>
  );
}
