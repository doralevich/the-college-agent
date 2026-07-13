import type { Metadata } from "next";
import Image from "next/image";
import { Award, Bot, CalendarCheck2, Check, FileText, LifeBuoy, ListChecks, Rocket, TrendingUp, BookOpen } from "lucide-react";
import Nav from "../components/Nav";
import { Footer } from "../components/Footer";

export const metadata: Metadata = {
  title: "Become a College Agent Ambassador | The College Agent",
  description:
    "Apply to become a College Agent Ambassador. Help students succeed, build your resume, gain leadership experience, and earn commissions representing one of the first AI platforms built for college students.",
  alternates: { canonical: "https://thecollegeagent.ai/ambassador" },
  openGraph: {
    title: "Become a College Agent Ambassador",
    description:
      "Represent one of the first AI platforms built for college students. Build your resume, gain real-world experience, and earn commissions.",
    url: "https://thecollegeagent.ai/ambassador",
    images: [{ url: "/og-image.jpg", width: 1200, height: 1200, alt: "The College Agent" }],
  },
  twitter: {
    title: "Become a College Agent Ambassador",
    description:
      "Help students succeed. Build your resume. Earn commissions.",
  },
};

const STUDENT_USES = [
  { icon: ListChecks,    title: "Stay Organized",     desc: "Assignments, deadlines, notes, and syllabi, all in one place." },
  { icon: BookOpen,       title: "Study Smarter",       desc: "Turn class notes into study guides, flashcards, quizzes, and review tools." },
  { icon: CalendarCheck2, title: "Manage your Workload", desc: "Build study plans around exams, projects, work, and activities." },
  { icon: FileText,       title: "Writing & Research",  desc: "Organize sources, format citations, and keep papers on track." },
  { icon: TrendingUp,     title: "Track your Progress", desc: "Monitor grades, calculate averages, and identify areas to improve." },
  { icon: LifeBuoy,      title: "Academic Support",   desc: "Ask anything, anytime, clear explanations when you're stuck on a concept." },
];

// The pitch, in checkboxes: what the role does, what it accomplishes, what lands on
// your resume, and the head start on agent technology.
const PROGRAM_PERKS = [
  {
    icon: ListChecks,
    title: "What You'll Actually Do",
    items: [
      "Launch The College Agent at your school",
      "Run live demos in dorms, clubs, and classes",
      "Share your personal link and watch it convert",
      "Give feedback that shapes the product roadmap",
    ],
  },
  {
    icon: Award,
    title: "What It Accomplishes",
    items: [
      "Real sales, marketing, and leadership experience",
      "Commissions on every signup you drive",
      "Direct mentorship from the founding team",
      "A network of ambassadors across the country",
    ],
  },
  {
    icon: FileText,
    title: "What Goes On Your Resume",
    items: [
      "Ambassador at an AI startup",
      "Growth results you can quantify in interviews",
      "Event planning and public speaking reps",
      "The exact experience recruiters are hunting for",
    ],
  },
  {
    icon: Rocket,
    title: "Get Ahead of the World",
    items: [
      "Daily, hands-on fluency with AI agents",
      "Your own College Agent working for you",
      "First access to new features and releases",
      "The story every internship interview wants to hear",
    ],
  },
];

