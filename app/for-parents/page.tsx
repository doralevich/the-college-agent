import type { Metadata } from "next";
import Nav from "../components/Nav";
import { PageHero } from "../components/PageHero";
import { Footer } from "../components/Footer";
import { BookOpenCheck, BriefcaseBusiness, CalendarDays, GraduationCap, ShieldCheck, TrendingUp } from "lucide-react";

export const metadata: Metadata = {
  title: "AI for Your College Student — The College Agent for Parents",
  description:
    "Give your college student a 4-year AI companion that keeps them organized, on track, and career-ready from day one. Peace of mind, every semester.",
  keywords: [
    "AI tutor for college students",
    "college student AI assistant",
    "AI help for college student",
    "AI college planner for parents",
    "college productivity tool for students",
  ],
  alternates: { canonical: "https://thecollegeagent.ai/for-parents" },
  openGraph: {
    type: "website",
    title: "AI for Your College Student — The College Agent for Parents",
    description:
      "Give your college student a 4-year AI companion that keeps them organized, on track, and career-ready from day one. Peace of mind, every semester.",
    url: "https://thecollegeagent.ai/for-parents",
    images: [{ url: "https://thecollegeagent.ai/og-image.png", width: 1200, height: 630, alt: "The College Agent" }],
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://thecollegeagent.ai" },
    { "@type": "ListItem", position: 2, name: "For Parents", item: "https://thecollegeagent.ai/for-parents" },
  ],
};

const BENEFITS = [
  {
    icon: CalendarDays,
    title: "Stay Organized",
    desc: "Classes, assignments, exams, deadlines, and important dates are organized in one place, helping students stay ahead rather than constantly catch up.",
  },
  {
    icon: BookOpenCheck,
    title: "Build Strong Academic Habits",
    desc: "From personalized study plans and review schedules to communication with professors and academic planning, The College Agent helps students develop the habits that lead to long-term success.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Prepare for a Career, Starting Freshman Year",
    desc: "Internships, resumes, LinkedIn, networking, applications, and interview preparation aren't last-minute tasks. They're built into the college experience from day one.",
  },
  {
    icon: GraduationCap,
    title: "Grow More Independent",
    desc: "Rather than relying on reminders from home, students learn to manage their own responsibilities with confidence, building the skills they'll use long after graduation.",
  },
  {
    icon: TrendingUp,
    title: "Become More Valuable Every Semester",
    desc: "The College Agent learns your student's schedule, goals, preferences, and routines over time, providing increasingly personalized guidance throughout college and beyond.",
  },
  {
    icon: ShieldCheck,
    title: "Give Parents Peace of Mind",
    desc: "You can't be there for every deadline, every decision, or every opportunity, and you shouldn't have to be. The College Agent provides a trusted support system that helps students stay organized, accountable, and prepared while giving parents confidence that they have the structure they need to succeed.",
  },
];

