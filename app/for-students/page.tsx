import type { Metadata } from "next";
import Nav from "../components/Nav";
import { BookOpenCheck, BriefcaseBusiness, CalendarDays, Network, NotebookTabs, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "AI for College Students — The College Agent",
  description:
    "The only AI built for your whole college experience — classes, studying, internships, social life, and career planning. Grows with you from freshman year to graduation.",
  keywords: [
    "AI for college students",
    "AI study companion",
    "personal AI agent for students",
    "AI college planner",
    "college life AI",
    "AI study partner",
  ],
  alternates: { canonical: "https://thecollegeagent.ai/for-students" },
  openGraph: {
    title: "AI for College Students — The College Agent",
    description:
      "The only AI built for your whole college experience — classes, studying, internships, social life, and career planning. Grows with you from freshman year to graduation.",
    url: "https://thecollegeagent.ai/for-students",
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://thecollegeagent.ai" },
    { "@type": "ListItem", position: 2, name: "For Students", item: "https://thecollegeagent.ai/for-students" },
  ],
};

const FEATURES = [
  {
    icon: CalendarDays,
    title: "Class Schedule Management",
    desc: "Your agent knows every class, every professor, every deadline. It keeps your semester organized so nothing slips — assignments, exams, office hours, and drop-add deadlines included.",
  },
  {
    icon: NotebookTabs,
    title: "Study Planning & Guides",
    desc: "Turn your notes, slides, and textbook chapters into structured study guides. Your agent builds review schedules, creates practice questions, and tracks where you need more time.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Internship Tracking",
    desc: "From target company research to offer negotiation — your agent manages your entire internship pipeline. Deadlines, outreach emails, application status, and interview prep, all in one place.",
  },
  {
    icon: Network,
    title: "LinkedIn & Career Building",
    desc: "Your agent helps you build a LinkedIn profile that actually reflects your work, drafts connection requests that get responses, and keeps your career network active and growing.",
  },
  {
    icon: Sparkles,
    title: "Social Life Balance",
    desc: "College isn't just academics. Your agent helps you balance study time with the social and extracurricular commitments that matter — clubs, events, leadership roles, and downtime.",
  },
  {
    icon: BookOpenCheck,
    title: "Academic Communication",
    desc: "Professor emails. Advisor meeting requests. Club outreach. Recruiter cold emails. Your agent drafts every message in your voice — polished, professional, and ready to send.",
  },
];

