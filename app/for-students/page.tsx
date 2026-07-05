import type { Metadata } from "next";
import Nav from "../components/Nav";
import { PageHero } from "../components/PageHero";
import { Footer } from "../components/Footer";
import { BookOpenCheck, BriefcaseBusiness, CalendarDays, Network, NotebookTabs, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "AI for College Students, The College Agent",
  description:
    "The only AI built for your whole college experience: classes, studying, internships, social life, and career planning. It grows with you from before freshman year to after graduation.",
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
    title: "AI for College Students, The College Agent",
    description:
      "The only AI built for your whole college experience: classes, studying, internships, social life, and career planning. It grows with you from before freshman year to after graduation.",
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
    title: "Class Schedule Management",
    desc: "Your agent knows every class, every professor, every deadline. It keeps your semester organized so nothing slips: assignments, exams, office hours, and drop-add deadlines included.",
  },
  {
    icon: NotebookTabs,
    title: "Study Planning & Guides",
    desc: "Turn your notes, slides, and textbook chapters into structured study guides. Your agent builds review schedules, creates practice questions, and tracks where you need more time.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Internship Tracking",
    desc: "From target company research to offer negotiation, your agent manages your entire internship pipeline. Deadlines, outreach emails, application status, and interview prep, all in one place.",
  },
  {
    icon: Network,
    title: "LinkedIn & Career Building",
    desc: "Your agent helps you build a LinkedIn profile that actually reflects your work, drafts connection requests that get responses, and keeps your career network active and growing.",
  },
  {
    icon: Sparkles,
    title: "Social Life Balance",
    desc: "College isn't just academics. Your agent helps you balance study time with the social and extracurricular commitments that matter: clubs, events, leadership roles, and downtime.",
  },
  {
    icon: BookOpenCheck,
    title: "Academic Communication",
    desc: "Professor emails. Advisor meeting requests. Club outreach. Recruiter cold emails. Your agent drafts every message in your voice, polished, professional, and ready to send.",
  },
];

// "Most effective uses" — the college-operating-system framing, in second person.
const EFFECTIVE_USES = [
  {
    title: "First 30 days",
    desc: "Load your class schedule, syllabi, deadlines, professor info, clubs, and orientation items. Build a weekly rhythm before things get chaotic.",
  },
  {
    title: "Assignment and deadline tracking",
    desc: "Every syllabus becomes tasks, reminders, study blocks, and check-ins. Nothing lives only in your head.",
  },
  {
    title: "Study planning",
    desc: "Turns exams, readings, papers, and problem sets into a realistic weekly plan. Helps you avoid the classic freshman mistake: waiting until it is urgent.",
  },
  {
    title: "Professor and advisor communication",
    desc: "Drafts polished emails to professors, TAs, advisors, and administrators. Helps you ask the right questions without sounding sloppy.",
  },
  {
    title: "Social and campus involvement",
    desc: "Tracks clubs, events, applications, deadlines, and follow-ups. Helps you get involved without overcommitting.",
  },
  {
    title: "Career foundation early",
    desc: "Start your resume, LinkedIn, internship tracker, alumni connections, and summer planning from freshman year. By sophomore year, you are not starting cold.",
  },
  {
    title: "Parent peace of mind",
    desc: "Not surveillance. Your agent supports your independence while making sure you have a system. You run your life; everyone sleeps better.",
  },
];

// The complete catalog, life stage by life stage. This is the "name them all" section:
// every area the agent covers, from before freshman year to after graduation.
const JOURNEY = [
  {
    stage: "Before College",
    desc: "Choosing schools, applications and essays, scholarship deadlines, campus visit planning, packing lists, and move-in logistics. Your agent starts working before you ever set foot on campus.",
  },
  {
    stage: "Freshman Year",
    desc: "Get your bearings. Your agent organizes your first semester, tracks assignments, drafts professor emails, keeps your quiz and test schedule, and builds the study habits that carry you through.",
  },
  {
    stage: "Sophomore Year",
    desc: "Start thinking bigger. Your agent tracks academic progress, helps you find clubs and leadership roles that strengthen your resume, and begins surfacing internship opportunities for the summer ahead.",
  },
  {
    stage: "Junior Year",
    desc: "Internship season. Your agent manages your full recruiting pipeline: target companies, application deadlines, outreach emails, interview prep. By the end of the year, you have real experience to show for it.",
  },
  {
    stage: "Senior Year",
    desc: "Cross the finish line ready. Your agent turns your experience into a career plan: full-time applications, networking, LinkedIn positioning, and the transition from student to professional.",
  },
  {
    stage: "After Graduation",
    desc: "It doesn't stop at the cap toss. Job search, first apartment logistics, grad school applications, alumni networking, and staying organized in your first role. Your agent already knows your whole story.",
  },
];