export default function ForParentsPage() {
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
          label="For Parents"
          title="Give your student a four-year advantage."
          sub="More than an app. More than AI. The College Agent is a personalized AI companion that helps students stay organized, build confidence, develop lifelong habits, and prepare for what's next, from move-in day to their first job."
          primary={{ label: "Build My Agent", href: "/build" }}
          secondary={{ label: "See the Student View", href: "/for-students" }}
        />

        {/* THE REAL PROBLEM */}
        <section style={{ background: "#fff", padding: "72px 0" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--green)", marginBottom: 14, display: "block" }}>The Reality</span>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, color: "var(--navy)", marginBottom: 20, letterSpacing: "-.025em" }}>
              College is more demanding than ever.
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 16 }}>
              Success in college isn&apos;t just about intelligence. It&apos;s about managing dozens of moving pieces at once, classes, assignments, exams, internships, communication with professors, campus involvement, and everyday life. The students who struggle aren&apos;t always the least capable. They&apos;re often the ones trying to manage everything without a reliable system.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 16 }}>
              A missed deadline. An overlooked opportunity. An email that never gets sent. An internship application that&apos;s forgotten. These aren&apos;t failures of ability. They&apos;re failures of organization.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(11,23,41,.7)" }}>
              The College Agent provides students with structure, planning, and daily support to stay organized, reduce stress, and build habits that lead to long-term success.
            </p>
          </div>
        </section>

        {/* WHAT MAKES IT DIFFERENT */}
        <section style={{ background: "#fff", padding: "72px 0", borderTop: "1px solid rgba(11,23,41,.06)" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--green)", marginBottom: 14, display: "block" }}>What Makes It Different</span>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, color: "var(--navy)", marginBottom: 20, letterSpacing: "-.025em" }}>
              A companion that grows with your student.
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 16 }}>
              Unlike tutoring or productivity apps, The College Agent doesn&apos;t just solve today&apos;s problem.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 16 }}>
              It learns your student&apos;s schedule, classes, professors, goals, and routines, becoming more personalized and more valuable every semester.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(11,23,41,.7)" }}>
              By graduation, it isn&apos;t just software. It&apos;s a system your student has relied on for four years.
            </p>
          </div>
        </section>

        {/* WHAT PARENTS WORRY ABOUT MOST */}
        <section style={{ background: "var(--cream2)", padding: "72px 0" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--green)", marginBottom: 14, display: "block" }}>Parent Questions, Answered</span>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, color: "var(--navy)", marginBottom: 28, letterSpacing: "-.025em" }}>
              The Questions Parents Ask Most, Answered
            </h2>
            {[
              {
                worry: "Will my student actually use it?",
                answer: "Yes. Because The College Agent supports classes, studying, internships, communication, scheduling, and everyday life, it becomes part of a student's daily routine, not another app they download and forget.",
              },
              {
                worry: "Is it doing the work for them?",
                answer: "No. The College Agent doesn't attend class, take exams, or complete assignments. It organizes, plans, reminds, and supports students so they can focus on learning, critical thinking, and doing their best work.",
              },
              {
                worry: "Will it help them become more independent?",
                answer: "That's exactly the goal. The College Agent provides structure and guidance while encouraging students to take ownership of their responsibilities, helping them become more confident and self-sufficient over time.",
              },
              {
                worry: "Will it help them prepare for life after graduation?",
                answer: "Absolutely. From freshman year onward, The College Agent helps students build their resumes, strengthen their LinkedIn profiles, discover internships, grow their networks, prepare for interviews, and develop professional habits that create long-term opportunities.",
              },
              {
                worry: "Is it only for students who struggle?",
                answer: "Not at all. The most successful students rely on systems to stay organized, manage their time, and consistently perform at a high level. The College Agent helps every student make the most of their college experience.",
              },
            ].map(({ worry, answer }) => (
              <div key={worry} style={{ marginBottom: 32, background: "#fff", borderRadius: 14, padding: "28px 32px", border: "1px solid rgba(11,23,41,.07)", boxShadow: "0 4px 16px rgba(11,23,41,.04)" }}>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: "var(--navy)", marginBottom: 12, letterSpacing: "-.01em" }}>{worry}</h3>
                <p style={{ fontSize: 15, lineHeight: 1.8, color: "rgba(11,23,41,.7)", margin: 0 }}>{answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* BENEFITS */}
        <section style={{ background: "#fff", padding: "72px 0" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--green)", marginBottom: 14, display: "block" }}>What the Agent Does</span>
              <h2 style={{ fontSize: "clamp(24px, 3vw, 38px)", fontWeight: 800, color: "var(--navy)", letterSpacing: "-.025em" }}>
                Built to support every part of your student&apos;s college journey.
              </h2>
              <p style={{ maxWidth: 700, margin: "16px auto 0", fontSize: 16, lineHeight: 1.7, color: "rgba(11,23,41,.66)" }}>
                The College Agent gives students the structure, organization, and guidance they need to
                succeed academically, grow professionally, and become more independent, every step of the way.
              </p>
            </div>
            <div className="ben-grid">
              {BENEFITS.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="ben-card">
                  <div className="ben-icon"><Icon size={26} strokeWidth={2.2} /></div>
                  <div className="ben-text">
                    <h3>{title}</h3>
                    <p>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ROI */}
        <section style={{ background: "var(--cream2)", padding: "72px 0" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--green)", marginBottom: 14, display: "block" }}>The Investment</span>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, color: "var(--navy)", marginBottom: 20, letterSpacing: "-.025em" }}>
              One of the smallest investments you&apos;ll make in college. One of the longest-lasting.
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 16 }}>
              A college education is one of the biggest investments most families will ever make. The College Agent helps students get more from that investment by staying organized, building strong habits, preparing for internships early, and developing the skills that lead to long-term success.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 16 }}>
              Unlike tutoring, which helps for a single subject or exam, or career coaching that&apos;s often used only during senior year, The College Agent supports students every day, through every semester, from move-in day to graduation. The value isn&apos;t measured by how many reminders it sends. It&apos;s measured by the opportunities it helps students create.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 16 }}>
              A deadline that isn&apos;t missed. An internship application submitted on time. A meaningful relationship built with a professor or mentor. A resume that&apos;s ready when the right opportunity appears. An interview earned because preparation started freshman year, not senior year. A graduate who leaves college more organized, more confident, and better prepared for what&apos;s next. Those moments don&apos;t happen by accident. They happen because students have a system that helps them stay organized, focused, and moving forward. That&apos;s the return on investment.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 32 }}>
              Many parents purchase the agent as a gift, for freshman move-in, a birthday, or any moment they want to give their student a real edge. See current plans at <a href="/build" style={{ color: "var(--green)", textDecoration: "underline" }}>thecollegeagent.ai/build</a>.
            </p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <a href="/build" className="btn-green">View Plans &amp; Pricing</a>
              <a href="/faq" className="btn-outline-dark">Read the FAQ</a>
            </div>
          </div>
        </section>

        {/* INTERNAL LINKS */}
        <section style={{ background: "var(--cream2)", padding: "48px 0" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px" }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--navy)", marginBottom: 20, letterSpacing: "-.02em" }}>Explore More</h2>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <a href="/for-students" style={{ fontSize: 14, color: "var(--green)", textDecoration: "underline", fontWeight: 600 }}>AI for College Students →</a>
              <a href="/study" style={{ fontSize: 14, color: "var(--green)", textDecoration: "underline", fontWeight: 600 }}>AI Study Companion →</a>
              <a href="/internships" style={{ fontSize: 14, color: "var(--green)", textDecoration: "underline", fontWeight: 600 }}>AI Internship Prep →</a>
              <a href="/faq" style={{ fontSize: 14, color: "var(--green)", textDecoration: "underline", fontWeight: 600 }}>Frequently Asked Questions →</a>
            </div>
          </div>
        </section>

      </main>

      <Footer />

      <style>{`
        .dark-section { background: var(--navy, #0b1729); }
        .ben-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .ben-card {
          background: var(--cream2, #f8f7f4); border: 1px solid rgba(11,23,41,.07); border-radius: 16px;
          padding: 28px; box-shadow: 0 8px 28px rgba(11,23,41,.04);
          display: flex; gap: 16px; align-items: flex-start;
        }
        /* Flat solid tiles: bold green square, white glyph, instead of the washed-out tint. */
        .ben-icon {
          width: 54px; height: 54px; border-radius: 16px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: var(--green); color: #fff;
          box-shadow: 0 8px 18px rgba(61,139,61,.28);
        }
        .ben-text { flex: 1; min-width: 0; }
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
        @media (max-width: 900px) { .ben-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .ben-grid { grid-template-columns: 1fr; } }
      `}</style>
    </>
  );
}