export default function ForStudentsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Nav />
      <main style={{ paddingTop: 100, minHeight: "100vh" }}>

        {/* HERO */}
        <section className="dark-section" style={{ padding: "80px 0 70px", overflow: "hidden" }}>
          <div className="hero-glow" />
          <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 860, margin: "0 auto", padding: "0 24px" }}>
            <span className="mono-label-light">For College Students</span>
            <h1 style={{ fontSize: "clamp(32px, 4.5vw, 56px)", fontWeight: 800, color: "#fff", lineHeight: 1.06, letterSpacing: "-.035em", marginBottom: 20 }}>
              Your personal AI for all 4 years of college.
            </h1>
            <p style={{ fontSize: "clamp(16px, 1.4vw, 19px)", lineHeight: 1.7, color: "rgba(255,255,255,.65)", maxWidth: 640, margin: "0 auto 36px" }}>
              AI for college students who want more than a generic chatbot. The College Agent is a personal AI agent that knows you — your classes, your goals, your schedule, your voice — and gets smarter every semester across all 4 years of college.
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <a href="/build" className="btn-green">Build My Agent</a>
              <a href="/study" className="btn-outline-light">AI Study Companion</a>
            </div>
          </div>
        </section>

        {/* WHAT IT DOES */}
        <section style={{ background: "var(--cream2)", padding: "72px 0 80px" }}>
          <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <span className="mono-label-green">What Your Agent Does</span>
              <h2 className="section-title">Everything college, in one AI companion.</h2>
              <p className="section-sub" style={{ maxWidth: 680, margin: "14px auto 0" }}>
                From the first week of freshman year to your final semester, The College Agent manages the parts of college life that are hardest to keep organized on your own. AI for college students means having a system that works even when you don&apos;t.
              </p>
            </div>
            <div className="feat-grid">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="feat-card">
                  <div className="feat-icon"><Icon size={22} strokeWidth={1.9} /></div>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FIRST SEMESTER WITH AI */}
        <section style={{ background: "#fff", padding: "72px 0" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px" }}>
            <span className="mono-label-green">Your First Semester With AI</span>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, color: "var(--navy)", marginBottom: 20, letterSpacing: "-.025em" }}>
              What Your First Semester Looks Like With AI
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 16 }}>
              Week one of freshman year is chaotic for almost every student. You have syllabi to read, professors to email, a social calendar filling up, and zero structure for how to handle any of it. Most students get through it by sheer adrenaline — and start falling behind by week four.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 16 }}>
              With The College Agent, your first semester looks different. Before classes start, you load your schedule into your agent. It builds your week — blocking study time, surfacing assignment deadlines, flagging office hours that matter. Your first professor email gets drafted for you. Your first exam review guide is ready two weeks before the test.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 16 }}>
              By midterms, you&apos;re not cramming — you&apos;ve been reviewing consistently. By the end of the semester, your agent knows your class load, your professors, your work style, and your goals. That&apos;s infrastructure most students never build. You have it from day one.
            </p>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: "var(--navy)", marginBottom: 12, letterSpacing: "-.02em" }}>
              What the Agent Handles in Your First 60 Days
            </h3>
            <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
              <li style={{ fontSize: 15, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 8 }}><strong>Syllabi organization</strong> — Every deadline, reading, and grading weight tracked in one place.</li>
              <li style={{ fontSize: 15, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 8 }}><strong>Professor introductions</strong> — First-contact emails drafted and ready to send in your voice.</li>
              <li style={{ fontSize: 15, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 8 }}><strong>Weekly rhythm</strong> — Study blocks, assignment check-ins, and review sessions scheduled around your class times.</li>
              <li style={{ fontSize: 15, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 8 }}><strong>Club and activity tracking</strong> — Applications, meeting times, and follow-ups managed alongside your academics.</li>
              <li style={{ fontSize: 15, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 8 }}><strong>Early career foundation</strong> — LinkedIn setup, resume first draft, and a list of sophomore-year internship targets already being built.</li>
            </ul>
          </div>
        </section>

        {/* 4-YEAR JOURNEY */}
        <section style={{ background: "var(--cream2)", padding: "72px 0" }}>
          <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px" }}>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <span className="mono-label-green">The 4-Year Plan</span>
              <h2 className="section-title">From Freshman to Senior: Your AI College Journey</h2>
            </div>
            <div style={{ display: "grid", gap: 32 }}>
              {[
                { year: "Freshman Year", desc: "Get your bearings — with AI doing the heavy lifting. Your agent organizes your first semester, tracks every assignment, drafts professor emails, and starts building the study habits that will carry you through four years. You focus on making friends and finding your footing; your agent keeps the academics on track." },
                { year: "Sophomore Year", desc: "Start thinking bigger. Your agent tracks academic progress, helps you find clubs and leadership roles that strengthen your resume, and begins surfacing internship opportunities for the summer ahead. By the end of sophomore year, most students using The College Agent have already applied to at least one competitive program — before most of their peers have even thought about it." },
                { year: "Junior Year", desc: "Internship season. This is the year that defines your resume before graduation. Your agent manages your full recruiting pipeline — target companies, application deadlines, outreach emails, interview prep. By the end of junior year, you have real experience on your resume, a network you&apos;ve built intentionally, and a clear picture of where you want to go." },
                { year: "Senior Year", desc: "Cross the finish line ready. Your agent helps you turn your internship experience into a career plan — full-time applications, networking, LinkedIn positioning, and the transition from student to professional. By senior year, The College Agent has three years of context on you. It&apos;s not a generic tool anymore — it&apos;s your personal advisor for the biggest transition of your young career." },
              ].map(({ year, desc }) => (
                <div key={year} style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
                  <div style={{ background: "rgba(61,139,61,.1)", border: "2px solid var(--green)", borderRadius: 8, padding: "8px 14px", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: "var(--green)", letterSpacing: ".08em", whiteSpace: "nowrap", flexShrink: 0 }}>{year}</div>
                  <p style={{ fontSize: 15, lineHeight: 1.8, color: "rgba(11,23,41,.7)", margin: 0 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="dark-section" style={{ padding: "72px 0" }}>
          <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 24px", textAlign: "center" }}>
            <h2 style={{ fontSize: "clamp(26px, 3vw, 38px)", fontWeight: 800, color: "#fff", marginBottom: 16, letterSpacing: "-.03em" }}>
              Ready to build your agent?
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: "rgba(255,255,255,.6)", marginBottom: 32 }}>
              Join students who are already using The College Agent to stay ahead — academically, professionally, and personally — across all 4 years of college.
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <a href="/build" className="btn-green">Build My Agent</a>
              <a href="/for-parents" className="btn-outline-light">For Parents</a>
            </div>
          </div>
        </section>

        {/* INTERNAL LINKS */}
        <section style={{ background: "var(--cream2)", padding: "48px 0" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px" }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--navy)", marginBottom: 20, letterSpacing: "-.02em" }}>Explore More</h2>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <a href="/study" style={{ fontSize: 14, color: "var(--green)", textDecoration: "underline", fontWeight: 600 }}>AI Study Companion →</a>
              <a href="/internships" style={{ fontSize: 14, color: "var(--green)", textDecoration: "underline", fontWeight: 600 }}>AI Internship Prep →</a>
              <a href="/faq" style={{ fontSize: 14, color: "var(--green)", textDecoration: "underline", fontWeight: 600 }}>Frequently Asked Questions →</a>
            </div>
          </div>
        </section>

      </main>

      <style>{`
        .dark-section { background: var(--navy, #0b1729); }
        .mono-label-light {
          font-family: var(--font-mono); font-size: 11px; font-weight: 600;
          text-transform: uppercase; letter-spacing: .1em; color: rgba(255,255,255,.5);
          margin-bottom: 16px; display: block;
        }
        .mono-label-green {
          font-family: var(--font-mono); font-size: 11px; font-weight: 600;
          text-transform: uppercase; letter-spacing: .1em; color: var(--green);
          margin-bottom: 14px; display: block;
        }
        .hero-glow {
          position: absolute; top: -20%; left: 50%; transform: translateX(-50%);
          width: 70%; height: 120%;
          background: radial-gradient(ellipse at center, rgba(61,139,61,.12) 0%, transparent 60%);
          pointer-events: none;
        }
        .section-title {
          font-size: clamp(26px, 3vw, 40px); font-weight: 800;
          line-height: 1.08; letter-spacing: -.02em; color: var(--navy);
        }
        .section-sub { font-size: 16px; line-height: 1.75; color: rgba(11,23,41,.62); }
        .feat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .feat-card {
          background: #fff; border: 1px solid rgba(11,23,41,.07); border-radius: 16px;
          padding: 28px; box-shadow: 0 8px 28px rgba(11,23,41,.04);
        }
        .feat-icon {
          width: 46px; height: 46px; border-radius: 14px; margin-bottom: 18px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(61,139,61,.1); color: var(--green);
        }
        .feat-card h3 { font-size: 16px; font-weight: 800; color: var(--navy); margin-bottom: 9px; letter-spacing: -.01em; }
        .feat-card p { font-size: 13px; line-height: 1.65; color: rgba(11,23,41,.62); }
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
        @media (max-width: 900px) { .feat-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .feat-grid { grid-template-columns: 1fr; } }
      `}</style>
    </>
  );
}
