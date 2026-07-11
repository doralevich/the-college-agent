import type { Metadata } from "next";
import Nav from "../components/Nav";
import { PageHero } from "../components/PageHero";
import { Footer } from "../components/Footer";
import { BookOpenCheck, Clock, FileText, NotebookTabs, Sparkles, TrendingUp } from "lucide-react";

export const metadata: Metadata = {
  title: "AI Study Companion for College Students, The College Agent",
  description:
    "The College Agent is your AI study companion, turning notes into study guides, building review schedules, and helping you actually prepare instead of just showing up.",
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
    title: "AI Study Companion for College Students, The College Agent",
    description:
      "The College Agent is your AI study companion, turning notes into study guides, building review schedules, and helping you actually prepare instead of just showing up.",
    url: "https://thecollegeagent.ai/study",
    images: [{ url: "https://thecollegeagent.ai/og-image.png", width: 1200, height: 630, alt: "The College Agent" }],
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://thecollegeagent.ai" },
    { "@type": "ListItem", position: 2, name: "AI Study Companion", item: "https://thecollegeagent.ai/study" },
  ],
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
    desc: "Your agent builds a review schedule backward from your exam dates, so you're not cramming the night before, you're reinforcing material over days and weeks.",
  },
  {
    icon: Sparkles,
    title: "Practice Questions",
    desc: "Get custom practice questions based on your actual course material. Your agent generates quizzes that match the format and depth of your specific tests.",
  },
  {
    icon: BookOpenCheck,
    title: "Note Organization",
    desc: "Your agent organizes notes by class, by topic, and by importance. Find what you need instantly, no more searching through folders or scrolling through a mess of files.",
  },
  {
    icon: FileText,
    title: "Writing Support",
    desc: "Papers, research essays, lab reports. Your agent helps you outline, structure your argument, organize sources, and clean up drafts, without writing it for you.",
  },
  {
    icon: TrendingUp,
    title: "Progress Tracking",
    desc: "Your agent tracks what you've reviewed, what still needs attention, and where your knowledge gaps are, so your study time is always spent on what matters most.",
  },
];

