import { redirect } from "next/navigation";
import Nav from "../../components/Nav";
import { Footer } from "../../components/Footer";
import { getSession } from "@/lib/auth";
import { ambassadorByEmail } from "@/lib/ambassador";
import { AmbassadorDashboard } from "./AmbassadorDashboard";

export const dynamic = "force-dynamic";

// The gated ambassador home: their code, link, QR, live earnings, tier, W-9 status,
// and the toolkit. Sign-in is the same magic-link flow as students; access is simply
// "this email has an ambassador record."
export default async function AmbassadorDashboardPage() {
  const { user } = await getSession();
  if (!user) redirect("/login?next=/ambassador/dashboard");

  const amb = await ambassadorByEmail(user.email ?? "");

  return (
    <>
      <Nav />
      <main style={{ paddingTop: 142, minHeight: "100vh", background: "var(--cream2)" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px 100px" }}>
          {!amb ? (
            <NotAnAmbassador email={user.email ?? ""} />
          ) : amb.status !== "approved" ? (
            <PendingNotice name={amb.full_name} />
          ) : (
            <AmbassadorDashboard />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function NotAnAmbassador({ email }: { email: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid rgba(11,23,41,.08)", borderRadius: 16, padding: "40px 32px", textAlign: "center" }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--navy)", marginBottom: 10 }}>
        No ambassador account here yet.
      </h1>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: "rgba(11,23,41,.65)", maxWidth: 460, margin: "0 auto 22px" }}>
        You&apos;re signed in as {email}, and we don&apos;t have an ambassador application under that
        address. Want in? It takes two minutes.
      </p>
      <a href="/ambassador/apply" style={{ display: "inline-flex", background: "var(--green)", color: "#fff", fontSize: 13, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", padding: "13px 26px", borderRadius: 6, textDecoration: "none" }}>
        Apply to be an Ambassador
      </a>
    </div>
  );
}

function PendingNotice({ name }: { name: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid rgba(11,23,41,.08)", borderRadius: 16, padding: "40px 32px", textAlign: "center" }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--navy)", marginBottom: 10 }}>
        Application received, {name.split(" ")[0]}!
      </h1>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: "rgba(11,23,41,.65)", maxWidth: 480, margin: "0 auto" }}>
        We&apos;re reviewing it now. As soon as you&apos;re approved you&apos;ll get your personal
        coupon code and share link right here, and every sale it touches earns you a bounty.
      </p>
    </div>
  );
}
