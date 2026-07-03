import type { Metadata } from "next";
import Nav from "../components/Nav";
import { PageHero } from "../components/PageHero";
import { Footer } from "../components/Footer";
import { BookOpenCheck, BriefcaseBusiness, CalendarDays, GraduationCap, ShieldCheck, TrendingUp } from "lucide-react";

export const metadata: Metadata = {
  title: "AI Support for Your College Student — The College Agent for Parents",
  description:
    "Give your college student an AI companion that keeps them organized, on track, and career-ready from day one. Peace of mind for parents.",
  keywords: [
    "AI tutor for college students",
    "college student AI assistant",
    "AI help for college student",
    "AI college planner for parents",
    "college productivity tool for students",
  ],
  alternates: { canonical: "https://thecollegeagent.ai/for-parents" },
  openGraph: {
    title: "AI Support for Your College Student — The College Agent for Parents",
    description:
      "Give your college student an AI companion that keeps them organized, on track, and career-ready from day one. Peace of mind for parents.",
    url: "https://thecollegeagent.ai/for-parents",
  },
};

const BENEFITS = [
  {
    icon: CalendarDays,
    title: "Organization from Day One",
    desc: "The agent tracks every class, assignment, deadline, and exam — so your student doesn't miss critical moments because their planner app didn't remind them.",
  },
  {
    icon: BookOpenCheck,
    title: "Academic Support",
    desc: "Study guides, review schedules, writing support, and professor communication — the agent keeps your student academically supported without the cost of private tutoring.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Internship Readiness",
    desc: "The agent tracks internship deadlines, manages applications, drafts outreach emails, and prepares students for interviews. By junior year, they have real experience.",
  },
  {
    icon: GraduationCap,
    title: "4-Year Career Plan",
    desc: "From freshman year orientation to senior capstone, the agent helps your student build toward a career — not just get through semesters.",
  },
  {
    icon: TrendingUp,
    title: "Grows with Them",
    desc: "The more your student uses the agent, the smarter it gets. It learns their voice, their work style, their goals — and becomes more valuable every semester.",
  },
  {
    icon: ShieldCheck,
    title: "Peace of Mind",
    desc: "You don't have to worry about deadlines being missed, emails going unsent, or opportunities being lost. The agent is always working in the background.",
  },
];

export default function ForParentsPage() {
  return (
    <>
      <Nav />
      <main style={{ paddingTop: 72, minHeight: "100vh" }}>

        {/* HERO */}
        <PageHero
          label="For Parents"
          title="Give your student a four-year advantage."
          sub="You're not buying another app. You're giving your student a personal AI companion that keeps them organized, accountable, and career-ready, from move-in day to graduation."
          primary={{ label: "Build Their Agent", href: "/build" }}
          secondary={{ label: "See the Student View", href: "/for-students" }}
        />

        {/* THE REAL PROBLEM */}
        <section style={{ background: "#fff", padding: "72px 0" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--green)", marginBottom: 14, display: "block" }}>The Reality</span>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, color: "var(--navy)", marginBottom: 20, letterSpacing: "-.025em" }}>
              College is overwhelming. Even for great students.
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 16 }}>
              The students who struggle in college aren&apos;t always the ones who aren&apos;t smart enough. They&apos;re the ones who got overwhelmed — by the sheer volume of things to track, deadlines to hit, emails to send, and decisions to make — all without the structure of high school holding things together.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 16 }}>
              A missed internship application deadline. An assignment submitted to the wrong folder. A professor email never sent that could have changed a grade. These aren&apos;t failures of intelligence — they&apos;re failures of infrastructure. The College Agent is that infrastructure.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(11,23,41,.7)" }}>
              And beyond academics, it&apos;s the career-readiness gap that most parents worry about. Will my student graduate with real experience? Will they know how to build a network? Will they be ready? With The College Agent, the answer is yes — because the work starts freshman year, not senior year.
            </p>
          </div>
        </section>

        {/* BENEFITS */}
        <section style={{ background: "var(--cream2)", padding: "72px 0" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--green)", marginBottom: 14, display: "block" }}>What the Agent Does</span>
              <h2 style={{ fontSize: "clamp(24px, 3vw, 38px)", fontWeight: 800, color: "var(--navy)", letterSpacing: "-.025em" }}>
                Built for every part of college life.
              </h2>
            </div>
            <div className="ben-grid">
              {BENEFITS.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="ben-card">
                  <div className="ben-icon"><Icon size={22} strokeWidth={1.9} /></div>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ROI */}
        <section style={{ background: "#fff", padding: "72px 0" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--green)", marginBottom: 14, display: "block" }}>The Investment</span>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, color: "var(--navy)", marginBottom: 20, letterSpacing: "-.025em" }}>
              Think of it as four-year ROI, not a monthly subscription.
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 16 }}>
              You&apos;re already investing $50,000 to $250,000 in your student&apos;s college education. The College Agent is what makes sure that investment pays off — by keeping your student organized, career-focused, and building real experience every semester, not just surviving each one.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 16 }}>
              One internship landed. One professor relationship built. One job offer received because the student was actually prepared. That&apos;s the ROI. And The College Agent is working toward that outcome from day one.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 32 }}>
              Many parents purchase the agent as a gift — for freshman move-in, a birthday, or any moment they want to give their student a real edge. See current plans at <a href="/build" style={{ color: "var(--green)", textDecoration: "underline" }}>thecollegeagent.ai/build</a>.
            </p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <a href="/build" className="btn-green">View Plans & Pricing</a>
              <a href="/faq" className="btn-outline-dark">Read the FAQ</a>
            </div>
          </div>
        </section>

      </main>

      <Footer />

      <style>{`
        .ben-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .ben-card {
          background: #fff; border: 1px solid rgba(11,23,41,.07); border-radius: 16px;
          padding: 28px; box-shadow: 0 8px 28px rgba(11,23,41,.04);
        }
        .ben-icon {
          width: 46px; height: 46px; border-radius: 14px; margin-bottom: 18px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(61,139,61,.1); color: var(--green);
        }
        .ben-card h3 { font-size: 16px; font-weight: 800; color: var(--navy); margin-bottom: 9px; letter-spacing: -.01em; }
        .ben-card p { font-size: 13px; line-height: 1.65; color: rgba(11,23,41,.62); }
        .btn-green {
          display: inline-flex; align-items: center; justify-content: center;
          background: var(--green); color: #fff; font-size: 13px; font-weight: 700;
          letter-spacing: .08em; text-transform: uppercase; padding: 14px 30px;
          border-radius: 4px; box-shadow: 0 8px 24px rgba(61,139,61,.3);
          transition: filter .15s; border: none; cursor: pointer; text-decoration: none;
        }
        .btn-green:hover { filter: brightness(1.1); }
        .btn-outline-dark {
          display: inline-flex; align-items: center; justify-content: center;
          background: transparent; color: var(--navy); font-size: 13px; font-weight: 700;
          letter-spacing: .08em; text-transform: uppercase; padding: 13px 30px;
          border-radius: 4px; border: 1.5px solid rgba(11,23,41,.25);
          transition: border-color .15s; cursor: pointer; text-decoration: none;
        }
        .btn-outline-dark:hover { border-color: var(--navy); }
        @media (max-width: 900px) { .ben-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .ben-grid { grid-template-columns: 1fr; } }
      `}</style>
    </>
  );
}
