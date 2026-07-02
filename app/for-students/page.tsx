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
              Not ChatGPT. Not a generic study app. The College Agent is an AI companion that knows you — your classes, your goals, your schedule, your voice — and gets smarter every semester.
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
                From the first week of freshman year to your final semester, The College Agent manages the parts of college life that are hardest to keep organized on your own.
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

        {/* 4-YEAR JOURNEY */}
        <section style={{ background: "#fff", padding: "72px 0" }}>
          <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px" }}>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <span className="mono-label-green">The 4-Year Plan</span>
              <h2 className="section-title">Start strong. Finish ready.</h2>
            </div>
            <div style={{ display: "grid", gap: 32 }}>
              {[
                { year: "Freshman Year", desc: "Get your bearings. Your agent helps you organize your first semester, track assignments, draft professor emails, and build the study habits that will carry you through four years." },
                { year: "Sophomore Year", desc: "Start thinking bigger. Your agent tracks academic progress, helps you find clubs and leadership roles that strengthen your resume, and begins surfacing internship opportunities for the summer ahead." },
                { year: "Junior Year", desc: "Internship season. Your agent manages your full recruiting pipeline — target companies, application deadlines, outreach emails, interview prep. By the end of the year, you have real experience to show for it." },
                { year: "Senior Year", desc: "Cross the finish line ready. Your agent helps you turn your internship experience into a career plan — full-time applications, networking, LinkedIn positioning, and the transition from student to professional." },
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
              Join students who are already using The College Agent to stay ahead — academically, professionally, and personally.
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <a href="/build" className="btn-green">Build My Agent</a>
              <a href="/for-parents" className="btn-outline-light">For Parents</a>
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
