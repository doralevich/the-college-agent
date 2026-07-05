import type { Metadata } from "next";
import Nav from "../components/Nav";
import { Footer } from "../components/Footer";
import { OrgApplyForm } from "./OrgApplyForm";

export const metadata: Metadata = {
  title: "Orgs & Fundraising, The College Agent",
  description:
    "Turn your club, team, chapter, or cause into a fundraiser: your members share The College Agent and part of every sale goes to the group.",
  alternates: { canonical: "https://thecollegeagent.ai/orgs" },
  openGraph: {
    title: "Orgs & Fundraising, The College Agent",
    description: "Part of every sale your members drive goes to your group. A fundraiser that runs itself.",
    url: "https://thecollegeagent.ai/orgs",
    images: [{ url: "/og-image.jpg", width: 1200, height: 1200, alt: "The College Agent" }],
  },
};

// Org / charity partner landing (PRD): two modes — the group keeps its split as a
// fundraiser, or a student ambassador donates their own share to a vetted cause.
export default function OrgsPage() {
  return (
    <>
      <Nav />
      <main style={{ paddingTop: 100, minHeight: "100vh", background: "var(--cream2)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px 100px" }}>
          <div style={{ textAlign: "center", marginBottom: 34 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--green)" }}>
              Orgs &amp; Fundraising
            </span>
            <h1 style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 800, color: "var(--navy)", letterSpacing: "-.02em", margin: "10px 0 12px" }}>
              A fundraiser that runs itself.
            </h1>
            <p style={{ fontSize: 15.5, lineHeight: 1.75, color: "rgba(11,23,41,.65)", maxWidth: 560, margin: "0 auto" }}>
              Your members become College Agent ambassadors with an org code, and part of every
              sale they drive goes straight to your club, team, chapter, or cause. No candy bars,
              no car washes, no chasing people for $5.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14, marginBottom: 34 }}>
            {[
              { title: "Group fundraiser", desc: "Your members share their links; the org's split of every cleared sale accrues to the group and pays out with the bi-weekly runs." },
              { title: "Donate your share", desc: "Individual ambassadors can route their own bounty to a cause they care about instead. Every sale becomes a donation." },
              { title: "Zero admin", desc: "Tracking, clearing, and payout math are automatic. You see totals; we send the money." },
            ].map((c) => (
              <div key={c.title} style={{ background: "#fff", border: "1px solid rgba(11,23,41,.08)", borderRadius: 14, padding: "20px 22px" }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--navy)", marginBottom: 8 }}>{c.title}</h3>
                <p style={{ fontSize: 13.5, lineHeight: 1.65, color: "rgba(11,23,41,.62)", margin: 0 }}>{c.desc}</p>
              </div>
            ))}
          </div>

          <OrgApplyForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
