import type { Metadata } from "next";
import Nav from "../components/Nav";
import { PageHero } from "../components/PageHero";
import { Footer } from "../components/Footer";
import ConsultationBooking from "./ConsultationBooking";
import { GraduationCap, Users, Building2, MessageSquare, CalendarCheck, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Book a Free Consultation or Try the Demo, The College Agent",
  description:
    "See The College Agent for yourself. Try the free interactive demo, or book a free consultation to get your questions answered. For students, parents, and schools.",
  keywords: [
    "college agent demo",
    "college agent consultation",
    "AI college assistant demo",
    "book a college agent consultation",
    "AI assistant for college students",
  ],
  alternates: { canonical: "https://thecollegeagent.ai/consultation" },
  openGraph: {
    title: "Book a Free Consultation or Try the Demo, The College Agent",
    description:
      "See The College Agent for yourself. Try the free interactive demo, or book a free consultation to get your questions answered.",
    url: "https://thecollegeagent.ai/consultation",
    images: [{ url: "https://thecollegeagent.ai/og-image.png", width: 1200, height: 630, alt: "The College Agent" }],
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://thecollegeagent.ai" },
    { "@type": "ListItem", position: 2, name: "Consultation", item: "https://thecollegeagent.ai/consultation" },
  ],
};

const AUDIENCES = [
  {
    icon: GraduationCap,
    title: "Students",
    desc: "Stay on top of every class, deadline, and exam. Your agent plans your week, quizzes you before tests, and drafts the emails you keep putting off.",
  },
  {
    icon: Users,
    title: "Parents",
    desc: "Give your student a four-year advantage and give yourself peace of mind. One system that keeps them organized, accountable, and career-ready from day one.",
  },
  {
    icon: Building2,
    title: "Schools & Organizations",
    desc: "Offer your students an AI advisor that scales. Perfect for advising offices, clubs, and programs. Book a consultation and we will tailor a rollout for your group.",
  },
];

