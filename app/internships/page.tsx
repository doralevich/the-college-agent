import type { Metadata } from "next";
import Nav from "../components/Nav";
import { BriefcaseBusiness, CalendarDays, FileText, Mail, Network, TrendingUp } from "lucide-react";

export const metadata: Metadata = {
  title: "AI Internship Prep for College Students — The College Agent",
  description:
    "The College Agent manages your entire internship pipeline — from target company research to offer negotiation. Land your first internship before junior year.",
  keywords: [
    "AI internship prep",
    "internship help for college students",
    "how to get an internship in college",
    "AI internship tracker",
    "college internship AI",
    "AI for job applications college",
  ],
  alternates: { canonical: "https://thecollegeagent.ai/internships" },
  openGraph: {
    title: "AI Internship Prep for College Students — The College Agent",
    description:
      "The College Agent manages your entire internship pipeline — from target company research to offer negotiation. Land your first internship before junior year.",
    url: "https://thecollegeagent.ai/internships",
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://thecollegeagent.ai" },
    { "@type": "ListItem", position: 2, name: "AI Internship Prep", item: "https://thecollegeagent.ai/internships" },
  ],
};

const PIPELINE_STAGES = [
  {
    icon: Network,
    title: "Target Company Research",
    desc: "Your agent helps you identify internship targets that match your major, your interests, and your career direction — and tracks application windows so you never miss a deadline.",
  },
  {
    icon: Mail,
    title: "Outreach & Networking",
    desc: "Cold emails to recruiters. LinkedIn connection requests to alumni. Informational interview requests. Your agent drafts every outreach message in your voice — professional and personal.",
  },
  {
    icon: FileText,
    title: "Application Management",
    desc: "Your agent tracks every application: company, role, deadline, status, and follow-up date. Nothing gets lost in an email thread or forgotten in a spreadsheet.",
  },
  {
    icon: CalendarDays,
    title: "Deadline Tracking",
    desc: "Internship deadlines are aggressive and unforgiving. Your agent surfaces them weeks in advance so you have time to prepare properly — not scramble at the last minute.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Interview Preparation",
    desc: "Behavioral questions, company research, case prep. Your agent helps you walk into every interview knowing the company, knowing your stories, and knowing what they're looking for.",
  },
  {
    icon: TrendingUp,
    title: "Resume & LinkedIn Positioning",
    desc: "Your agent helps you frame your experience, coursework, and projects in language that recruiters respond to — so your resume and LinkedIn profile actually get you noticed.",
  },
];

