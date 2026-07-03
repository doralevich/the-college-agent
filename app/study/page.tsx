import type { Metadata } from "next";
import Nav from "../components/Nav";
import { PageHero } from "../components/PageHero";
import { Footer } from "../components/Footer";
import { BookOpenCheck, Clock, FileText, NotebookTabs, Sparkles, TrendingUp } from "lucide-react";

export const metadata: Metadata = {
  title: "AI Study Companion for College Students — The College Agent",
  description:
    "The College Agent is your AI study companion — turning notes into study guides, building review schedules, and helping you actually prepare instead of just showing up.",
  keywords: [
    "AI study companion",
    "AI study tool",
    "AI study partner",
    "AI for studying",
    "AI study guide generator",
    "college study AI",
    "AI tutor for college",
    "AI note organizer for students",
  ],
  alternates: { canonical: "https://thecollegeagent.ai/study" },
  openGraph: {
    title: "AI Study Companion for College Students — The College Agent",
    description:
      "The College Agent is your AI study companion — turning notes into study guides, building review schedules, and helping you actually prepare instead of just showing up.",
    url: "https://thecollegeagent.ai/study",
  },
};

const STUDY_FEATURES = [
  {
    icon: NotebookTabs,
    title: "Study Guide Generation",
    desc: "Upload your notes, slides, or textbook chapters. Your agent organizes everything into a clean, structured study guide tailored to how you learn and what your exam is testing.",
  },
  {
    icon: Clock,
    title: "Review Schedules",
    desc: "Your agent builds a review schedule backward from your exam dates — so you're not cramming the night before, you're reinforcing material over days and weeks.",
  },
  {
    icon: Sparkles,
    title: "Practice Questions",
    desc: "Get custom practice questions based on your actual course material. Your agent generates quizzes that match the format and depth of your specific tests.",
  },
  {
    icon: BookOpenCheck,
    title: "Note Organization",
    desc: "Your agent organizes notes by class, by topic, and by importance. Find what you need instantly — no more searching through folders or scrolling through a mess of files.",
  },
  {
    icon: FileText,
    title: "Writing Support",
    desc: "Papers, research essays, lab reports. Your agent helps you outline, structure your argument, organize sources, and clean up drafts — without writing it for you.",
  },
  {
    icon: TrendingUp,
    title: "Progress Tracking",
    desc: "Your agent tracks what you've reviewed, what still needs attention, and where your knowledge gaps are — so your study time is always spent on what matters most.",
  },
];

export default function StudyPage() {
  return (
    <>
      <Nav />
      <main style={{ paddingTop: 72, minHeight: "100vh" }}>

        {/* HERO */}
        <PageHero
          label="AI Study Companion"
          title="Study smarter. Retain more. Stress less."
          sub="The College Agent turns your raw notes, slides, and readings into structured study guides, review schedules, and practice questions, personalized to your classes and your exam dates."
          primary={{ label: "Build My Study Agent", href: "/build" }}
          secondary={{ label: "See Everything It Does", href: "/for-students#everything" }}
        />

        {/* THE PROBLEM */}
        <section style={{ background: "#fff", padding: "72px 0" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--green)", marginBottom: 14, display: "block" }}>The Problem with Studying</span>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, color: "var(--navy)", marginBottom: 20, letterSpacing: "-.025em" }}>
              Most students don&apos;t have a studying problem. They have a preparation problem.
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 16 }}>
              They sit down to study, but they don&apos;t know where to start. Their notes are scattered. They don&apos;t know what&apos;s going to be on the exam. They read the same chapter twice without retaining anything. They cram the night before and forget it by morning.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 16 }}>
              The problem isn&apos;t effort — it&apos;s system. Students who do well academically don&apos;t necessarily work harder. They work with better structure. They know what to review, when to review it, and how to test themselves before the real test.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(11,23,41,.7)" }}>
              The College Agent builds that structure for you — automatically, based on your actual course material and your actual exam schedule.
            </p>
          </div>
        </section>

        {/* FEATURES */}
        <section style={{ background: "var(--cream2)", padding: "72px 0" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--green)", marginBottom: 14, display: "block" }}>How It Works</span>
              <h2 style={{ fontSize: "clamp(24px, 3vw, 38px)", fontWeight: 800, color: "var(--navy)", letterSpacing: "-.025em" }}>
                Your AI study partner, every class.
              </h2>
            </div>
            <div className="study-grid">
              {STUDY_FEATURES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="study-card">
                  <div className="study-icon"><Icon size={22} strokeWidth={1.9} /></div>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT FITS */}
        <section style={{ background: "#fff", padding: "72px 0" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--green)", marginBottom: 14, display: "block" }}>Part of a Bigger System</span>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, color: "var(--navy)", marginBottom: 20, letterSpacing: "-.025em" }}>
              Study support is just one part of your College Agent.
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 16 }}>
              The College Agent isn&apos;t just a study tool. It&apos;s a personal AI companion built for your entire college life. That means it&apos;s managing your class schedule and deadlines at the same time it&apos;s building your study guides — and it&apos;s tracking your internship applications while you&apos;re focusing on finals.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 32 }}>
              Everything connects. Your agent knows when exam season is — so it automatically backs off on surfacing non-urgent tasks and focuses your attention where it needs to be. That kind of context-aware support is what makes The College Agent different from any individual study app or AI tool.
            </p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <a href="/build" className="btn-green">Build My Agent</a>
              <a href="/internships" className="btn-outline-dark">AI Internship Prep</a>
            </div>
          </div>
        </section>

      </main>

      <Footer />

      <style>{`
        .dark-section { background: var(--navy, #0b1729); }
        .hero-glow {
          position: absolute; top: -20%; left: 50%; transform: translateX(-50%);
          width: 70%; height: 120%;
          background: radial-gradient(ellipse at center, rgba(61,139,61,.12) 0%, transparent 60%);
          pointer-events: none;
        }
        .study-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .study-card {
          background: #fff; border: 1px solid rgba(11,23,41,.07); border-radius: 16px;
          padding: 28px; box-shadow: 0 8px 28px rgba(11,23,41,.04);
        }
        .study-icon {
          width: 46px; height: 46px; border-radius: 14px; margin-bottom: 18px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(61,139,61,.1); color: var(--green);
        }
        .study-card h3 { font-size: 16px; font-weight: 800; color: var(--navy); margin-bottom: 9px; letter-spacing: -.01em; }
        .study-card p { font-size: 13px; line-height: 1.65; color: rgba(11,23,41,.62); }
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
        @media (max-width: 900px) { .study-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .study-grid { grid-template-columns: 1fr; } }
      `}</style>
    </>
  );
}
