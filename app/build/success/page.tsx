import { redirect } from "next/navigation";
import Link from "next/link";
import BuildNav from "../../components/BuildNav";
import { getStripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { findOrCreateAuthUser } from "@/lib/auth/find-or-create-user";

// Stripe redirects here after a successful Checkout. We use the session_id to
// resolve the student's email, find-or-create their auth account (idempotent
// with the webhook), and immediately redirect them through a fresh magic-link
// URL straight onto /dashboard — no email click required. The webhook still
// runs in parallel to handle entitlements + the "your account is ready" email,
// but it no longer gates the student's first visit to the dashboard.
//
// Server Component so the magic-link generation never reaches the browser.

type Props = {
  searchParams: Promise<{ session_id?: string }>;
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thecollegeagent.ai";

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { session_id } = await searchParams;

  if (session_id) {
    const target = await autoSignInUrl(session_id);
    if (target) redirect(target);
  }

  // Fallback: render the static success card and let the student click through.
  // This is reached when (a) no session_id arrived, (b) Stripe lookup failed,
  // (c) email missing from the session, or (d) magic-link generation failed —
  // in every case /dashboard's own auth proxy handles the sign-in prompt.
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

// Returns a magic-link URL that signs the student in and lands them on the
// dashboard, or null if anything along the way failed (caller falls back to
// the static success card).
async function autoSignInUrl(sessionId: string): Promise<string | null> {
  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const email =
      (session.customer_email || session.customer_details?.email || "").trim().toLowerCase();
    if (!email) return null;

    const firstName = ((session.metadata?.first_name as string | undefined) || "").trim() || null;
    const lastName = ((session.metadata?.last_name as string | undefined) || "").trim() || null;

    const db = createAdminClient();
    const { userId } = await findOrCreateAuthUser(db, email, firstName, lastName);
    if (!userId) return null;

    const { data: linkData, error } = await db.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo: `${SITE_URL}/dashboard` },
    });
    if (error) {
      console.error("[build/success] generateLink failed", error.message);
      return null;
    }
    return linkData?.properties?.action_link ?? null;
  } catch (err) {
    console.error("[build/success] auto sign-in resolution failed", err);
    return null;
  }
}
