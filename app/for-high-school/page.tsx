import type { Metadata } from "next";
import Nav from "../components/Nav";
import { BookOpenCheck, CalendarDays, GraduationCap, NotebookTabs, Sparkles, TrendingUp } from "lucide-react";

export const metadata: Metadata = {
  title: "Get Ready for College with AI — The College Agent for High Schoolers",
  description:
    "Start building the habits, skills, and plans that will define your college years before you even arrive on campus. AI college prep for high school students.",
  keywords: [
    "AI for high school students",
    "AI college prep",
    "high school AI assistant",
    "AI study tool for high schoolers",
    "college preparation AI",
    "AI for teens",
  ],
  alternates: { canonical: "https://thecollegeagent.ai/for-high-school" },
  openGraph: {
    title: "Get Ready for College with AI — The College Agent for High Schoolers",
    description:
      "Start building the habits, skills, and plans that will define your college years before you even arrive on campus.",
    url: "https://thecollegeagent.ai/for-high-school",
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://thecollegeagent.ai" },
    { "@type": "ListItem", position: 2, name: "For High School Students", item: "https://thecollegeagent.ai/for-high-school" },
  ],
};

const PREP_AREAS = [
  {
    icon: NotebookTabs,
    title: "Study Habits That Actually Work",
    desc: "High school has structure built in. College doesn't. Your agent helps you build the study systems now — before you're on your own with five classes and no one reminding you.",
  },
  {
    icon: CalendarDays,
    title: "Schedule & Time Management",
    desc: "College schedules look nothing like high school. Your agent helps you understand how to block time for studying, social life, and sleep — so you're not constantly behind.",
  },
  {
    icon: GraduationCap,
    title: "College Planning",
    desc: "Not admissions — what comes after. What to expect your first semester, how to pick a major, how to find professors worth getting to know, and how to use every year strategically.",
  },
  {
    icon: TrendingUp,
    title: "Career Vision, Set Early",
    desc: "The students who thrive in college are the ones who know what they're working toward. Your agent helps you clarify your direction so every semester adds to a bigger plan.",
  },
  {
    icon: BookOpenCheck,
    title: "Academic Skills",
    desc: "Research writing, note-taking, reading comprehension, time-on-task. The foundational skills that college demands, practiced and refined before you need them.",
  },
  {
    icon: Sparkles,
    title: "Head Start on Freshman Year",
    desc: "Show up to college already knowing how to manage yourself — with an AI companion already trained on your goals, your style, and your plan. That's the head start that matters.",
  },
];

