/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Nav from "../components/Nav";
import { PageHero } from "../components/PageHero";
import { Footer } from "../components/Footer";
import { AcademicAssistant } from "../components/AcademicAssistant";
import { FiftyWays } from "../components/FiftyWays";
import { AgentChatDemo } from "../components/AgentChatDemo";
import { BriefcaseBusiness, CalendarDays, Mail, NotebookTabs, Sparkles, Target } from "lucide-react";

export const metadata: Metadata = {
  title: "AI for College Students — The College Agent Platform",
  description:
    "The only AI built for your whole college experience: classes, studying, internships, social life, and career planning, from freshman year to graduation.",
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
    type: "website",
    title: "AI for College Students — The College Agent Platform",
    description:
      "The only AI built for your whole college experience: classes, studying, internships, social life, and career planning, from freshman year to graduation.",
    url: "https://thecollegeagent.ai/for-students",
    images: [{ url: "https://thecollegeagent.ai/og-image.png", width: 1200, height: 630, alt: "The College Agent" }],
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
    title: "Classes & Schedule",
    desc: "Your classes, professors, assignments, exams, office hours, and deadlines, all organized in one place. Your agent keeps your semester on track so you always know what's next.",
  },
  {
    icon: NotebookTabs,
    title: "Study Smarter",
    desc: "Turn lecture notes, slides, readings, and textbooks into personalized study guides, practice quizzes, review plans, and exam prep tailored to your schedule.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Career & Internships",
    desc: "Build your resume, optimize your LinkedIn profile, track internship applications, prepare for interviews, and manage every opportunity from freshman year through graduation.",
  },
  {
    icon: Mail,
    title: "Communication",
    desc: "Draft polished emails to professors, advisors, recruiters, classmates, and club leaders in your own voice, ready to review and send.",
  },
  {
    icon: Sparkles,
    title: "Campus Life",
    desc: "Balance classes with clubs, events, leadership roles, work, travel, and personal commitments, all from one organized dashboard.",
  },
  {
    icon: Target,
    title: "Goals & Productivity",
    desc: "Keep projects moving, prioritize what matters most, build better habits, and stay one step ahead with personalized reminders, planning, and daily guidance.",
  },
];

// "Most effective uses" — the college-operating-system framing, in second person.
// Each gets its own College Agent Guy so the section matches the homepage's mascot cards.
const EFFECTIVE_USES = [
  {
    guy: "/avatars/guy-01.webp",
    title: "Start Strong",
    desc: "Begin college with a plan. Add your class schedule, syllabi, professors, deadlines, clubs, and campus commitments. Your agent organizes everything before the semester gets busy.",
  },
  {
    guy: "/avatars/guy-04.webp",
    title: "Never Miss a Deadline",
    desc: "Every syllabus becomes a personalized action plan with assignments, quizzes, exams, reminders, and study blocks, so you always know what's due and what's coming next.",
  },
  {
    guy: "/avatars/guy-02.webp",
    title: "Study Smarter",
    desc: "Transform notes, lectures, readings, and textbooks into personalized study guides, review schedules, practice quizzes, and exam prep tailored to your workload.",
  },
  {
    guy: "/avatars/guy-11.webp",
    title: "Communicate with Confidence",
    desc: "Draft polished emails to professors, teaching assistants, advisors, recruiters, and classmates in your own voice, professional, clear, and ready to send.",
  },
  {
    guy: "/avatars/guy-06.webp",
    title: "Balance Your College Life",
    desc: "Keep classes, clubs, events, work, travel, friendships, and personal commitments organized in one place, making it easier to stay involved without becoming overwhelmed.",
  },
  {
    guy: "/avatars/guy-09.webp",
    title: "Build Your Career Early",
    desc: "Create your resume, strengthen your LinkedIn profile, track internships, grow your professional network, and prepare for interviews, starting freshman year instead of scrambling as a senior.",
  },
  {
    guy: "/avatars/guy-07.webp",
    title: "Stay Independent. Give Everyone Peace of Mind.",
    desc: "Your College Agent helps you stay organized, accountable, and prepared while giving your parents confidence that you have a system in place to support you every step of the way.",
  },
];