export default function StudyPage() {
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
              The problem isn&apos;t effort, it&apos;s system. Students who do well academically don&apos;t necessarily work harder. They work with better structure. They know what to review, when to review it, and how to test themselves before the real test.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(11,23,41,.7)" }}>
              The College Agent builds that structure for you, automatically, based on your actual course material and your actual exam schedule. That&apos;s what an AI study companion should do.
            </p>
          </div>
        </section>

        {/* STUDY TECHNIQUES */}
        <section style={{ background: "var(--cream2)", padding: "72px 0" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--green)", marginBottom: 14, display: "block" }}>Evidence-Based Methods</span>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, color: "var(--navy)", marginBottom: 20, letterSpacing: "-.025em" }}>
              Study Techniques That Actually Work
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 24 }}>
              The College Agent doesn&apos;t just organize your notes, it helps you apply the study methods that decades of cognitive research have shown to be most effective. These aren&apos;t hacks or shortcuts; they&apos;re the techniques that high-performing students use consistently.
            </p>
            {[
              {
                technique: "Spaced Repetition",
                desc: "Reviewing material at increasing intervals is far more effective than massed practice. Your agent schedules reviews at the right times, not just the night before the exam, but days and weeks beforehand when the material is starting to fade. This is how you retain information long-term instead of forgetting it the day after the test.",
              },
              {
                technique: "Active Recall",
                desc: "Reading your notes again is passive. Testing yourself on the material is active, and significantly more effective for retention. Your agent generates practice questions from your own course material so you practice retrieval, not recognition. By the time the exam arrives, you&apos;ve already answered similar questions dozens of times.",
              },
              {
                technique: "The Feynman Technique",
                desc: "If you can explain a concept simply, you understand it. If you can&apos;t, you&apos;ve identified a gap. Your agent can help you work through complex topics by breaking them into explanations, surfacing the gaps before the exam does.",
              },
              {
                technique: "Interleaved Practice",
                desc: "Mixing topics in a single study session, rather than drilling one subject for hours, produces better long-term retention. Your agent builds study sessions that interleave subjects strategically based on what needs reinforcement and when your exams are scheduled.",
              },
            ].map(({ technique, desc }) => (
              <div key={technique} style={{ marginBottom: 24, background: "#fff", borderRadius: 12, padding: "24px 28px", border: "1px solid rgba(11,23,41,.07)", boxShadow: "0 4px 12px rgba(11,23,41,.04)" }}>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: "var(--navy)", marginBottom: 10, letterSpacing: "-.01em" }}>{technique}</h3>
                <p style={{ fontSize: 15, lineHeight: 1.8, color: "rgba(11,23,41,.7)", margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section style={{ background: "#fff", padding: "72px 0" }}>
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

        {/* HOW AI BUILDS YOUR STUDY PLAN */}
        <section style={{ background: "var(--cream2)", padding: "72px 0" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--green)", marginBottom: 14, display: "block" }}>Step by Step</span>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, color: "var(--navy)", marginBottom: 24, letterSpacing: "-.025em" }}>
              How AI Builds Your Study Plan
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 28 }}>
              Your AI study companion doesn&apos;t give you a generic schedule. It builds a study plan from your actual course materials, your real exam dates, and your known availability. Here&apos;s exactly how it works:
            </p>
            {[
              { step: "1", title: "Load Your Course Materials", desc: "Upload your syllabi, notes, slide decks, and textbook chapters. Your agent ingests them, organizes them by class and topic, and identifies the key concepts that are most likely to appear on exams based on your professor's emphasis and past content patterns." },
              { step: "2", title: "Map Your Exam Calendar", desc: "Your agent builds a full exam and assignment calendar for the semester. Every deadline is visible, every exam has a study window assigned around it, and every major assignment has prep steps broken out weeks in advance." },
              { step: "3", title: "Generate Study Guides", desc: "For each class and exam, your agent creates a structured study guide, organized by topic, prioritized by importance, and formatted for the way you learn. Not a copy of your notes. A synthesized, actionable review document." },
              { step: "4", title: "Build Your Weekly Schedule", desc: "Your agent maps study blocks into your week based on what&apos;s coming up, balancing review sessions across subjects, ensuring adequate spacing, and adjusting automatically when exam dates shift or new assignments appear." },
              { step: "5", title: "Generate Practice Tests", desc: "Before each exam, your agent creates a practice test based on your actual course material, matching the format and depth of your professor&apos;s tests. You take it. You see where you&apos;re weak. Your agent updates the review schedule accordingly." },
              { step: "6", title: "Track and Adjust", desc: "After each exam, you report back on how it went. Your agent updates its model of your strengths and gaps, adjusts future study plans based on your patterns, and continuously improves its recommendations the longer you use it." },
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

        {/* HOW IT FITS */}
        <section style={{ background: "#fff", padding: "72px 0" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--green)", marginBottom: 14, display: "block" }}>Part of a Bigger System</span>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, color: "var(--navy)", marginBottom: 20, letterSpacing: "-.025em" }}>
              Study support is just one part of your College Agent.
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 16 }}>
              The College Agent isn&apos;t just an AI study tool. It&apos;s a personal AI companion built for your entire college life. That means it&apos;s managing your class schedule and deadlines at the same time it&apos;s building your study guides, and it&apos;s tracking your internship applications while you&apos;re focusing on finals.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 32 }}>
              Everything connects. Your agent knows when exam season is, so it automatically backs off on surfacing non-urgent tasks and focuses your attention where it needs to be. That kind of context-aware support is what makes The College Agent different from any individual study app or AI tool.
            </p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <a href="/build" className="btn-green">Build My Agent</a>
              <a href="/internships" className="btn-outline-dark">AI Internship Prep</a>
            </div>
          </div>
        </section>

        {/* INTERNAL LINKS */}
        <section style={{ background: "var(--cream2)", padding: "48px 0" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px" }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--navy)", marginBottom: 20, letterSpacing: "-.02em" }}>Explore More</h2>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <a href="/for-students" style={{ fontSize: 14, color: "var(--green)", textDecoration: "underline", fontWeight: 600 }}>AI for College Students →</a>
              <a href="/internships" style={{ fontSize: 14, color: "var(--green)", textDecoration: "underline", fontWeight: 600 }}>AI Internship Prep →</a>
              <a href="/faq" style={{ fontSize: 14, color: "var(--green)", textDecoration: "underline", fontWeight: 600 }}>Frequently Asked Questions →</a>
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
          background: var(--cream2, #f8f7f4); border: 1px solid rgba(11,23,41,.07); border-radius: 16px;
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
