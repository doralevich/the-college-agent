import type { Metadata } from "next";
import FAQ from "./components/FAQ";
import SchoolMarquee from "./components/SchoolMarquee";
import Explainer from "./components/Explainer";
import ChatBot from "./components/ChatBot";
import Nav from "./components/Nav";
import IntegrationGlobe from "./components/IntegrationGlobe";
import { BookOpenCheck, BriefcaseBusiness, CalendarDays, FileText, GraduationCap, Mail, Network, NotebookTabs, ShieldCheck, Sparkles } from "lucide-react";

const CALENDLY = "https://calendly.com/therealdaveo/apolloai";

export const metadata: Metadata = {
  alternates: { canonical: "https://thecollegeagent.ai" },
};

const AGENT_WAYS = [
  {
    icon: GraduationCap,
    title: "Student Life",
    desc: "A personalized assistant that knows the student, their goals, and how they actually work day to day.",
  },
  {
    icon: BookOpenCheck,
    title: "Academic Planning",
    desc: "Tracks classes, assignments, teachers, tests, textbooks, and what needs attention next.",
  },
  {
    icon: CalendarDays,
    title: "College Schedule",
    desc: "Keeps the week organized across class time, study blocks, deadlines, meetings, and campus commitments.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Internships",
    desc: "Helps manage target roles, deadlines, outreach, resumes, applications, interviews, and follow-ups.",
  },
  {
    icon: NotebookTabs,
    title: "Study Guides",
    desc: "Turns notes, textbooks, and class materials into organized study guides, review plans, and prep checklists.",
  },
  {
    icon: FileText,
    title: "Writing Support",
    desc: "Helps outline papers, organize research, clean up drafts, and keep citations and sources in order.",
  },
  {
    icon: Mail,
    title: "Communication",
    desc: "Drafts polished emails to professors, advisors, recruiters, classmates, and internship contacts.",
  },
  {
    icon: Network,
    title: "Career Network",
    desc: "Builds a smarter contact system for alumni, family connections, mentors, and finance career conversations.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "@id": "https://thecollegeagent.ai/#service",
      name: "The College Agent",
      description:
        "A personalized AI agent for college students that helps organize classes, notes, deadlines, study plans, professor emails, internships, and campus life.",
      provider: { "@type": "Organization", name: "Apollo[Claw]", url: "https://apolloclaw.ai" },
      url: "https://thecollegeagent.ai",
      serviceType: "AI Agent for College Students",
      category: "Education Technology",
      keywords:
        "AI agent for college students, AI for college students, AI study tool, AI note taker for students, student AI assistant, college productivity app, study guide generator",
      areaServed: "United States",
      offers: [
        { "@type": "Offer", name: "Hermes Starter", price: "199", priceCurrency: "USD" },
        { "@type": "Offer", name: "Hermes Pro", price: "399", priceCurrency: "USD" },
        { "@type": "Offer", name: "OpenClaw Starter", price: "199", priceCurrency: "USD" },
        { "@type": "Offer", name: "OpenClaw Pro", price: "399", priceCurrency: "USD" },
      ],
    },
    {
      "@type": "FAQPage",
      "@id": "https://thecollegeagent.ai/#faq",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is the difference between Hermes and OpenClaw?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Hermes is a pre-configured student agent base built specifically for student workflows. OpenClaw is a fully custom build from the ground up.",
          },
        },
        {
          "@type": "Question",
          name: "Can a parent purchase this for their student?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Many of our clients are purchased as gifts. The agent is built for the student.",
          },
        },
        {
          "@type": "Question",
          name: "What does the 30-day co-training period include?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "It is included in your setup fee. During the 30 days, we work alongside you and your agent, refining how it responds and making sure it fits how you work.",
          },
        },
      ],
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Nav />

      {/* HERO */}
      <section className="dark-section" style={{
        padding: "120px 0 90px",
        overflow: "hidden",
      }}>
        <div className="hero-glow" />
        <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}>
          <div className="hero-badge">
            <span style={{ color: "var(--green)", fontSize: 14 }}>&#9670;</span>
            Apollo[Claw] College Edition
          </div>
          <h1 className="hero-h1" style={{ color: "#fff" }}>
            AI personal agent for college students.
          </h1>
          <p className="hero-sub">
            Your own student AI assistant. Named. Trained on your voice. Built around your schedule, classes,
            notes, deadlines, study plans, professor emails, internships, and goals. Not ChatGPT. Yours.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginBottom: 28 }}>
            <a href="/build" className="btn-purple">Build My Agent</a>
            <a href="#how-it-works" className="btn-outline">See How It Works</a>
          </div>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(255,255,255,.3)", letterSpacing: ".04em" }}>
            Built on Apollo[Claw] infrastructure. Live in 30 minutes to 72 hours.
          </p>
        </div>
      </section>

      {/* DUAL BUYER */}
      <section style={{ background: "var(--cream2)", padding: "70px 0" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px" }}>
          <div className="dual-grid">
            <div className="dual-card dual-card-student">
              <div className="dual-icon"><Sparkles size={24} strokeWidth={1.9} /></div>
              <span className="dual-tag dual-tag-student">For Students</span>
              <h2>Your own AI operator for college.</h2>
              <p>It knows your classes, deadlines, professors, goals, and communication style. It helps you stay ahead academically, prepare for internships, write better emails, and stop letting important things slip.</p>
            </div>
            <div className="dual-card dual-card-parent">
              <div className="dual-icon"><ShieldCheck size={24} strokeWidth={1.9} /></div>
              <span className="dual-tag dual-tag-parent">For Parents</span>
              <h2>A four-year advantage, not another app.</h2>
              <p>You are not buying tutoring hours or a generic AI subscription. You are giving your student a personalized support system that keeps them organized, accountable, and prepared for the opportunities that matter.</p>
            </div>
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section id="what-it-does" style={{ background: "#fff", padding: "72px 0 78px" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 38 }}>
            <span className="mono-label">What It Does</span>
            <h2 className="section-title ways-title">Ways Your Agent Can Work for You</h2>
            <p className="section-sub" style={{ maxWidth: 720, margin: "14px auto 0" }}>
              Not ChatGPT. Not Claude. This is your own personalized assistant, built around your classes, teachers, tests, textbooks, goals, and schedule.
            </p>
          </div>
          <div className="uc-grid">
            {AGENT_WAYS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="uc-card">
                <div className="uc-icon-flat"><Icon size={24} strokeWidth={1.9} /></div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SCHOOL MARQUEE */}
      <SchoolMarquee />

      {/* EXPLAINER + TESTIMONIALS */}
      <Explainer />

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="dark-section" style={{ padding: "80px 0" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <span className="mono-label" style={{ color: "rgba(61,139,61,.7)" }}>The Process</span>
            <h2 className="section-title" style={{ color: "#fff" }}>
              Select &rarr; Configure &rarr; Live
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px 48px", maxWidth: 1000, margin: "0 auto" }}>
            {[
              { n: "1", phase: "Step 1", title: "Tell Us About Yourself", desc: "Fill out a quick profile with your school, year, and the goals you want your agent to tackle. Takes under two minutes." },
              { n: "2", phase: "Step 2", title: "Build Your Agent", desc: "Choose your agent tier (The Undergraduate, The Graduate, or The Scholar), your hosting plan, support level, and onboarding experience. Standard or White Glove." },
              { n: "3", phase: "Step 3", title: "Complete Your Onboarding Form", desc: "After checkout, you'll receive a personalized onboarding form. This is where your agent gets its identity: your communication style, your schedule, your tools, your goals." },
              { n: "4", phase: "Step 4", title: "Your Agent Goes Live", desc: "Once your completed onboarding form is submitted, our proprietary software develops and spins up your agent, live in 30 minutes to 72 hours. White Glove includes a dedicated 60-minute deep-dive call before your form goes in." },
            ].map((step) => (
              <div key={step.n} style={{ display: "flex", gap: 20 }}>
                <div className="proc-circle" style={{ flexShrink: 0 }}>{step.n}</div>
                <div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(61,139,61,.7)", marginBottom: 5 }}>
                    {step.phase}
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 8 }}>{step.title}</h3>
                  <p style={{ fontSize: 14, lineHeight: 1.75, color: "rgba(255,255,255,.55)" }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <style>{`
            @media (max-width: 680px) {
              #how-it-works .proc-grid { grid-template-columns: 1fr; }
            }
          `}</style>
        </div>
      </section>


      {/* INTEGRATIONS */}
      <IntegrationGlobe />

      {/* SUPPORT PLANS */}

      {/* FAQ */}
      <FAQ />

      {/* CHATBOT */}
      <ChatBot />

      {/* FOOTER */}
      <footer className="dark-section" style={{ padding: "48px 0" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
          <div>
            <div style={{ fontFamily: "var(--font-inter, Inter, sans-serif)", fontSize: 18, fontWeight: 800, letterSpacing: "-.02em", color: "#fff" }}>
              The College <span style={{ color: "var(--green)" }}>[Agent]</span>
            </div>
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(255,255,255,.35)", letterSpacing: ".06em" }}>
              Powered by
              <a href="https://apolloclaw.ai" target="_blank" rel="noopener noreferrer" aria-label="Apollo Claw" style={{ display: "inline-flex", alignItems: "center", borderRadius: 4, background: "#fff", padding: "4px 7px" }}>
                <img src="/apollo-claw.svg" alt="Apollo Claw" style={{ height: 16, width: "auto" }} />
              </a>
            </div>
          </div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {[
              { label: "Book a Consultation", href: CALENDLY },
              { label: "Blog", href: "/blog" },
              { label: "Ambassador Program", href: "/ambassador" },
              { label: "Contact", href: "https://apolloclaw.ai/contact" },
              { label: "Apollo[Claw]", href: "https://apolloclaw.ai" },
              { label: "Privacy Policy", href: "/privacy" },
              { label: "Terms & Conditions", href: "/terms" },
            ].map((link) => (
              <a key={link.label} href={link.href} target={link.href.startsWith("http") ? "_blank" : undefined} rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(255,255,255,.4)", letterSpacing: ".04em", transition: "color .15s" }}>
                {link.label}
              </a>
            ))}
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(255,255,255,.25)", width: "100%", marginTop: 20, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,.06)" }}>
            &copy; 2025 Apollo[Claw]. All rights reserved. &nbsp;&middot;&nbsp; thecollegeagent.ai
          </div>
        </div>
      </footer>

      <style>{`
        /* SHARED TOKENS */
        .mono-label {
          font-family: var(--font-mono); font-size: 11px; font-weight: 600;
          text-transform: uppercase; letter-spacing: .1em; color: var(--green);
          margin-bottom: 14px; display: block;
        }
        .section-title {
          font-size: clamp(26px, 3vw, 40px); font-weight: 800;
          line-height: 1.08; letter-spacing: -.02em; color: var(--navy);
        }
        .section-sub { font-size: 16px; line-height: 1.75; color: rgba(11,23,41,.62); }

        /* NAV WORDMARK */
        .nav-wordmark {
          display: flex; align-items: baseline; gap: 0;
          font-family: var(--font-mono); font-size: 20px; font-weight: 700; letter-spacing: -.01em; line-height: 1;
        }
        .nav-the { font-size: 13px; font-weight: 500; color: rgba(11,23,41,.45); margin-right: 5px; letter-spacing: .01em; }
        .nav-student { color: var(--navy); }
        .nav-bracket { color: var(--green); }
        .nav-agent { color: var(--green); }

        /* BUTTONS */
        .btn-purple {
          display: inline-flex; align-items: center; justify-content: center;
          background: var(--green); color: #fff; font-size: 13px; font-weight: 700;
          letter-spacing: .08em; text-transform: uppercase; padding: 14px 30px;
          border-radius: 4px; box-shadow: 0 8px 24px rgba(61,139,61,.3);
          transition: filter .15s; border: none; cursor: pointer;
        }
        .btn-purple:hover { filter: brightness(1.1); }
        .btn-outline {
          display: inline-flex; align-items: center; justify-content: center;
          background: transparent; color: #fff; font-size: 13px; font-weight: 700;
          letter-spacing: .08em; text-transform: uppercase; padding: 13px 30px;
          border-radius: 4px; border: 1.5px solid rgba(255,255,255,.35);
          transition: border-color .15s, background .15s; cursor: pointer;
        }
        .btn-outline:hover { border-color: #fff; background: rgba(255,255,255,.07); }
        .btn-disabled { opacity: .4; pointer-events: none; }

        /* HERO */
        .hero-grid-bg {
          position: absolute; inset: 0;
          background-image: linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px);
          background-size: 40px 40px; pointer-events: none;
        }
        .hero-glow {
          position: absolute; top: -20%; left: 50%; transform: translateX(-50%);
          width: 70%; height: 120%;
          background: radial-gradient(ellipse at center, rgba(61,139,61,.12) 0%, transparent 60%);
          pointer-events: none;
        }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: var(--font-mono); font-size: 11px; font-weight: 600;
          letter-spacing: .1em; text-transform: uppercase; color: rgba(255,255,255,.6);
          background: rgba(61,139,61,.18); border: 1px solid rgba(61,139,61,.3);
          padding: 6px 14px; border-radius: 99px; margin-bottom: 28px;
        }
        .hero-h1 {
          font-size: clamp(34px, 5vw, 64px); font-weight: 800; line-height: 1.02;
          letter-spacing: -.035em; color: #fff; margin-bottom: 20px;
          white-space: nowrap;
        }
        .hero-sub {
          font-size: clamp(16px, 1.4vw, 19px); line-height: 1.7;
          color: rgba(255,255,255,.65); max-width: 680px; margin: 0 auto 36px;
        }

        /* DUAL BUYER */
        .dual-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .dual-card {
          position: relative; background: #fff; border: 1px solid rgba(11,23,41,.08); border-radius: 18px;
          padding: 34px 34px 36px; overflow: hidden; box-shadow: 0 16px 44px rgba(11,23,41,.06);
        }
        .dual-card::before {
          content: ""; position: absolute; left: 0; right: 0; top: 0; height: 5px; background: var(--green);
        }
        .dual-card-student { border-color: rgba(61,139,61,.22); }
        .dual-card-parent { border-color: rgba(11,23,41,.1); }
        .dual-icon {
          width: 48px; height: 48px; border-radius: 15px; margin-bottom: 18px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(61,139,61,.1); color: var(--green);
        }
        .dual-tag {
          font-family: var(--font-mono); font-size: 10px; font-weight: 700;
          text-transform: uppercase; letter-spacing: .1em; padding: 4px 10px;
          border-radius: 99px; margin-bottom: 16px; display: inline-block;
        }
        .dual-tag-student { background: rgba(61,139,61,.1); color: var(--green); }
        .dual-tag-parent { background: rgba(11,23,41,.07); color: rgba(11,23,41,.55); }
        .dual-card h2 { font-size: 24px; line-height: 1.12; letter-spacing: -.03em; color: var(--navy); margin-bottom: 14px; }
        .dual-card p { font-size: 15px; line-height: 1.72; color: rgba(11,23,41,.72); }

        /* USE CASES */
        .ways-title { white-space: nowrap; }
        .uc-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; }
        .uc-card {
          background: var(--cream2); border: 1px solid rgba(11,23,41,.07); border-radius: 16px;
          padding: 24px; min-height: 218px; box-shadow: 0 8px 28px rgba(11,23,41,.04);
        }
        .uc-icon-flat {
          width: 46px; height: 46px; border-radius: 14px; margin-bottom: 18px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(61,139,61,.1); color: var(--green);
        }
        .uc-card h3 { font-size: 16px; font-weight: 800; color: var(--navy); margin-bottom: 9px; letter-spacing: -.01em; }
        .uc-card p { font-size: 13px; line-height: 1.62; color: rgba(11,23,41,.62); }

        /* PROCESS */
        .proc-circle {
          width: 42px; height: 42px; border-radius: 50%;
          background: rgba(61,139,61,.2); border: 2px solid var(--green); color: #fff;
          font-family: var(--font-mono); font-size: 13px; font-weight: 700;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0; position: relative; z-index: 1;
        }
        .proc-line { width: 1px; flex: 1; background: rgba(61,139,61,.2); margin: 4px 0; min-height: 40px; }

        /* STAT STRIP */
        .stat-grid {
          display: grid; grid-template-columns: repeat(5, 1fr);
          max-width: 1100px; margin: 0 auto; padding: 0 24px;
        }
        .stat-item {
          text-align: center; padding: 0 20px;
          border-right: 1px solid rgba(255,255,255,.15);
        }
        .stat-item:last-child { border-right: none; }
        .stat-num { font-size: clamp(22px, 2.5vw, 34px); font-weight: 800; color: #fff; line-height: 1; margin-bottom: 6px; }
        .stat-label { font-family: var(--font-mono); font-size: 11px; color: rgba(255,255,255,.65); line-height: 1.5; }

        /* INT MENU */
        .int-menu-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }

        /* RESPONSIVE */
        @media (max-width: 900px) {
          .ways-title { white-space: normal; }
          .uc-grid { grid-template-columns: repeat(2, 1fr); }
          .stat-grid { grid-template-columns: repeat(3, 1fr); gap: 20px; }
          .stat-item { border-right: none; border-bottom: 1px solid rgba(255,255,255,.15); padding-bottom: 20px; }
          .stat-item:last-child { border-bottom: none; }
          .int-menu-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .hero-h1 { white-space: normal; font-size: clamp(34px, 10vw, 52px); }
          .dual-grid { grid-template-columns: 1fr; }
          .uc-grid { grid-template-columns: 1fr; }
          .stat-grid { grid-template-columns: repeat(2, 1fr); }
          .int-menu-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </>
  );
}
