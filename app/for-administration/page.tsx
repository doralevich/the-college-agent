import type { Metadata } from "next";
import Nav from "../components/Nav";
import { PageHero } from "../components/PageHero";
import { Footer } from "../components/Footer";
import { CalendarDays, Mail, FolderOpen, PartyPopper, Wallet, ClipboardList } from "lucide-react";

export const metadata: Metadata = {
  title: "AI Agents for College Administration & Staff, The College Agent",
  description:
    "A professional AI agent for admissions, advising, the registrar, student affairs, and every campus office. Scheduling, communications, documents, events, and reporting, handled.",
  keywords: [
    "AI for college administration",
    "AI assistant for university staff",
    "higher ed administrative AI",
    "AI for admissions office",
    "AI for registrar",
    "campus office AI assistant",
  ],
  alternates: { canonical: "https://thecollegeagent.ai/for-administration" },
  openGraph: {
    title: "AI Agents for College Administration & Staff",
    description:
      "A professional AI agent for admissions, advising, the registrar, student affairs, and every campus office. Scheduling, communications, documents, events, and reporting, handled.",
    url: "https://thecollegeagent.ai/for-administration",
    images: [{ url: "https://thecollegeagent.ai/og-image.png", width: 1200, height: 630, alt: "The College Agent" }],
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://thecollegeagent.ai" },
    { "@type": "ListItem", position: 2, name: "For Administration", item: "https://thecollegeagent.ai/for-administration" },
  ],
};

const CAPABILITIES = [
  {
    icon: CalendarDays,
    title: "Calendar & Scheduling",
    desc: "Office hours, committee meetings, advising appointments, and room bookings, coordinated across everyone's calendars without the email ping-pong.",
  },
  {
    icon: Mail,
    title: "Email & Communications",
    desc: "Responses to students and families, announcements, reminder campaigns, and follow-ups, drafted in your office's voice and ready to review.",
  },
  {
    icon: FolderOpen,
    title: "Documents & Records",
    desc: "Forms, files, and paperwork organized and findable. Summaries of long documents in seconds, and templates for the letters you write every week.",
  },
  {
    icon: PartyPopper,
    title: "Event Planning",
    desc: "Orientation, open houses, commencement, and everything between: run-of-show, vendor follow-ups, staffing lists, and day-of checklists.",
  },
  {
    icon: Wallet,
    title: "Budgets & Reporting",
    desc: "Expense tracking, purchase follow-ups, and the recurring reports leadership asks for, drafted from your numbers on schedule.",
  },
  {
    icon: ClipboardList,
    title: "Deadlines & Compliance",
    desc: "Filing dates, accreditation requirements, renewal windows, and required trainings, surfaced before they're urgent, never after.",
  },
];