export default function InternshipsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Nav />
      <main style={{ paddingTop: 100, minHeight: "100vh" }}>

        {/* HERO */}
        <section className="dark-section" style={{ padding: "80px 0 70px", overflow: "hidden", position: "relative" }}>
          <div className="hero-glow" />
          <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 860, margin: "0 auto", padding: "0 24px" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,.5)", marginBottom: 16, display: "block" }}>AI Internship Prep</span>
            <h1 style={{ fontSize: "clamp(30px, 4.5vw, 54px)", fontWeight: 800, color: "#fff", lineHeight: 1.06, letterSpacing: "-.035em", marginBottom: 20 }}>
              Land your internship before junior year.
            </h1>
            <p style={{ fontSize: "clamp(16px, 1.4vw, 18px)", lineHeight: 1.75, color: "rgba(255,255,255,.65)", maxWidth: 640, margin: "0 auto 36px" }}>
              The College Agent manages your entire internship pipeline — target companies, deadlines, outreach emails, applications, and interview prep — so you can focus on performing, not tracking. AI internship prep built for college students who want results.
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <a href="/build" className="btn-green">Build My Agent</a>
              <a href="/for-students" className="btn-outline-light">Full Student Features</a>
            </div>
          </div>
        </section>

        {/* THE REALITY */}
        <section style={{ background: "#fff", padding: "72px 0" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--green)", marginBottom: 14, display: "block" }}>The Reality of Recruiting</span>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, color: "var(--navy)", marginBottom: 20, letterSpacing: "-.025em" }}>
              Most students miss internship opportunities because of logistics, not ability.
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 16 }}>
              The internship recruiting process is relentless. Application windows open months before the internship starts. Cold outreach requires follow-up. Deadlines fall during midterms. Resume tweaks need to happen fast. Most students aren&apos;t losing opportunities because they&apos;re not qualified — they&apos;re losing them because they couldn&apos;t keep up with the logistics.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 16 }}>
              The students who land internships early in college aren&apos;t necessarily the most talented. They&apos;re the most organized. They started outreach early. They tracked their applications. They followed up. They prepared for interviews before the night before.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(11,23,41,.7)" }}>
              The College Agent handles all of that logistics so you can focus on the part that only you can do: showing up prepared and making the connection.
            </p>
          </div>
        </section>

        {/* PIPELINE */}
        <section style={{ background: "var(--cream2)", padding: "72px 0" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--green)", marginBottom: 14, display: "block" }}>Your Internship Pipeline</span>
              <h2 style={{ fontSize: "clamp(24px, 3vw, 38px)", fontWeight: 800, color: "var(--navy)", letterSpacing: "-.025em" }}>
                From first search to offer accepted.
              </h2>
            </div>
            <div className="pipe-grid">
              {PIPELINE_STAGES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="pipe-card">
                  <div className="pipe-icon"><Icon size={22} strokeWidth={1.9} /></div>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WHAT THE AGENT DOES FOR EACH APPLICATION */}
        <section style={{ background: "#fff", padding: "72px 0" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--green)", marginBottom: 14, display: "block" }}>Application by Application</span>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, color: "var(--navy)", marginBottom: 24, letterSpacing: "-.025em" }}>
              What The College Agent Does for Each Application
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 28 }}>
              Every internship application is different, but The College Agent runs the same thorough process for each one — so nothing slips through and you show up to every opportunity fully prepared.
            </p>
            {[
              { step: "1", title: "Deadline Alert & Prep Window", desc: "Your agent surfaces the application deadline 4–6 weeks in advance — not 48 hours before it closes. That prep window is when your agent starts generating the materials you need: a tailored resume version, an outreach plan, and a company research brief." },
              { step: "2", title: "Company Research Brief", desc: "Before you write a single word of your application, your agent builds a research brief on the company — what they do, their culture, recent news, what they look for in interns, and how to position your experience to match. You go into the application knowing the company, not researching it at midnight." },
              { step: "3", title: "Resume Tailoring", desc: "Your master resume gets tailored for the role. Your agent adjusts the language, reorders bullet points, and highlights the experience and coursework most relevant to the specific internship — so every application feels like it was written just for that company." },
              { step: "4", title: "Outreach Message Drafts", desc: "Your agent drafts cold emails and LinkedIn connection requests to recruiters and alumni at the target company — in your voice, professional but not robotic. These go out weeks before the deadline so you have time to build a relationship, not just submit an application into a void." },
              { step: "5", title: "Application Status Tracking", desc: "Every application gets logged: company, role, date submitted, current status, next follow-up date. Nothing lives in an email thread you have to search for. Your agent surfaces follow-up reminders automatically and tracks the pipeline from first contact to final decision." },
              { step: "6", title: "Interview Prep Package", desc: "If you get an interview, your agent builds a prep package: behavioral questions tailored to the company, your relevant experience mapped to STAR format stories, company culture notes, and a list of smart questions to ask. You walk in over-prepared — which is exactly where you want to be." },
            ].map(({ step, title, desc }) => (
              <div key={step} style={{ display: "flex", gap: 20, marginBottom: 28, alignItems: "flex-start" }}>
                <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(61,139,61,.2)", border: "2px solid var(--green)", color: "var(--green)", fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{step}</div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: "var(--navy)", marginBottom: 8, letterSpacing: "-.01em" }}>{title}</h3>
                  <p style={{ fontSize: 15, lineHeight: 1.8, color: "rgba(11,23,41,.7)", margin: 0 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4-YEAR INTERNSHIP STRATEGY */}
        <section style={{ background: "var(--cream2)", padding: "72px 0" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--green)", marginBottom: 14, display: "block" }}>The Internship Timeline</span>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, color: "var(--navy)", marginBottom: 24, letterSpacing: "-.025em" }}>
              The Internship Timeline: Freshman to Senior Year
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 24 }}>
              Most students don&apos;t think about internships until junior year. By then, the students who started earlier already have experience, connections, and a clear advantage. Here&apos;s what an intentional, agent-assisted internship strategy looks like across all four years:
            </p>
            {[
              { year: "Freshman Year", action: "Awareness and foundation. Your agent helps you identify industries that interest you, understand how recruiting works in your field, and begin building a professional presence on LinkedIn. You won&apos;t apply to competitive programs yet — but by the time you do, you&apos;ll have a year of intentional preparation behind you. Your agent also tracks research labs, nonprofit summer programs, and small-company roles that are accessible as early as freshman summer." },
              { year: "Sophomore Year", action: "First applications. This is the year to get your first internship — even if it&apos;s not your dream company. Research programs, nonprofits, university labs, and small businesses are all legitimate first experiences. Your agent manages the application pipeline for 5–10 targets, drafts outreach emails, and handles follow-up. The goal: one real experience before junior year that gives you something concrete to build on." },
              { year: "Junior Year", action: "This is the year that defines your resume before graduation. Most competitive internship programs recruit heavily in the fall of junior year for the following summer. Your agent manages your full pipeline — applications to 15–25 target firms, outreach to recruiters and alumni, behavioral interview prep, and offer negotiation. The work you did freshman and sophomore year pays off here." },
              { year: "Senior Year", action: "Convert or leverage. If you received a return offer from your junior year internship, your agent helps you evaluate it and negotiate. If you&apos;re in the full-time job market, your agent positions your internship experience strategically, manages your applications, and helps you make the transition from student to professional. Senior year is the payoff of three years of intentional work." },
            ].map(({ year, action }) => (
              <div key={year} style={{ display: "flex", gap: 20, alignItems: "flex-start", marginBottom: 28 }}>
                <div style={{ background: "rgba(61,139,61,.1)", border: "2px solid var(--green)", borderRadius: 8, padding: "8px 14px", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: "var(--green)", letterSpacing: ".08em", whiteSpace: "nowrap", flexShrink: 0 }}>{year}</div>
                <p style={{ fontSize: 15, lineHeight: 1.8, color: "rgba(11,23,41,.7)", margin: 0 }}>{action}</p>
              </div>
            ))}
            <div style={{ marginTop: 16, display: "flex", gap: 14, flexWrap: "wrap" }}>
              <a href="/build" className="btn-green">Build My Agent</a>
              <a href="/study" className="btn-outline-dark">AI Study Companion</a>
            </div>
          </div>
        </section>

        {/* INTERNAL LINKS */}
        <section style={{ background: "#fff", padding: "48px 0" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px" }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--navy)", marginBottom: 20, letterSpacing: "-.02em" }}>Explore More</h2>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <a href="/for-students" style={{ fontSize: 14, color: "var(--green)", textDecoration: "underline", fontWeight: 600 }}>AI for College Students →</a>
              <a href="/study" style={{ fontSize: 14, color: "var(--green)", textDecoration: "underline", fontWeight: 600 }}>AI Study Companion →</a>
              <a href="/faq" style={{ fontSize: 14, color: "var(--green)", textDecoration: "underline", fontWeight: 600 }}>Frequently Asked Questions →</a>
            </div>
          </div>
        </section>

      </main>

      <style>{`
        .dark-section { background: var(--navy, #0b1729); }
        .hero-glow {
          position: absolute; top: -20%; left: 50%; transform: translateX(-50%);
          width: 70%; height: 120%;
          background: radial-gradient(ellipse at center, rgba(61,139,61,.12) 0%, transparent 60%);
          pointer-events: none;
        }
        .pipe-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .pipe-card {
          background: #fff; border: 1px solid rgba(11,23,41,.07); border-radius: 16px;
          padding: 28px; box-shadow: 0 8px 28px rgba(11,23,41,.04);
        }
        .pipe-icon {
          width: 46px; height: 46px; border-radius: 14px; margin-bottom: 18px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(61,139,61,.1); color: var(--green);
        }
        .pipe-card h3 { font-size: 16px; font-weight: 800; color: var(--navy); margin-bottom: 9px; letter-spacing: -.01em; }
        .pipe-card p { font-size: 13px; line-height: 1.65; color: rgba(11,23,41,.62); }
        .btn-green {
          display: inline-flex; align-items: center; justify-content: center;
          background: var(--green); color: #fff; font-size: 13px; font-weight: 700;
          letter-spacing: .08em; text-transform: uppercase; padding: 14px 30px;
          border-radius: 4px; box-shadow: 0 8px 24px rgba(61,139,61,.3);
          transition: filter .15s; border: none; cursor: pointer; text-decoration: none;
        }
        .btn-green:hover { filter: brightness(1.1); }
        .btn-outline-light {
          display: inline-flex; align-items: center; justify-content: center;
          background: transparent; color: #fff; font-size: 13px; font-weight: 700;
          letter-spacing: .08em; text-transform: uppercase; padding: 13px 30px;
          border-radius: 4px; border: 1.5px solid rgba(255,255,255,.35);
          transition: border-color .15s, background .15s; cursor: pointer; text-decoration: none;
        }
        .btn-outline-light:hover { border-color: #fff; background: rgba(255,255,255,.07); }
        .btn-outline-dark {
          display: inline-flex; align-items: center; justify-content: center;
          background: transparent; color: var(--navy); font-size: 13px; font-weight: 700;
          letter-spacing: .08em; text-transform: uppercase; padding: 13px 30px;
          border-radius: 4px; border: 1.5px solid rgba(11,23,41,.25);
          transition: border-color .15s; cursor: pointer; text-decoration: none;
        }
        .btn-outline-dark:hover { border-color: var(--navy); }
        @media (max-width: 900px) { .pipe-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .pipe-grid { grid-template-columns: 1fr; } }
      `}</style>
    </>
  );
}