// The tools name-dropped in the first-semester chat section, with real catalog logos.
const SEMESTER_TOOLS = [
  { slug: "canvas", label: "Canvas" },
  { slug: "gmail", label: "Gmail" },
  { slug: "googlecalendar", label: "Google Calendar" },
  { slug: "googledrive", label: "Google Drive" },
  { slug: "notion", label: "Notion" },
  { slug: "outlook", label: "Outlook" },
];

// The complete catalog, life stage by life stage. This is the "name them all" section:
// every area the agent covers, from before freshman year to after graduation.
const JOURNEY = [
  {
    stage: "Before College",
    desc: "Start before you arrive. Navigate applications, essays, scholarships, campus visits, packing, housing, orientation, and move-in with one organized plan before classes even begin.",
  },
  {
    stage: "Freshman Year",
    desc: "Build the right foundation. Organize your classes, syllabi, assignments, exams, study schedule, and communication with professors while developing habits that set you up for long-term success.",
  },
  {
    stage: "Sophomore Year",
    desc: "Build momentum. Stay on top of academics while discovering clubs, leadership opportunities, networking events, and internships that strengthen your experience and resume.",
  },
  {
    stage: "Junior Year",
    desc: "Turn preparation into opportunity. Manage internship applications, recruiter outreach, interview preparation, networking, and follow-ups, all while balancing your busiest academic year.",
  },
  {
    stage: "Senior Year",
    desc: "Launch your career. Transition confidently from student to professional with full-time job applications, LinkedIn optimization, networking, interview preparation, and career planning.",
  },
  {
    stage: "Beyond Graduation",
    desc: "Your story doesn't end at graduation. Whether you're starting your first job, moving to a new city, applying to graduate school, or building your career, your College Agent already knows your goals, preferences, and journey.",
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
      <main style={{ paddingTop: 114, minHeight: "100vh" }}>

        {/* HERO */}
        <PageHero
          label="For College Students"
          title="Your Personal College AI Agent."
          sub="One intelligent agent that manages your classes, deadlines, studying, internships, and college life, so you can focus on succeeding."
          primary={{ label: "Build My Agent", href: "/build" }}
          secondary={{ label: "See Everything It Does", href: "#everything" }}
        />

        {/* 24/7 ACADEMIC ASSISTANT — at-a-glance capability list */}
        <AcademicAssistant background="var(--cream2)" />

        {/* COLLEGE OPERATING SYSTEM: the "most effective uses" framing, as mascot cards
            matching the homepage's use-case grid. */}
        <section style={{ background: "#fff", padding: "72px 0" }}>
          <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <span className="mono-label-green">How Students Use Their College Agent</span>
              <h2 className="section-title os-title">Your personal college operating system.</h2>
              <p className="section-sub" style={{ maxWidth: 920, margin: "14px auto 0" }}>
                More than homework help. More than a chatbot. Your College Agent keeps every part of your college life organized,
                <br className="os-br" />
                from your first week on campus to graduation.
              </p>
            </div>
            <div className="uc-grid">
              {EFFECTIVE_USES.map(({ guy, title, desc }) => (
                <div key={title} className="uc-card">
                  <img src={guy} alt="" className="uc-guy" loading="lazy" />
                  <div className="uc-card-text">
                    <h3>{title}</h3>
                    <p>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WHAT IT DOES */}
        <section style={{ background: "var(--cream2)", padding: "72px 0 80px" }}>
          <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <span className="mono-label-green">What Your Agent Does</span>
              <h2 className="section-title">Everything college. One intelligent agent.</h2>
              <p className="section-sub" style={{ maxWidth: 920, margin: "14px auto 0" }}>
                Your College Agent brings every part of your academic life together, from classes and studying to internships, communication, and everything in between. Instead of juggling apps, calendars, notes, and to-do lists, you have one intelligent system that keeps you organized, prepared, and moving forward.
              </p>
            </div>
            <div className="feat-grid">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="feat-card feat-card--row">
                  <div className="feat-icon"><Icon size={26} strokeWidth={2.2} /></div>
                  <div className="feat-text">
                    <h3>{title}</h3>
                    <p>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SHOW, DON'T TELL: two chat mockups — first week and finals — right under
            "What Your Agent Does". */}
        <AgentChatDemo
          label="Your First Semester"
          heading="Week one, handled."
          body="The first weeks of college move fast: new classes, new professors, and a calendar that fills up overnight. Most students spend the first month reacting. With your College Agent, you start with a plan, and by midterms you're following a study system that's been working since day one."
          tools={SEMESTER_TOOLS}
          background="#fff"
          messages={[
            { from: "me", text: "Just uploaded all four of my syllabi 📎" },
            { from: "bot", text: "Done! 47 deadlines are on your calendar. First up: Bio 101 quiz Friday. Want a study plan?" },
            { from: "me", text: "Yes! But I work Tuesday nights." },
            { from: "bot", text: "No problem. Review blocks Wednesday and Thursday, flashcards ready tonight. I also drafted your office-hours email to Professor Rivera. 💪" },
          ]}
        />

        <AgentChatDemo
          label="End of Semester"
          heading="Ready for finals."
          body="By the time finals hit, your agent already knows your classes, your deadlines, and how you study. Instead of cramming, you walk in with a plan it built weeks ago, one exam at a time."
          reverse
          background="var(--cream2)"
          guy="/avatars/guy-02.webp"
          messages={[
            { from: "me", text: "Finals week is going to bury me 😩" },
            { from: "bot", text: "Not this year. Four exams over six days — I built a day-by-day plan, heaviest subject first." },
            { from: "me", text: "Can you quiz me on Orgo?" },
            { from: "bot", text: "15 questions from your Chapter 9–12 notes, hardest last. Ready when you are. 📚" },
          ]}
        />

        {/* THE FULL JOURNEY: before college through after graduation */}
        <section id="everything" style={{ background: "#fff", padding: "72px 0", scrollMarginTop: 90 }}>
          <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px" }}>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <span className="mono-label-green">Everything It Does</span>
              <h2 className="section-title">One Agent. Every Stage of Your Journey.</h2>
              <p className="section-sub" style={{ maxWidth: 920, margin: "14px auto 0" }}>
                From your first campus tour to your first job. Your College Agent isn&apos;t built
                for a single class or semester. It learns about you, remembers what matters, and
                evolves alongside you throughout college, and beyond.
              </p>
            </div>
            <div className="roadmap">
              {JOURNEY.map(({ stage, desc }, i) => (
                <div key={stage} className="roadmap-item">
                  <div className="roadmap-rail">
                    <span className="roadmap-node">{String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <div className="roadmap-card">
                    <div className="roadmap-stage">{stage}</div>
                    <p>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 50 WAYS — the comprehensive capability list */}
        <FiftyWays background="var(--cream2)" />

      </main>

      <Footer />

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
        /* "Your personal college operating system." stays on one line; the sub breaks
           before "from your first week on campus to graduation." on desktop. */
        .os-title { white-space: nowrap; }
        @media (max-width: 600px) { .os-title { white-space: normal; } }
        @media (max-width: 920px) { .os-br { display: none; } }

        /* Mascot use-case cards, matching the homepage's interactive boxes. */
        .uc-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        .uc-grid .uc-card:last-child { grid-column: 1 / -1; }
        .uc-card {
          background: var(--cream2); border: 1px solid rgba(11,23,41,.07); border-radius: 18px;
          padding: 28px 30px; box-shadow: 0 8px 28px rgba(11,23,41,.04);
          display: flex; gap: 20px; align-items: flex-start;
          transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
        }
        .uc-card:hover {
          transform: translateY(-4px);
          border-color: rgba(61,139,61,.35);
          box-shadow: 0 18px 44px rgba(11,23,41,.10);
        }
        .uc-guy {
          width: 74px; height: auto; flex-shrink: 0; align-self: center;
          filter: drop-shadow(0 10px 18px rgba(27,94,42,.22));
          transition: transform .18s ease;
        }
        .uc-card:hover .uc-guy { transform: scale(1.07); }
        .uc-card-text { min-width: 0; }
        .uc-card h3 { font-size: 19px; font-weight: 800; color: var(--navy); margin-bottom: 8px; letter-spacing: -.015em; }
        .uc-card p { font-size: 14.5px; line-height: 1.68; color: rgba(11,23,41,.66); }
        @media (prefers-reduced-motion: reduce) {
          .uc-card, .uc-guy { transition: none; }
          .uc-card:hover { transform: none; }
          .uc-card:hover .uc-guy { transform: none; }
        }
        @media (max-width: 720px) { .uc-grid { grid-template-columns: 1fr; } }
        .feat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .feat-card {
          background: #fff; border: 1px solid rgba(11,23,41,.07); border-radius: 16px;
          padding: 28px; box-shadow: 0 8px 28px rgba(11,23,41,.04);
        }
        /* Flat solid tiles: bold green square, white glyph, instead of the washed-out tint. */
        .feat-icon {
          width: 54px; height: 54px; border-radius: 16px; margin-bottom: 18px;
          display: flex; align-items: center; justify-content: center;
          background: var(--green); color: #fff;
          box-shadow: 0 8px 18px rgba(61,139,61,.28);
        }
        /* Icon-beside-text card: the icon sits to the left and the copy wraps next to it. */
        .feat-card--row { display: flex; gap: 16px; align-items: flex-start; }
        .feat-card--row .feat-icon { margin-bottom: 0; flex-shrink: 0; }
        .feat-text { flex: 1; min-width: 0; }
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
        /* Even columns: stretch every card to the tallest so the tops AND bottoms line up. */
        .everything-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; align-items: stretch; }
        .everything-card { height: 100%; }
        @media (max-width: 1000px) { .everything-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 900px) { .feat-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .feat-grid, .everything-grid { grid-template-columns: 1fr; } }

        /* Journey road map: a dashed center line like a route on a map, with numbered stops
           and stage cards alternating left/right of the road. */
        .roadmap { position: relative; max-width: 980px; margin: 0 auto; }
        .roadmap::before {
          content: ""; position: absolute; left: 50%; top: 30px; bottom: 30px;
          border-left: 3px dashed rgba(61,139,61,.45); transform: translateX(-50%);
        }
        .roadmap-item { display: grid; grid-template-columns: 1fr 110px 1fr; align-items: center; margin-bottom: 30px; }
        .roadmap-item:last-child { margin-bottom: 0; }
        .roadmap-rail { grid-column: 2; grid-row: 1; display: flex; justify-content: center; }
        .roadmap-node {
          position: relative; z-index: 1;
          width: 56px; height: 56px; border-radius: 50%;
          background: #fff; border: 2.5px solid var(--green); color: var(--green);
          font-family: var(--font-mono); font-size: 15px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 6px 18px rgba(61,139,61,.18); flex-shrink: 0;
        }
        .roadmap-card {
          grid-column: 3; grid-row: 1;
          background: var(--cream2); border: 1px solid rgba(11,23,41,.07); border-radius: 16px;
          padding: 22px 26px; box-shadow: 0 8px 28px rgba(11,23,41,.05);
        }
        .roadmap-item:nth-child(even) .roadmap-card { grid-column: 1; }
        .roadmap-stage { font-size: 18px; font-weight: 800; color: var(--navy); margin: 0 0 7px; letter-spacing: -.015em; }
        .roadmap-card p { font-size: 14.5px; line-height: 1.7; color: rgba(11,23,41,.68); margin: 0; }
        @media (max-width: 760px) {
          .roadmap::before { left: 23px; transform: none; }
          .roadmap-item { grid-template-columns: 46px 1fr; gap: 16px; margin-bottom: 22px; align-items: start; }
          .roadmap-rail { grid-column: 1; }
          .roadmap-card, .roadmap-item:nth-child(even) .roadmap-card { grid-column: 2; }
          .roadmap-node { width: 46px; height: 46px; font-size: 13px; }
        }
      `}</style>
    </>
  );
}