// "Let's name them all" — every area, grouped so the list stays scannable.
const EVERYTHING = [
  {
    title: "Academics",
    items: [
      "Class list, days, times, and professors",
      "Syllabus uploads that become deadlines",
      "Quiz and test schedules",
      "Assignment and paper due dates",
      "Study plans, guides, and practice questions",
      "Class notes, organized and searchable",
      "Grade goals per class",
      "Office hours and advisor meetings",
      "Add/drop, registration, and finals week",
    ],
  },
  {
    title: "Life & People",
    items: [
      "Social events, in detail",
      "Friends and plans with them",
      "Family birthdays and anniversaries",
      "Roommates and shared logistics",
      "Travel planning, visits, and flights",
      "Gym and workout routines",
      "Sleep and wake-up schedules",
      "Stress resets and downtime",
    ],
  },
  {
    title: "Money & Work",
    items: [
      "Budgets and money goals",
      "Part-time work shifts",
      "Scholarship and aid deadlines",
      "Textbook and supply hunting",
      "Subscriptions and recurring bills",
    ],
  },
  {
    title: "Career & Beyond",
    items: [
      "Internship pipeline, end to end",
      "Resume and cover letters",
      "LinkedIn profile and networking",
      "Interview prep and follow-ups",
      "Grad school research and applications",
      "Job search after graduation",
    ],
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
      <main style={{ paddingTop: 72, minHeight: "100vh" }}>

        {/* HERO */}
        <PageHero
          label="For College Students"
          title="Your personal AI agent for your college years...and then some!"
          sub="The College Agent is an AI companion that knows you: your classes, your goals, your schedule, your voice. It gets smarter every semester."
          primary={{ label: "Build My Agent", href: "/build" }}
          secondary={{ label: "See Everything It Does", href: "#everything" }}
        />

        {/* COLLEGE OPERATING SYSTEM: the "most effective uses" framing */}
        <section style={{ background: "#fff", padding: "72px 0" }}>
          <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px" }}>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <span className="mono-label-green">Most Effective Uses</span>
              <h2 className="section-title">Your personal college operating system.</h2>
              <p className="section-sub" style={{ maxWidth: 640, margin: "14px auto 0" }}>
                Not &ldquo;another chatbot.&rdquo; Not &ldquo;homework help.&rdquo; It&apos;s the
                thing that quietly keeps your college life organized from day one.
              </p>
            </div>
            <div style={{ display: "grid", gap: 26 }}>
              {EFFECTIVE_USES.map(({ title, desc }, i) => (
                <div key={title} style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(61,139,61,.1)", border: "2px solid var(--green)", color: "var(--green)", fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>{i + 1}</div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--navy)", margin: "0 0 5px", letterSpacing: "-.01em" }}>{title}</h3>
                    <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "rgba(11,23,41,.68)", margin: 0 }}>{desc}</p>
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

        {/* THE FULL JOURNEY: before college through after graduation */}
        <section id="everything" style={{ background: "#fff", padding: "72px 0", scrollMarginTop: 90 }}>
          <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px" }}>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <span className="mono-label-green">Everything It Does</span>
              <h2 className="section-title">It grows with you as you grow.</h2>
              <p className="section-sub" style={{ maxWidth: 680, margin: "14px auto 0" }}>
                From before your first campus tour to after you toss the cap. Name a part of
                student life and your agent handles it.
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

        {/* NAME THEM ALL: the complete feature catalog */}
        <section style={{ background: "var(--cream2)", padding: "72px 0 80px" }}>
          <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <span className="mono-label-green">The Complete List</span>
              <h2 className="section-title">You name it. Your agent handles it.</h2>
            </div>
            <div className="everything-grid">
              {EVERYTHING.map(({ title, items }) => (
                <div key={title} className="feat-card everything-card">
                  <h3 style={{ marginBottom: 14 }}>{title}</h3>
                  <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 9 }}>
                    {items.map((item) => (
                      <li key={item} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13.5, lineHeight: 1.5, color: "rgba(11,23,41,.72)" }}>
                        <span aria-hidden style={{ color: "var(--green)", fontWeight: 700, flexShrink: 0, lineHeight: 1.5 }}>&#10003;</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p style={{ textAlign: "center", marginTop: 36, fontSize: 14, lineHeight: 1.7, color: "rgba(11,23,41,.6)", maxWidth: 720, marginLeft: "auto", marginRight: "auto" }}>
              And it plugs into the tools you already use: Canvas, Blackbaud, Google Classroom,
              Gmail, Google Calendar, Outlook, Microsoft Teams, Google Drive, Dropbox, Notion,
              Todoist, LinkedIn, Spotify, YouTube, and thousands more.
            </p>
            <div style={{ textAlign: "center", marginTop: 32 }}>
              <a href="/build" className="btn-green">Build My Agent</a>
            </div>
          </div>
        </section>

        {/* WHAT YOUR FIRST SEMESTER LOOKS LIKE WITH AI */}
        <section style={{ background: "#fff", padding: "72px 0" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px" }}>
            <span className="mono-label-green">Your First Semester With AI</span>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, color: "var(--navy)", marginBottom: 20, letterSpacing: "-.025em" }}>
              What Your First Semester Looks Like With AI
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 16 }}>
              Week one of freshman year is chaotic for almost every student. You have syllabi to read, professors to email, a social calendar filling up, and zero structure for how to handle any of it. Most students get through it by sheer adrenaline, and start falling behind by week four.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 16 }}>
              With The College Agent, your first semester looks different. Before classes start, you load your schedule. Your agent builds your week, blocking study time, surfacing deadlines, flagging office hours. Your first professor email is drafted before you have to ask. Your first exam review guide is ready two weeks before the test.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 16 }}>
              By midterms, you&apos;re not cramming, you&apos;ve been reviewing consistently. By the end of the semester, your agent knows your class load, your professors, your work style, and your goals. That&apos;s infrastructure most students never build. You have it from day one.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="dark-section" style={{ padding: "72px 0" }}>
          <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 24px", textAlign: "center" }}>
            <h2 style={{ fontSize: "clamp(26px, 3vw, 38px)", fontWeight: 800, color: "#fff", marginBottom: 16, letterSpacing: "-.03em" }}>
              Ready to build your agent?
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: "rgba(255,255,255,.6)", marginBottom: 32 }}>
              Join students who are already using The College Agent to stay ahead, academically, professionally, and personally, across all 4 years of college.
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
        /* Even columns: stretch every card to the tallest so the tops AND bottoms line up. */
        .everything-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; align-items: stretch; }
        .everything-card { height: 100%; }
        @media (max-width: 1000px) { .everything-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 900px) { .feat-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .feat-grid, .everything-grid { grid-template-columns: 1fr; } }

        /* Sleek journey roadmap: a single rail with numbered nodes, before college to after graduation. */
        .roadmap { position: relative; max-width: 760px; margin: 0 auto; }
        .roadmap::before {
          content: ""; position: absolute; left: 27px; top: 27px; bottom: 27px; width: 2px;
          background: linear-gradient(rgba(61,139,61,.35), rgba(61,139,61,.12));
        }
        .roadmap-item { display: grid; grid-template-columns: 54px 1fr; gap: 24px; align-items: start; }
        .roadmap-rail { display: flex; justify-content: center; }
        .roadmap-node {
          position: relative; z-index: 1;
          width: 54px; height: 54px; border-radius: 50%;
          background: #fff; border: 2px solid var(--green); color: var(--green);
          font-family: var(--font-mono); font-size: 15px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 6px 18px rgba(61,139,61,.16); flex-shrink: 0;
        }
        .roadmap-card { padding-bottom: 36px; }
        .roadmap-item:last-child .roadmap-card { padding-bottom: 0; }
        .roadmap-stage { font-size: 18px; font-weight: 800; color: var(--navy); margin: 4px 0 7px; letter-spacing: -.015em; }
        .roadmap-card p { font-size: 15px; line-height: 1.75; color: rgba(11,23,41,.68); margin: 0; }
        @media (max-width: 560px) {
          .roadmap::before { left: 21px; top: 21px; bottom: 21px; }
          .roadmap-item { grid-template-columns: 42px 1fr; gap: 16px; }
          .roadmap-node { width: 42px; height: 42px; font-size: 13px; }
          .roadmap-card { padding-bottom: 28px; }
        }
      `}</style>
    </>
  );
}