export default function AmbassadorPage() {
  return (
    <>
      <Nav />
      <main style={{ paddingTop: 114, minHeight: "100vh", background: "var(--cream2)" }}>
        <section className="affiliate-hero dark-section">
          <div className="affiliate-glow" />
          <div className="affiliate-shell hero-shell hero-with-bot">
            <div className="affiliate-copy">
              <div className="hero-badge">
                <span style={{ color: "var(--green)", fontSize: 14 }}>&#9670;</span>
                Ambassador Program
              </div>
              <h1>Become a College Agent ambassador.</h1>
              <p className="hero-tagline">Help students succeed. Build your resume. Earn commissions.</p>
              <p>
                Join a select group of student ambassadors representing one of the first AI platforms
                built specifically for college students. Gain real-world experience, strengthen your
                resume, and earn commissions while making a meaningful impact at your school.
              </p>
              <div className="affiliate-actions">
                <a href="/ambassador/apply" className="btn-purple" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Bot size={16} strokeWidth={2} aria-hidden /> Apply Now</a>
              </div>
            </div>
            <div className="hero-bot">
              <Image
                src="/thecollegeagent.png"
                alt="The College Agent"
                width={1128}
                height={1220}
                priority
              />
            </div>
          </div>
        </section>

        <section className="affiliate-section">
          <div className="affiliate-shell what-is-shell">
            <div className="what-is-left">
              <h2>What is The College Agent</h2>
              <h4>A 24/7 AI-powered academic assistant built for college students.</h4>
              <p>
                The College Agent is a 24/7 AI-powered academic assistant built specifically for
                college students. Unlike a general AI chatbot, The College Agent is personalized
                for each student to help stay organized, reduce academic stress, and simplify the
                day-to-day demands of college.
              </p>
              <a href="/ambassador/apply" className="btn-purple what-is-cta" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Bot size={16} strokeWidth={2} aria-hidden /> Apply Now</a>
            </div>
            <div className="what-is-right">
              <h3 className="why-use-title">Why Students Use The College Agent</h3>
              <div className="why-use-list">
                {STUDENT_USES.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="why-use-card">
                    <div className="why-use-icon"><Icon size={20} strokeWidth={2} /></div>
                    <div>
                      <h4>{title}</h4>
                      <p>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="affiliate-section why-become-section">
          <div className="affiliate-glow why-become-glow" />
          <div className="affiliate-shell why-become-shell">
            <div className="why-become">
              <h2>Why Become An Ambassador</h2>
              <h4>This is more than a referral program.</h4>
              <p>
                As a College Agent Ambassador, you&apos;ll represent an emerging AI platform while
                gaining practical experience that can strengthen your resume and prepare you for
                internships and future careers.
              </p>
              <a href="/ambassador/apply" className="btn-purple why-become-cta" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Bot size={16} strokeWidth={2} aria-hidden /> Apply Now</a>
            </div>
            <div className="why-become-bot">
              <Image
                src="/thecollegeagent.png"
                alt="The College Agent"
                width={1128}
                height={1220}
              />
            </div>
          </div>
        </section>

        <section className="affiliate-section program-banner-section">
          <div className="affiliate-shell">
            <div className="program-banner">
              <h2 className="program-banner-title">The Ambassador Program</h2>
              <p>
                This is a real role with real output. You launch the newest agent technology on
                your school, build proof you can sell, lead, and grow something, and get paid
                while you do it.
              </p>
            </div>

            <div className="perk-grid">
              {PROGRAM_PERKS.map(({ icon: Icon, title, items }) => (
                <div key={title} className="perk-card">
                  <div className="perk-head">
                    <div className="perk-icon"><Icon size={20} strokeWidth={2} /></div>
                    <h3>{title}</h3>
                  </div>
                  <ul className="check-list">
                    {items.map((item) => (
                      <li key={item}>
                        <span className="check-box"><Check size={13} strokeWidth={3} /></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Fundraisers: the org angle, clubs and teams earn on every signup. */}
            <div className="fundraiser-band">
              <div className="fundraiser-copy">
                <span className="fundraiser-kicker">For Clubs, Teams &amp; Greek Life</span>
                <h3>Create fundraisers. Earn for your organization.</h3>
                <p>
                  Run The College Agent as a fundraiser for your club, team, sorority,
                  fraternity, or student org. Your group gets its own link, and every signup
                  earns money for the organization. Fund the season, the formal, or the service
                  trip by sharing a tool your classmates will actually use.
                </p>
              </div>
              <div className="fundraiser-cta">
                <a href="/ambassador/apply" className="btn-purple">Start a Fundraiser</a>
              </div>
            </div>
          </div>
        </section>

        <section className="affiliate-section final-cta-section">
          <div className="affiliate-shell">
            <div className="final-cta-card">
              <h2>Ready to Get Started</h2>
              <p>
                Join a select group of College Agent Ambassadors representing an innovative AI
                platform built specifically for college students.
              </p>
              <p className="final-cta-tagline">
                Earn commissions. Build your resume. Gain real-world experience.
              </p>
              <p className="applications-note">Applications are now open.</p>
              <a href="/ambassador/apply" className="btn-purple final-cta-btn" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Bot size={16} strokeWidth={2} aria-hidden /> Apply Now</a>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <style>{`
        .affiliate-shell {
          width: min(1160px, calc(100% - 48px));
          margin: 0 auto;
        }
        main {
          overflow-x: hidden;
        }
        main *,
        main *::before,
        main *::after {
          box-sizing: border-box;
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: rgba(255,255,255,.6);
          background: rgba(61,139,61,.18);
          border: 1px solid rgba(61,139,61,.3);
          padding: 6px 14px;
          border-radius: 99px;
          margin-bottom: 28px;
        }
        .btn-outline {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          color: #fff;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
          padding: 13px 30px;
          border-radius: 4px;
          border: 1.5px solid rgba(255,255,255,.35);
          transition: border-color .15s, background .15s;
          cursor: pointer;
        }
        .btn-outline:hover {
          border-color: #fff;
          background: rgba(255,255,255,.07);
        }
        .affiliate-hero {
          position: relative;
          overflow: hidden;
          padding: 96px 0 72px;
        }
        .affiliate-glow {
          position: absolute;
          inset: -20% auto auto 45%;
          width: 680px;
          height: 680px;
          background: radial-gradient(circle, rgba(61,139,61,.22), transparent 62%);
          pointer-events: none;
        }
        .hero-shell {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(320px, .9fr);
          gap: 48px;
          align-items: center;
        }
        .hero-shell.hero-centered {
          display: block;
          text-align: center;
          max-width: 820px;
          margin-left: auto;
          margin-right: auto;
        }
        .hero-centered .affiliate-copy p {
          margin-left: auto;
          margin-right: auto;
        }
        .hero-centered .affiliate-actions {
          justify-content: center;
        }
        .hero-bot {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .hero-bot img {
          width: 100%;
          max-width: 420px;
          height: auto;
          display: block;
          filter: drop-shadow(0 30px 60px rgba(0,0,0,.35));
        }
        @media (max-width: 820px) {
          .hero-shell.hero-with-bot {
            grid-template-columns: 1fr;
            text-align: center;
            justify-items: stretch;
          }
          .hero-with-bot .affiliate-copy p {
            margin-left: auto;
            margin-right: auto;
          }
          .hero-with-bot .affiliate-actions {
            justify-content: center;
          }
          .hero-bot img {
            max-width: 260px;
          }
        }
        .affiliate-copy,
        .affiliate-panel,
        .request-copy,
        .ambassador-form {
          min-width: 0;
          max-width: 100%;
          overflow-wrap: break-word;
        }
        .affiliate-copy h1 {
          color: #fff;
          /* Sized to keep "Become a College Agent ambassador." on one line on desktop. */
          font-size: clamp(30px, 3.6vw, 44px);
          line-height: 1.05;
          letter-spacing: 0;
          margin-bottom: 22px;
          max-width: 100%;
        }
        .affiliate-copy p {
          max-width: 690px;
          color: rgba(255,255,255,.68);
          font-size: 18px;
          line-height: 1.75;
          margin-bottom: 34px;
        }
        .affiliate-actions {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          max-width: 100%;
        }
        .affiliate-panel {
          border: 1px solid rgba(255,255,255,.14);
          border-radius: 8px;
          background: rgba(255,255,255,.08);
          box-shadow: 0 28px 80px rgba(0,0,0,.24);
          padding: 34px;
          backdrop-filter: blur(18px);
        }
        .panel-icon, .fit-icon {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(61,139,61,.16);
          color: var(--green);
          margin-bottom: 18px;
        }
        .affiliate-panel h2 {
          color: #fff;
          font-size: 25px;
          line-height: 1.15;
          margin-bottom: 12px;
        }
        .affiliate-panel p {
          color: rgba(255,255,255,.62);
          font-size: 15px;
          line-height: 1.7;
          margin-bottom: 24px;
        }
        .mini-stat-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          border-top: 1px solid rgba(255,255,255,.12);
          padding-top: 18px;
          gap: 12px;
        }
        .mini-stat-grid strong {
          display: block;
          color: #fff;
          font-size: 14px;
          margin-bottom: 3px;
        }
        .mini-stat-grid span {
          color: rgba(255,255,255,.42);
          font-family: var(--font-mono);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: .08em;
        }
        .affiliate-section {
          padding: 72px 0;
        }
        .section-heading {
          max-width: 760px;
          margin-bottom: 34px;
        }
        .section-heading h2,
        .program-grid h2,
        .request-copy h2 {
          color: var(--navy);
          font-size: clamp(28px, 3.6vw, 44px);
          line-height: 1.08;
          letter-spacing: 0;
          margin-bottom: 14px;
        }
        .section-heading p,
        .request-copy p {
          color: rgba(11,23,41,.66);
          font-size: 16px;
          line-height: 1.78;
        }
        .fit-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }
        .fit-card {
          background: #fff;
          border: 1px solid rgba(11,23,41,.08);
          border-radius: 8px;
          padding: 28px;
          box-shadow: 0 16px 48px rgba(11,23,41,.06);
        }
        .fit-card h3 {
          font-size: 19px;
          margin-bottom: 10px;
          color: var(--navy);
        }
        .fit-card p {
          font-size: 14px;
          line-height: 1.68;
          color: rgba(11,23,41,.64);
        }
        .program-band {
          background: #fff;
          border-top: 1px solid rgba(11,23,41,.07);
          border-bottom: 1px solid rgba(11,23,41,.07);
        }
        .program-grid {
          display: grid;
          grid-template-columns: minmax(0, .9fr) minmax(320px, 1fr);
          gap: 48px;
          align-items: start;
        }
        .program-list {
          display: grid;
          gap: 12px;
        }
        .program-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          background: var(--cream2);
          border: 1px solid rgba(11,23,41,.07);
          border-radius: 8px;
          padding: 16px;
          color: rgba(11,23,41,.72);
          line-height: 1.55;
        }
        .program-item svg {
          color: var(--green);
          flex: 0 0 auto;
          margin-top: 2px;
        }
        .request-section {
          padding-bottom: 90px;
        }
        .request-grid {
          display: grid;
          grid-template-columns: minmax(300px, .82fr) minmax(0, 1fr);
          gap: 44px;
          align-items: start;
        }
        .request-copy {
          position: sticky;
          top: 104px;
        }
        .review-note {
          margin-top: 24px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid rgba(61,139,61,.18);
          background: rgba(61,139,61,.08);
          color: rgba(11,23,41,.72);
          line-height: 1.55;
        }
        .review-note svg {
          color: var(--green);
          flex: 0 0 auto;
        }
        .hero-tagline {
          font-size: 18px;
          font-weight: 600;
          color: #fff;
          margin-bottom: 14px !important;
          line-height: 1.45;
        }
        .applications-note {
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: var(--green);
          margin-top: 12px !important;
        }
        .final-cta-section {
          padding-bottom: 100px;
        }
        .final-cta-card {
          background: #fff;
          border: 1px solid rgba(11,23,41,.08);
          border-radius: 16px;
          padding: 48px 40px;
          text-align: center;
          max-width: 720px;
          margin: 0 auto;
          box-shadow: 0 22px 70px rgba(11,23,41,.06);
        }
        .final-cta-card h2 {
          font-size: 36px;
          font-weight: 800;
          color: var(--navy);
          margin: 0 0 18px;
          line-height: 1.15;
        }
        .final-cta-card p {
          font-size: 15.5px;
          color: rgba(11,23,41,.65);
          line-height: 1.6;
          max-width: 560px;
          margin: 0 auto;
        }
        .final-cta-card p + p {
          margin-top: 14px;
        }
        .final-cta-tagline {
          font-weight: 700 !important;
          color: var(--navy) !important;
        }
        .final-cta-card .applications-note {
          margin-top: 18px !important;
        }
        .final-cta-btn {
          display: inline-block;
          margin-top: 28px;
          font-size: 14px;
          padding: 14px 36px;
        }
        .what-is-shell {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);
          gap: 56px;
          align-items: start;
        }
        .what-is-left {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        .what-is-left h2 {
          font-size: 36px;
          font-weight: 800;
          color: var(--navy);
          line-height: 1.15;
          margin: 0 0 12px;
        }
        .what-is-left h4 {
          font-size: 24px;
          font-weight: 600;
          color: var(--navy);
          line-height: 1.3;
          margin: 0 0 16px;
        }
        .what-is-left p {
          font-size: 15.5px;
          color: rgba(11,23,41,.65);
          line-height: 1.7;
          margin: 0;
        }
        .what-is-cta {
          display: inline-block;
          margin-top: 28px;
          font-size: 14px;
          padding: 14px 32px;
        }
        .why-use-title {
          font-size: 20px;
          font-weight: 800;
          color: var(--navy);
          margin: 0 0 20px;
        }
        .why-use-list {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        @media (max-width: 600px) {
          .why-use-list {
            grid-template-columns: 1fr;
          }
          /* Mobile hero: tighter spacing, smaller heading that wraps cleanly,
             everything centered. */
          .affiliate-hero {
            padding: 40px 0 44px;
          }
          .hero-shell.hero-with-bot {
            gap: 28px;
          }
          .hero-badge {
            margin-bottom: 18px;
            font-size: 10px;
          }
          .affiliate-copy h1 {
            font-size: clamp(28px, 8vw, 40px);
            line-height: 1.08;
            margin-bottom: 16px;
          }
          .hero-tagline {
            font-size: 16px !important;
          }
          .affiliate-copy p {
            font-size: 15.5px;
            line-height: 1.65;
            margin-bottom: 26px;
          }
          .affiliate-actions {
            justify-content: center;
            width: 100%;
          }
          .hero-bot img {
            max-width: 200px;
          }
        }
        .why-use-card {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 16px 18px;
          background: #fff;
          border: 1px solid rgba(11,23,41,.08);
          border-radius: 10px;
        }
        .why-use-icon {
          flex-shrink: 0;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--green);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .why-use-card h4 {
          font-size: 15px;
          font-weight: 800;
          color: var(--navy);
          margin: 0 0 4px;
        }
        .why-use-card p {
          font-size: 13.5px;
          color: rgba(11,23,41,.6);
          line-height: 1.5;
          margin: 0;
        }
        @media (max-width: 820px) {
          .what-is-shell {
            grid-template-columns: 1fr;
            gap: 40px;
          }
          .what-is-left {
            align-items: flex-start;
          }
        }
        .uses-grid {
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .use-card {
          padding: 26px 22px 24px;
        }
        .use-card h3 {
          margin: 0 0 8px;
        }
        .use-card p {
          font-size: 14px;
          color: rgba(11,23,41,.6);
          line-height: 1.55;
          margin: 0;
        }
        .why-become-section {
          position: relative;
          overflow: hidden;
          background: #fff;
        }
        .why-become-glow {
          left: auto;
          right: -120px;
          top: -120px;
          width: 520px;
          height: 520px;
          background: radial-gradient(circle, rgba(61,139,61,.10), transparent 62%);
        }
        .why-become-shell {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(280px, .9fr);
          gap: 48px;
          align-items: center;
        }
        .why-become {
          min-width: 0;
        }
        .why-become-bot {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .why-become-bot img {
          width: 100%;
          max-width: 360px;
          height: auto;
          display: block;
          filter: drop-shadow(0 30px 60px rgba(0,0,0,.35));
        }
        .why-become-cta {
          display: inline-block;
          margin-top: 28px;
          font-size: 14px;
          padding: 14px 32px;
        }
        @media (max-width: 820px) {
          .why-become-shell {
            grid-template-columns: 1fr;
            justify-items: center;
            text-align: center;
          }
          .why-become-bot img {
            max-width: 240px;
          }
        }
        .why-become h2 {
          font-size: 36px;
          font-weight: 800;
          color: var(--navy);
          line-height: 1.15;
          margin: 0 0 12px;
        }
        .why-become h4 {
          font-size: 24px;
          font-weight: 600;
          color: rgba(11,23,41,.75);
          line-height: 1.3;
          margin: 0 0 16px;
        }
        .why-become p {
          font-size: 15.5px;
          color: rgba(11,23,41,.65);
          line-height: 1.7;
          margin: 0;
        }
        .program-banner {
          text-align: center;
          max-width: 760px;
          margin: 0 auto;
        }
        .program-banner-title {
          font-size: clamp(36px, 4.5vw, 48px);
          font-weight: 800;
          color: var(--navy);
          line-height: 1.1;
          letter-spacing: -.01em;
          margin: 0 0 20px;
        }
        .program-banner p {
          font-size: 15.5px;
          color: rgba(11,23,41,.65);
          line-height: 1.7;
          margin: 0;
        }
        .program-banner p + p {
          margin-top: 14px;
        }
        .perk-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 18px;
          margin-top: 40px;
        }
        .perk-card {
          background: #fff;
          border: 1px solid rgba(11,23,41,.08);
          border-top: 2px solid var(--green);
          border-radius: 14px;
          padding: 26px 26px 22px;
          box-shadow: 0 14px 44px rgba(11,23,41,.05);
        }
        .perk-head {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        .perk-icon {
          flex-shrink: 0;
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: rgba(61,139,61,.1);
          color: var(--green);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .perk-head h3 {
          font-size: 18px;
          font-weight: 800;
          color: var(--navy);
          margin: 0;
          line-height: 1.25;
        }
        .check-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .check-list li {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 14.5px;
          color: rgba(11,23,41,.72);
          line-height: 1.55;
        }
        .check-box {
          flex: 0 0 auto;
          width: 19px;
          height: 19px;
          border-radius: 5px;
          background: var(--green);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 2px;
        }
        .fundraiser-band {
          margin-top: 22px;
          background: var(--navy);
          border-radius: 16px;
          padding: 38px 36px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 28px;
          align-items: center;
        }
        .fundraiser-kicker {
          display: block;
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: rgba(61,139,61,.95);
          margin-bottom: 12px;
        }
        .fundraiser-copy h3 {
          font-size: clamp(22px, 2.6vw, 30px);
          font-weight: 800;
          color: #fff;
          line-height: 1.15;
          margin: 0 0 12px;
        }
        .fundraiser-copy p {
          font-size: 15px;
          color: rgba(255,255,255,.68);
          line-height: 1.7;
          margin: 0;
          max-width: 640px;
        }
        .fundraiser-cta {
          flex-shrink: 0;
        }
        @media (max-width: 820px) {
          .perk-grid {
            grid-template-columns: 1fr;
          }
          .fundraiser-band {
            grid-template-columns: 1fr;
            text-align: center;
            padding: 32px 24px;
          }
          .fundraiser-copy p {
            margin-left: auto;
            margin-right: auto;
          }
        }
        .two-col-section {
          display: grid;
          grid-template-columns: 1fr 1.1fr;
          gap: 56px;
          align-items: start;
        }
        .two-col-section h2 {
          font-size: clamp(22px, 2.2vw, 28px);
          font-weight: 800;
          color: var(--navy);
          margin: 12px 0 18px;
          line-height: 1.25;
        }
        .two-col-cards {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .commissions-section {
          background: rgba(61,139,61,.04);
        }
        .tier-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-top: 32px;
        }
        .tier-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 28px 20px;
          background: #fff;
          border: 1px solid rgba(11,23,41,.08);
          border-radius: 12px;
          text-align: center;
        }
        .tier-qty {
          font-size: 42px;
          font-weight: 800;
          color: var(--navy);
          line-height: 1;
        }
        .tier-label {
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: rgba(11,23,41,.5);
        }
        .tier-arrow {
          font-size: 18px;
          color: rgba(11,23,41,.3);
          margin: 2px 0;
        }
        .tier-bonus {
          font-size: 26px;
          font-weight: 800;
          color: var(--green);
          line-height: 1;
        }
        @media (max-width: 720px) {
          .two-col-section {
            grid-template-columns: 1fr;
            gap: 32px;
          }
          .uses-grid,
          .tier-grid {
            grid-template-columns: 1fr;
          }
        }
        .ambassador-form,
        .ambassador-success {
          background: #fff;
          border: 1px solid rgba(11,23,41,.08);
          border-radius: 8px;
          box-shadow: 0 22px 70px rgba(11,23,41,.08);
          padding: 30px;
        }
        .form-grid {
          display: grid;
          gap: 16px;
          margin-bottom: 18px;
        }
        .form-grid.two {
          grid-template-columns: repeat(2, 1fr);
        }
        .ambassador-form label,
        .ambassador-form fieldset {
          display: block;
          margin-bottom: 18px;
          border: 0;
        }
        .ambassador-form label > span,
        .ambassador-form legend {
          display: block;
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: rgba(11,23,41,.48);
          margin-bottom: 9px;
        }
        .ambassador-form input[type="text"],
        .ambassador-form input[type="email"],
        .ambassador-form input[type="tel"],
        .ambassador-form select,
        .ambassador-form textarea {
          width: 100%;
          border: 1.5px solid rgba(11,23,41,.12);
          border-radius: 6px;
          background: #fff;
          color: var(--navy);
          font: inherit;
          font-size: 15px;
          outline: none;
          padding: 12px 14px;
          transition: border-color .15s, box-shadow .15s;
        }
        .ambassador-form select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%230b1220' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          padding-right: 36px;
        }
        .ambassador-form textarea {
          resize: vertical;
        }
        .ambassador-form input:focus,
        .ambassador-form select:focus,
        .ambassador-form textarea:focus {
          border-color: var(--green);
          box-shadow: 0 0 0 3px rgba(61,139,61,.08);
        }
        .channel-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        .channel-option {
          display: flex !important;
          align-items: center;
          gap: 8px;
          margin: 0 !important;
          min-height: 38px;
          border: 1px solid rgba(11,23,41,.08);
          border-radius: 6px;
          padding: 9px 10px;
          background: var(--cream2);
        }
        .channel-option input {
          width: 15px;
          height: 15px;
          accent-color: var(--green);
          flex: 0 0 auto;
        }
        .channel-option span {
          margin: 0 !important;
          font-family: inherit !important;
          font-size: 13px !important;
          letter-spacing: 0 !important;
          text-transform: none !important;
          color: rgba(11,23,41,.72) !important;
        }
        .form-error {
          color: var(--red);
          font-size: 13px;
          margin: -4px 0 16px;
        }
        .ambassador-submit {
          width: 100%;
          gap: 9px;
          min-height: 48px;
        }
        .ambassador-submit:disabled {
          opacity: .58;
          cursor: not-allowed;
        }
        .ambassador-success {
          text-align: center;
          padding: 44px 32px;
        }
        .success-mark {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          background: rgba(61,139,61,.12);
          color: var(--green);
          font-size: 30px;
          font-weight: 800;
        }
        .ambassador-success h2 {
          color: var(--navy);
          font-size: 26px;
          margin-bottom: 10px;
        }
        .ambassador-success p {
          color: rgba(11,23,41,.62);
          line-height: 1.7;
        }
        @media (max-width: 900px) {
          .hero-shell,
          .program-grid,
          .request-grid {
            grid-template-columns: 1fr;
          }
          .request-copy {
            position: static;
          }
          .fit-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 640px) {
          .affiliate-shell {
            width: calc(100% - 40px) !important;
            max-width: calc(100% - 40px) !important;
            margin-left: auto;
            margin-right: auto;
          }
          .affiliate-hero,
          .affiliate-section,
          .affiliate-panel,
          .fit-card,
          .program-item,
          .ambassador-form {
            max-width: 100vw;
            overflow-x: hidden;
          }
          .affiliate-panel,
          .fit-card,
          .program-item,
          .ambassador-form,
          .section-heading {
            width: 100%;
            max-width: 100%;
          }
          .affiliate-hero {
            padding: 76px 0 56px;
          }
          .affiliate-actions {
            width: 100%;
            justify-content: center;
          }
          .affiliate-actions a {
            min-width: 0;
            max-width: 100%;
            white-space: normal;
            text-align: center;
            line-height: 1.35;
            padding-left: 18px;
            padding-right: 18px;
            overflow-wrap: anywhere;
          }
          .affiliate-actions .btn-purple,
          .affiliate-actions .btn-outline {
            font-size: 11px;
            letter-spacing: .04em;
          }
          .affiliate-copy h1 {
            font-size: clamp(30px, 8vw, 36px);
          }
          .affiliate-copy p {
            font-size: 15px;
            line-height: 1.7;
            max-width: 100%;
          }
          .affiliate-panel {
            padding: 28px 24px;
          }
          .affiliate-panel p,
          .section-heading p,
          .request-copy p {
            font-size: 15px;
            line-height: 1.65;
          }
          .section-heading h2,
          .program-grid h2,
          .request-copy h2 {
            font-size: 30px;
          }
          .form-grid.two,
          .channel-grid,
          .mini-stat-grid {
            grid-template-columns: 1fr;
          }
          .ambassador-form {
            padding: 22px;
          }
        }
      `}</style>
    </>
  );
}