export default function ForHighSchoolPage() {
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
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,.5)", marginBottom: 16, display: "block" }}>For High School Students</span>
            <h1 style={{ fontSize: "clamp(30px, 4.5vw, 54px)", fontWeight: 800, color: "#fff", lineHeight: 1.06, letterSpacing: "-.035em", marginBottom: 20 }}>
              Get ready for college before you get there.
            </h1>
            <p style={{ fontSize: "clamp(16px, 1.4vw, 18px)", lineHeight: 1.75, color: "rgba(255,255,255,.65)", maxWidth: 640, margin: "0 auto 36px" }}>
              The students who thrive in college don&apos;t figure it out after they arrive. They start building the habits, skills, and plans that will define their college years while they&apos;re still in high school. That&apos;s what The College Agent is for — AI college prep that gives you a real head start.
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <a href="/build" className="btn-green">Start Now</a>
              <a href="/study" className="btn-outline-light">AI Study Tools</a>
            </div>
          </div>
        </section>

        {/* WHY START EARLY */}
        <section style={{ background: "#fff", padding: "72px 0" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--green)", marginBottom: 14, display: "block" }}>Why Start Early</span>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, color: "var(--navy)", marginBottom: 20, letterSpacing: "-.025em" }}>
              The early start is the biggest advantage.
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 16 }}>
              Most students wait until they&apos;re already struggling in college to look for help. They get overwhelmed by week three of freshman year — not because they&apos;re not smart, but because no one taught them how to manage their time, communicate professionally, or think strategically about their four years.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 16 }}>
              The students who thrive start building those skills before they arrive. They understand what college actually demands — academically, socially, professionally — and they have systems in place to handle it before the pressure hits.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(11,23,41,.7)" }}>
              The College Agent lets you start that process now. You build the AI companion, train it on your goals and your work style, and arrive at college freshman year with infrastructure already in place. That&apos;s a real advantage — not a theoretical one.
            </p>
          </div>
        </section>

        {/* THE HEAD START ADVANTAGE */}
        <section style={{ background: "var(--cream2)", padding: "72px 0" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--green)", marginBottom: 14, display: "block" }}>The Advantage</span>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, color: "var(--navy)", marginBottom: 20, letterSpacing: "-.025em" }}>
              The Head Start Advantage: What It Actually Means
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 16 }}>
              Starting The College Agent in high school doesn&apos;t mean doing college work early. It means building the mental models, organizational habits, and communication skills that college demands — so those aren&apos;t things you have to figure out in real time while also navigating a new environment.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 16 }}>
              When you arrive at college with The College Agent already trained on your goals, your voice, and your plan, you spend your first week setting up your schedule — not panicking about it. You send your first professor email on day two because your agent already has a template ready. You know what an organized week looks like because you&apos;ve been building that rhythm for months.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 16 }}>
              That head start compounds. Students who arrive organized stay organized. Students who know how to study efficiently outperform students who are still figuring it out by midterms. The first semester sets the tone for the next four years — and The College Agent makes sure yours starts strong.
            </p>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: "var(--navy)", marginBottom: 12, letterSpacing: "-.02em" }}>
              What You Build Before Freshman Year
            </h3>
            <ul style={{ paddingLeft: 20, marginBottom: 0 }}>
              <li style={{ fontSize: 15, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 8 }}><strong>Study system</strong> — Consistent daily study habits that work for your learning style, not a generic method.</li>
              <li style={{ fontSize: 15, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 8 }}><strong>Communication templates</strong> — Professional email drafts for professors, advisors, and future employers.</li>
              <li style={{ fontSize: 15, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 8 }}><strong>4-year plan framework</strong> — A rough map of your major, your goals, and how each year builds toward your career.</li>
              <li style={{ fontSize: 15, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 8 }}><strong>LinkedIn foundation</strong> — A profile started in high school gives you a full year of head start on professional networking.</li>
              <li style={{ fontSize: 15, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 8 }}><strong>Agent memory</strong> — Your College Agent already knows you before orientation. It doesn&apos;t need a warm-up period.</li>
            </ul>
          </div>
        </section>

        {/* JUNIOR VS SENIOR YEAR */}
        <section style={{ background: "#fff", padding: "72px 0" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--green)", marginBottom: 14, display: "block" }}>High School Timeline</span>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, color: "var(--navy)", marginBottom: 28, letterSpacing: "-.025em" }}>
              What To Do Junior Year vs Senior Year
            </h2>
            <div style={{ display: "grid", gap: 24 }}>
              <div style={{ background: "var(--cream2)", borderRadius: 14, padding: "28px 32px", border: "1px solid rgba(11,23,41,.07)" }}>
                <div style={{ background: "rgba(61,139,61,.1)", border: "2px solid var(--green)", borderRadius: 8, padding: "6px 12px", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: "var(--green)", letterSpacing: ".08em", display: "inline-block", marginBottom: 16 }}>Junior Year</div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: "var(--navy)", marginBottom: 12 }}>Build the Foundation</h3>
                <p style={{ fontSize: 15, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 12 }}>Junior year is the right time to start building The College Agent — not because you need it for high school yet, but because the habits you build now will be the habits you walk into college with.</p>
                <ul style={{ paddingLeft: 20, margin: 0 }}>
                  <li style={{ fontSize: 14, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 6 }}>Start organizing your academic goals and interests with your agent</li>
                  <li style={{ fontSize: 14, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 6 }}>Build daily study habits using AI-assisted scheduling</li>
                  <li style={{ fontSize: 14, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 6 }}>Begin researching what college life actually looks like in your field of interest</li>
                  <li style={{ fontSize: 14, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 6 }}>Create a first LinkedIn profile with your agent&apos;s guidance</li>
                  <li style={{ fontSize: 14, lineHeight: 1.8, color: "rgba(11,23,41,.7)" }}>Draft your first professional bio and career interest statement</li>
                </ul>
              </div>
              <div style={{ background: "var(--cream2)", borderRadius: 14, padding: "28px 32px", border: "1px solid rgba(11,23,41,.07)" }}>
                <div style={{ background: "rgba(61,139,61,.1)", border: "2px solid var(--green)", borderRadius: 8, padding: "6px 12px", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: "var(--green)", letterSpacing: ".08em", display: "inline-block", marginBottom: 16 }}>Senior Year</div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: "var(--navy)", marginBottom: 12 }}>Prepare the Launch</h3>
                <p style={{ fontSize: 15, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 12 }}>Senior year is when your College Agent gets college-specific. You&apos;re not just preparing to apply — you&apos;re preparing to thrive from day one of freshman year.</p>
                <ul style={{ paddingLeft: 20, margin: 0 }}>
                  <li style={{ fontSize: 14, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 6 }}>Load your intended major, target school, and freshman year goals into your agent</li>
                  <li style={{ fontSize: 14, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 6 }}>Build your 4-year plan framework with your agent before orientation</li>
                  <li style={{ fontSize: 14, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 6 }}>Research freshman year internship and research opportunities in your field</li>
                  <li style={{ fontSize: 14, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 6 }}>Set up email communication templates for professors and advisors</li>
                  <li style={{ fontSize: 14, lineHeight: 1.8, color: "rgba(11,23,41,.7)" }}>Arrive at orientation with your agent already ready to load your class schedule on day one</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* PREP AREAS */}
        <section style={{ background: "var(--cream2)", padding: "72px 0" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--green)", marginBottom: 14, display: "block" }}>What You&apos;ll Build</span>
              <h2 style={{ fontSize: "clamp(24px, 3vw, 38px)", fontWeight: 800, color: "var(--navy)", letterSpacing: "-.025em" }}>
                The foundation that carries you through four years.
              </h2>
            </div>
            <div className="prep-grid">
              {PREP_AREAS.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="prep-card">
                  <div className="prep-icon"><Icon size={22} strokeWidth={1.9} /></div>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WHAT TO EXPECT FRESHMAN YEAR */}
        <section style={{ background: "#fff", padding: "72px 0" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--green)", marginBottom: 14, display: "block" }}>Freshman Year Reality</span>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, color: "var(--navy)", marginBottom: 20, letterSpacing: "-.025em" }}>
              What freshman year actually looks like — and how to be ready.
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 16 }}>
              Freshman year is exciting and overwhelming in equal measure. You&apos;re managing your own schedule for the first time, navigating a new social environment, figuring out how to talk to professors, and trying to do well academically — all simultaneously.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 16 }}>
              The students who handle it well aren&apos;t necessarily smarter. They&apos;re more organized. They email professors before problems become crises. They know when their assignments are due. They have a system.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 32 }}>
              The College Agent is that system. And if you build it now, you&apos;ll arrive at college already knowing how it works — so your first semester is about growth, not scrambling.
            </p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <a href="/build" className="btn-green">Build My Agent</a>
              <a href="/for-students" className="btn-outline-dark">The Full Student View</a>
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
        .prep-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .prep-card {
          background: #fff; border: 1px solid rgba(11,23,41,.07); border-radius: 16px;
          padding: 28px; box-shadow: 0 8px 28px rgba(11,23,41,.04);
        }
        .prep-icon {
          width: 46px; height: 46px; border-radius: 14px; margin-bottom: 18px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(61,139,61,.1); color: var(--green);
        }
        .prep-card h3 { font-size: 16px; font-weight: 800; color: var(--navy); margin-bottom: 9px; letter-spacing: -.01em; }
        .prep-card p { font-size: 13px; line-height: 1.65; color: rgba(11,23,41,.62); }
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
        @media (max-width: 900px) { .prep-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .prep-grid { grid-template-columns: 1fr; } }
      `}</style>
    </>
  );
}
