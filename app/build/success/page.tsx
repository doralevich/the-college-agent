import { redirect } from "next/navigation";
import Link from "next/link";
import BuildNav from "../../components/BuildNav";

// Stripe redirects here after a successful Checkout. We immediately hand off
// to /api/auth/post-checkout, which resolves the customer, find-or-creates
// their auth.users row, runs verifyOtp on a server-side cookie client to
// set the Supabase session cookies, and 302s to /dashboard.
//
// All of that requires writable cookies, which Route Handlers have but
// Server Components don't — hence the bounce instead of doing the work here.

type Props = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { session_id } = await searchParams;
  if (session_id) {
    redirect(`/api/auth/post-checkout?session_id=${encodeURIComponent(session_id)}`);
  }

  // No session_id (someone hit the URL directly) — fall back to the static
  // success card. /dashboard's existing auth gate handles the sign-in prompt.
  return (
    <>
      <BuildNav />
      <main
        style={{
          paddingTop: 72,
          minHeight: "78vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--cream)",
        }}
      >
        <div style={{ maxWidth: 540, margin: "0 auto", padding: "60px 24px", textAlign: "center" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "rgba(61,139,61,.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
              color: "var(--green)",
              fontSize: 30,
              fontWeight: 800,
            }}
          >
            ✓
          </div>
          <h1
            style={{
              fontSize: "clamp(26px, 3.5vw, 38px)",
              fontWeight: 800,
              letterSpacing: "-.02em",
              color: "var(--navy)",
              marginBottom: 14,
            }}
          >
            Payment received
          </h1>
          <p
            style={{
              fontSize: 15,
              color: "rgba(11,23,41,.6)",
              lineHeight: 1.7,
              marginBottom: 32,
              maxWidth: 440,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Your College Agent order is confirmed. Continue to your dashboard to finish setup and meet
            your agent. A confirmation email is on its way.
          </p>
          <Link
            href="/dashboard"
            className="btn-purple"
            style={{ fontSize: 14, padding: "16px 40px", borderRadius: 8, display: "inline-block" }}
          >
            Continue to Dashboard →
          </Link>
        </div>
      </main>
    </>
  );
}