export default function ForAdministrationPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Nav />
      <main style={{ paddingTop: 114, minHeight: "100vh" }}>

        {/* HERO */}
        <PageHero
          label="For Faculty, Administration & Staff"
          title="Run your office without the busywork."
          sub="A professional AI agent for professors, admissions, advising, the registrar, student affairs, and every campus office. It learns your role and your rhythms, then handles the scheduling, communications, documents, and deadlines that eat your week. Live in 30 minutes."
          primary={{ label: "Build a Professional Agent", href: "/build?plan=pro" }}
          secondary={{ label: "Book a Consultation", href: "/consultation" }}
        />

        {/* THE PROBLEM — copy on the left, the agent team at their laptop on the right.
            The image has a white background, so it sits on this white section only. */}
        <section style={{ background: "#fff", padding: "72px 0" }}>
          <div className="reality-row" style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
            <div style={{ flex: "1 1 460px", minWidth: 0 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--green)", marginBottom: 14, display: "block" }}>The Reality</span>
              <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, color: "var(--navy)", marginBottom: 20, letterSpacing: "-.025em" }}>
                Campus offices run on people who are stretched thin.
              </h2>
              <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 16 }}>
                The inbox never empties. The same questions arrive every day. Reports are due, events
                are coming, and the calendar is a negotiation. The work that actually serves students
                gets squeezed by the work that just keeps the office running.
              </p>
              <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(11,23,41,.7)" }}>
                The College Agent gives every professor and staff member a professional AI agent
                that knows their role, their office, and their school, and takes the busywork off
                their plate. Faculty use it for office hours, course logistics, and communications;
                offices use it to keep the whole operation moving.
              </p>
            </div>
            <div className="reality-art">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/agents/agent-admin-team.webp" alt="A team of College Agent robots working together at a laptop" />
              <div className="reality-caption">One agent per staff member. A whole office, covered.</div>
            </div>
          </div>
        </section>

        {/* CAPABILITIES */}
        <section style={{ background: "var(--cream2)", padding: "72px 0" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--green)", marginBottom: 14, display: "block" }}>What It Handles</span>
              <h2 style={{ fontSize: "clamp(24px, 3vw, 38px)", fontWeight: 800, color: "var(--navy)", letterSpacing: "-.025em" }}>
                Built around how an office actually runs.
              </h2>
              <p style={{ maxWidth: 700, margin: "16px auto 0", fontSize: 16, lineHeight: 1.7, color: "rgba(11,23,41,.66)" }}>
                During setup, your agent learns your title, your office, and what you want off your
                plate. Then it gets to work.
              </p>
            </div>
            <div className="cap-grid">
              {CAPABILITIES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="cap-card">
                  <div className="cap-icon"><Icon size={26} strokeWidth={2.2} /></div>
                  <div className="cap-text">
                    <h3>{title}</h3>
                    <p>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA — the rollout + cross-link nudges live here, under the buttons,
            instead of in their own band. */}
        <section className="dark-section cta-grid-bg" style={{ padding: "76px 0" }}>
          <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px", textAlign: "center" }}>
            <h2 style={{ fontSize: "clamp(26px, 3.4vw, 40px)", fontWeight: 800, color: "#fff", letterSpacing: "-.025em", marginBottom: 16 }}>
              Give your staff their week back.
            </h2>
            <p style={{ fontSize: 17, lineHeight: 1.7, color: "rgba(255,255,255,.7)", maxWidth: 560, margin: "0 auto 30px" }}>
              The busywork doesn&apos;t slow down between semesters. Put an agent on it, and let your
              people do the work only they can do.
            </p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
              <a href="/build?plan=pro" className="btn-green">Build a Professional Agent</a>
              <a href="/consultation" className="btn-outline">Book a Consultation</a>
            </div>
            <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "rgba(255,255,255,.65)", margin: "28px auto 0" }}>
              Rolling out to a whole office or division? <a href="/consultation" style={{ color: "var(--green)", textDecoration: "underline" }}>Book a consultation</a> and we&apos;ll build a plan.
              <br />
              In athletics? See <a href="/for-athletics" style={{ color: "var(--green)", textDecoration: "underline" }}>The College Agent for Athletic Departments</a>.
            </p>
          </div>
        </section>

      </main>

      <Footer />

      <style>{`
        .dark-section { background: var(--navy, #0b1729); }
        /* Dark twin of the /build graph-paper arc: fine + major grid lines over navy,
           under a soft green glow that dissolves toward the bottom. */
        .cta-grid-bg {
          background:
            radial-gradient(125% 74% at 50% 0%, rgba(11,23,41,0) 0%, rgba(11,23,41,0) 30%, var(--navy, #0b1729) 62%, var(--navy, #0b1729) 100%),
            linear-gradient(rgba(255,255,255,.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.07) 1px, transparent 1px),
            linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px),
            radial-gradient(92% 48% at 50% 0%, rgba(61,139,61,.30) 0%, rgba(61,139,61,.10) 45%, rgba(11,23,41,0) 74%),
            var(--navy, #0b1729);
          background-size: 100% 100%, 64px 64px, 64px 64px, 16px 16px, 16px 16px, 100% 100%, auto;
        }
        .cap-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .cap-card {
          background: #fff; border: 1px solid rgba(11,23,41,.07); border-radius: 16px;
          padding: 28px; box-shadow: 0 8px 28px rgba(11,23,41,.04);
          display: flex; gap: 16px; align-items: flex-start;
        }
        /* Flat solid tiles: bold green square, white glyph, matching the student/parent pages. */
        .cap-icon {
          width: 54px; height: 54px; border-radius: 16px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: var(--green); color: #fff;
          box-shadow: 0 8px 18px rgba(61,139,61,.28);
        }
        .reality-row { display: flex; align-items: center; gap: 48px; }
        .reality-art { flex: 0 1 440px; min-width: 0; text-align: center; }
        .reality-art img { width: 100%; max-width: 440px; height: auto; display: block; }
        .reality-caption {
          margin-top: 10px; font-family: var(--font-mono); font-size: 11px; font-weight: 600;
          letter-spacing: .08em; text-transform: uppercase; color: rgba(11,23,41,.5);
        }
        @media (max-width: 920px) {
          .reality-row { flex-direction: column; align-items: stretch; gap: 32px; }
          .reality-art { margin: 0 auto; }
        }
        .cap-text { flex: 1; min-width: 0; }
        .cap-card h3 { font-size: 16px; font-weight: 800; color: var(--navy); margin-bottom: 9px; letter-spacing: -.01em; }
        .cap-card p { font-size: 13px; line-height: 1.65; color: rgba(11,23,41,.62); }
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
        @media (max-width: 900px) { .cap-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .cap-grid { grid-template-columns: 1fr; } }
      `}</style>
    </>
  );
}