export default function ConsultationPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Nav />
      <main style={{ paddingTop: 72, minHeight: "100vh" }}>

        {/* HERO */}
        <PageHero
          label="See It For Yourself"
          title="Try the demo, or book a free consultation."
          sub="Two easy ways to meet The College Agent. Jump into a live demo right now, no signup needed, or grab a free call and we will walk you through exactly how it fits your situation. Great for students, parents, and schools."
          primary={{ label: "Try the Free Demo", href: "/demo" }}
          secondary={{ label: "Book a Consultation", href: "#book" }}
        />

        {/* TWO WAYS TO START */}
        <section style={{ background: "#fff", padding: "72px 0" }}>
          <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 24px" }}>
            <div style={{ textAlign: "center", marginBottom: 44 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--green)", marginBottom: 14, display: "block" }}>Two Ways to Start</span>
              <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, color: "var(--navy)", letterSpacing: "-.025em" }}>
                Pick whatever feels easiest.
              </h2>
            </div>
            <div className="con-grid2">
              <div className="con-card">
                <div className="con-icon"><Sparkles size={22} strokeWidth={1.9} /></div>
                <h3>Try the demo now</h3>
                <p>
                  Chat with a live College Agent this second. No signup, no card. See how it plans a
                  week, studies with you, and drafts a professor email in under two minutes.
                </p>
                <a href="/demo" className="btn-green" style={{ marginTop: 4 }}>Try the Free Demo</a>
              </div>
              <div className="con-card">
                <div className="con-icon"><CalendarCheck size={22} strokeWidth={1.9} /></div>
                <h3>Book a consultation</h3>
                <p>
                  Want to talk it through first? Grab a free call. We will answer your questions and
                  show you exactly how the agent works for you, your student, or your school.
                </p>
                <a href="#book" className="btn-outline-dark" style={{ marginTop: 4 }}>Pick a Time</a>
              </div>
            </div>
          </div>
        </section>

        {/* WHO IT'S FOR */}
        <section style={{ background: "var(--cream2)", padding: "72px 0" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
            <div style={{ textAlign: "center", marginBottom: 44 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--green)", marginBottom: 14, display: "block" }}>Who It Is For</span>
              <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, color: "var(--navy)", letterSpacing: "-.025em" }}>
                Built for the whole college journey.
              </h2>
            </div>
            <div className="con-grid3">
              {AUDIENCES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="aud-card">
                  <div className="con-icon"><Icon size={22} strokeWidth={1.9} /></div>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WHAT A CONSULTATION COVERS */}
        <section style={{ background: "#fff", padding: "72px 0" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--green)", marginBottom: 14, display: "block" }}>What We Will Cover</span>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 34px)", fontWeight: 800, color: "var(--navy)", marginBottom: 20, letterSpacing: "-.025em" }}>
              A quick, no-pressure call.
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 18 }}>
              Bring your questions. We will show you the agent live, talk through how it would work for
              your classes or your student, and cover pricing, setup, and what happens after you sign up.
              No slides, no hard sell.
            </p>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 12 }}>
              {[
                "A live walkthrough of the agent doing real work",
                "How it connects to your calendar, email, and Canvas",
                "Pricing, the 7-day guarantee, and how setup works",
                "For schools and clubs: group rollouts and org codes",
              ].map((line) => (
                <li key={line} style={{ display: "flex", alignItems: "flex-start", gap: 11, fontSize: 15.5, lineHeight: 1.6, color: "var(--navy)" }}>
                  <span style={{ color: "var(--green)", marginTop: 2, flex: "0 0 auto" }}>
                    <MessageSquare size={17} strokeWidth={2.2} />
                  </span>
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* BOOKING */}
        <section id="book" style={{ background: "var(--cream2)", padding: "72px 0", scrollMarginTop: 72 }}>
          <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px" }}>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--green)", marginBottom: 14, display: "block" }}>Book Your Free Consultation</span>
              <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, color: "var(--navy)", letterSpacing: "-.025em", marginBottom: 12 }}>
                Grab a time that works for you.
              </h2>
              <p style={{ maxWidth: 560, margin: "0 auto", fontSize: 16, lineHeight: 1.7, color: "rgba(11,23,41,.66)" }}>
                Pick a slot below and you are set. Prefer to just try it? The{" "}
                <a href="/demo" style={{ color: "var(--green)", textDecoration: "underline" }}>free demo</a>{" "}
                is always open.
              </p>
            </div>
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(11,23,41,.07)", boxShadow: "0 8px 28px rgba(11,23,41,.06)", padding: 8, overflow: "hidden" }}>
              <ConsultationBooking />
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="dark-section" style={{ padding: "76px 0" }}>
          <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px", textAlign: "center" }}>
            <h2 style={{ fontSize: "clamp(26px, 3.4vw, 40px)", fontWeight: 800, color: "#fff", letterSpacing: "-.025em", marginBottom: 16 }}>
              The best way to get it is to see it.
            </h2>
            <p style={{ fontSize: 17, lineHeight: 1.7, color: "rgba(255,255,255,.7)", maxWidth: 560, margin: "0 auto 30px" }}>
              Two minutes in the demo tells you more than any pitch. Try it now, or book a call and we
              will show you around.
            </p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
              <a href="/demo" className="btn-green">Try the Free Demo</a>
              <a href="#book" className="btn-outline">Book a Consultation</a>
            </div>
          </div>
        </section>

      </main>

      <Footer />

      <style>{`
        .dark-section { background: var(--navy, #0b1729); }
        .con-grid2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        .con-grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .con-card, .aud-card {
          background: var(--cream2, #f8f7f4); border: 1px solid rgba(11,23,41,.07); border-radius: 16px;
          padding: 30px 28px; box-shadow: 0 8px 28px rgba(11,23,41,.04);
          display: flex; flex-direction: column; align-items: flex-start; gap: 12px;
        }
        .con-card { background: #fff; }
        .con-icon {
          width: 46px; height: 46px; border-radius: 14px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: rgba(61,139,61,.1); color: var(--green);
        }
        .con-card h3, .aud-card h3 { font-size: 18px; font-weight: 800; color: var(--navy); letter-spacing: -.01em; }
        .con-card p, .aud-card p { font-size: 14.5px; line-height: 1.65; color: rgba(11,23,41,.66); margin: 0; }
        .con-card .btn-green, .con-card .btn-outline-dark { align-self: stretch; text-align: center; }
        .btn-green {
          display: inline-flex; align-items: center; justify-content: center;
          background: var(--green); color: #fff; font-size: 13px; font-weight: 700;
          letter-spacing: .08em; text-transform: uppercase; padding: 14px 30px;
          border-radius: 4px; box-shadow: 0 8px 24px rgba(61,139,61,.3);
          transition: filter .15s; border: none; cursor: pointer; text-decoration: none;
        }
        .btn-green:hover { filter: brightness(1.1); }
        .btn-outline {
          display: inline-flex; align-items: center; justify-content: center;
          background: transparent; color: #fff; font-size: 13px; font-weight: 700;
          letter-spacing: .08em; text-transform: uppercase; padding: 13px 30px;
          border-radius: 4px; border: 1.5px solid rgba(255,255,255,.35);
          transition: border-color .15s, background .15s; cursor: pointer; text-decoration: none;
        }
        .btn-outline:hover { border-color: #fff; background: rgba(255,255,255,.07); }
        .btn-outline-dark {
          display: inline-flex; align-items: center; justify-content: center;
          background: transparent; color: var(--navy); font-size: 13px; font-weight: 700;
          letter-spacing: .08em; text-transform: uppercase; padding: 13px 30px;
          border-radius: 4px; border: 1.5px solid rgba(11,23,41,.25);
          transition: border-color .15s; cursor: pointer; text-decoration: none;
        }
        .btn-outline-dark:hover { border-color: var(--navy); }
        @media (max-width: 820px) {
          .con-grid3 { grid-template-columns: 1fr; }
          .con-grid2 { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}
