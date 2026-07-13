import type { Metadata } from "next";
import Nav from "../components/Nav";
import { PageHero } from "../components/PageHero";
import { Footer } from "../components/Footer";
import { AgentChatDemo } from "../components/AgentChatDemo";

export const metadata: Metadata = {
  title: "What Is an AI Agent? (And How It's Different from a Chatbot)",
  description:
    "A chatbot answers questions. An agent knows you, remembers what matters, connects to your tools, and gets things done. Here's what makes an AI agent different from ChatGPT, and why it matters for college.",
  alternates: { canonical: "https://thecollegeagent.ai/what-is-an-agent" },
  openGraph: {
    title: "What Is an AI Agent? (And How It's Different from a Chatbot)",
    description:
      "A chatbot answers questions. An agent knows you, remembers what matters, connects to your tools, and gets things done.",
    url: "https://thecollegeagent.ai/what-is-an-agent",
    images: [{ url: "https://thecollegeagent.ai/og-image.png", width: 1200, height: 630, alt: "The College Agent" }],
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://thecollegeagent.ai" },
    { "@type": "ListItem", position: 2, name: "What Is an Agent?", item: "https://thecollegeagent.ai/what-is-an-agent" },
  ],
};

// The comparison, framed positively: a great chatbot is a tool you pick up; an agent is a
// teammate that already knows you. We're not knocking ChatGPT — an agent is built on the
// same powerful AI, plus the four things a chatbot doesn't have.
const COMPARISON: { dimension: string; chatbot: string; agent: string }[] = [
  {
    dimension: "Memory",
    chatbot: "Starts fresh every conversation. You re-explain yourself each time.",
    agent: "Remembers you, your classes, your goals, and your history, and gets smarter every week.",
  },
  {
    dimension: "Context",
    chatbot: "Knows the whole internet, but nothing about your life.",
    agent: "Knows your schedule, your syllabi, your deadlines, and how you like to work.",
  },
  {
    dimension: "Action",
    chatbot: "Gives you an answer to copy and paste.",
    agent: "Actually does the work: drafts the email, builds the study plan, tracks the deadline.",
  },
  {
    dimension: "Initiative",
    chatbot: "Waits for you to ask.",
    agent: "Checks in first: reminds you before things are due, and flags what's coming.",
  },
  {
    dimension: "Your tools",
    chatbot: "Lives in its own window.",
    agent: "Connects to Canvas, Gmail, your calendar, and 250+ apps you already use.",
  },
  {
    dimension: "Ownership",
    chatbot: "A shared tool everyone uses the same way.",
    agent: "Yours. Named by you, trained on you, working only for you.",
  },
];

const PILLARS = [
  {
    guy: "/avatars/guy-04.webp",
    title: "It remembers",
    desc: "Every conversation builds on the last. Your agent keeps a durable memory of who you are, so you never start from scratch.",
  },
  {
    guy: "/avatars/guy-12.webp",
    title: "It acts",
    desc: "An agent doesn't just tell you what to do, it does it: drafts, plans, schedules, tracks, and follows up.",
  },
  {
    guy: "/avatars/guy-08.webp",
    title: "It connects",
    desc: "Plugged into the apps you already live in, your agent works where your school and your life actually happen.",
  },
];

export default function WhatIsAnAgentPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Nav />
      <main style={{ paddingTop: 114, minHeight: "100vh", background: "var(--cream2)" }}>
        <PageHero
          label="What Is an Agent?"
          title="A chatbot answers. The College Agent acts."
          sub="It learns how you work, adapts to your preferences, understands your priorities, and delivers increasingly personalized support. Our AI Virtual Agent sets students up for success by providing personalized support that improves organization, reduces academic stress, and helps students thrive."
          primary={{ label: "Build My Agent", href: "/build" }}
          secondary={{ label: "Try the Free Demo", href: "/demo" }}
        />

        {/* THE ONE-LINER */}
        <section style={{ background: "#fff", padding: "72px 0" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px", textAlign: "center" }}>
            <span className="mono-label-green">The Short Version</span>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, color: "var(--navy)", letterSpacing: "-.025em", margin: "0 0 18px" }}>
              A chatbot answers. An agent gets it done.
            </h2>
            <p style={{ fontSize: 17, lineHeight: 1.8, color: "rgba(11,23,41,.7)", margin: 0 }}>
              A chatbot is a brilliant tool you pick up when you have a question. An agent is a
              teammate that already knows you, works in the background, and hands you finished
              work, not just answers. Same great AI underneath, built to actually help you run
              your life.
            </p>
          </div>
        </section>

        {/* THE THREE PILLARS */}
        <section style={{ background: "var(--cream2)", padding: "72px 0" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
            <div style={{ textAlign: "center", marginBottom: 46 }}>
              <span className="mono-label-green">What Makes It an Agent</span>
              <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, color: "var(--navy)", letterSpacing: "-.025em", margin: 0 }}>
                Three things a chatbot can&apos;t do.
              </h2>
            </div>
            <div className="pillar-grid">
              {PILLARS.map(({ guy, title, desc }) => (
                <div key={title} className="pillar-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={guy} alt="" loading="lazy" />
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* THE COMPARISON TABLE */}
        <section style={{ background: "#fff", padding: "72px 0" }}>
          <div style={{ maxWidth: 940, margin: "0 auto", padding: "0 24px" }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <span className="mono-label-green">Side by Side</span>
              <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, color: "var(--navy)", letterSpacing: "-.025em", margin: 0 }}>
                A chatbot vs. your College Agent.
              </h2>
            </div>
            <div className="cmp">
              <div className="cmp-head">
                <div className="cmp-dim" />
                <div className="cmp-col cmp-col--bot">A chatbot (like ChatGPT)</div>
                <div className="cmp-col cmp-col--agent">Your College Agent</div>
              </div>
              {COMPARISON.map(({ dimension, chatbot, agent }) => (
                <div key={dimension} className="cmp-row">
                  <div className="cmp-dim">{dimension}</div>
                  <div className="cmp-cell cmp-cell--bot">{chatbot}</div>
                  <div className="cmp-cell cmp-cell--agent">{agent}</div>
                </div>
              ))}
            </div>
            <p style={{ textAlign: "center", marginTop: 26, fontSize: 14, lineHeight: 1.7, color: "rgba(11,23,41,.55)", maxWidth: 640, marginLeft: "auto", marginRight: "auto" }}>
              None of this makes chatbots bad, they&apos;re incredible. An agent just picks up
              where a chatbot leaves off: it turns great answers into finished work, built around you.
            </p>
          </div>
        </section>

        {/* SEE IT: a chat that proves the point */}
        <AgentChatDemo
          label="See the Difference"
          heading="Ask a chatbot. Then ask your agent."
          body="A chatbot would hand you a generic template. Your agent already has your syllabi, your calendar, and your professor's name, so it just does it."
          background="var(--cream2)"
          messages={[
            { from: "me", text: "Email my professor that I'll miss Thursday's lecture." },
            { from: "bot", text: "Drafted and ready — to Professor Rivera, referencing your BIO 101 section and Thursday's date. Want me to add that you'll get notes from a classmate?" },
            { from: "me", text: "Perfect. Send it." },
            { from: "bot", text: "Sent ✅. I also blocked 30 minutes Friday to catch up on what you'll miss." },
          ]}
        />

        {/* CTA */}
        <section className="dark-section" style={{ padding: "76px 0" }}>
          <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 24px", textAlign: "center" }}>
            <h2 style={{ fontSize: "clamp(26px, 3vw, 38px)", fontWeight: 800, color: "#fff", letterSpacing: "-.03em", marginBottom: 16 }}>
              Ready for an agent of your own?
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: "rgba(255,255,255,.65)", marginBottom: 30 }}>
              Build a personal AI agent that knows your classes, your goals, and your schedule,
              and actually helps you run your college life. Live in about 30 minutes.
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <a href="/build" className="cta-btn">Build My Agent</a>
              <a href="/demo" className="cta-btn-outline">Try the Free Demo</a>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <style>{`
        .dark-section { background: var(--navy, #0b1729); }
        .mono-label-green {
          font-family: var(--font-mono); font-size: 11px; font-weight: 600;
          text-transform: uppercase; letter-spacing: .1em; color: var(--green);
          margin-bottom: 14px; display: block;
        }
        .pillar-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .pillar-card {
          background: #fff; border: 1px solid rgba(11,23,41,.07); border-radius: 18px;
          padding: 32px 28px; box-shadow: 0 8px 28px rgba(11,23,41,.04); text-align: center;
        }
        .pillar-card img { width: 92px; height: auto; margin: 0 auto 6px; display: block; filter: drop-shadow(0 10px 18px rgba(27,94,42,.2)); }
        .pillar-card h3 { font-size: 19px; font-weight: 800; color: var(--navy); margin: 0 0 8px; letter-spacing: -.015em; }
        .pillar-card p { font-size: 14.5px; line-height: 1.65; color: rgba(11,23,41,.66); margin: 0; }
        @media (max-width: 800px) { .pillar-grid { grid-template-columns: 1fr; } }

        /* Comparison table: dimension label + two columns, agent column highlighted green. */
        .cmp { border: 1px solid rgba(11,23,41,.1); border-radius: 16px; overflow: hidden; }
        .cmp-head, .cmp-row { display: grid; grid-template-columns: 130px 1fr 1fr; }
        .cmp-head { background: var(--navy); }
        .cmp-col { padding: 16px 18px; font-size: 13px; font-weight: 700; color: #fff; letter-spacing: -.01em; }
        .cmp-col--agent { background: var(--green); }
        .cmp-row { border-top: 1px solid rgba(11,23,41,.08); }
        .cmp-row:nth-child(even) { background: rgba(11,23,41,.015); }
        .cmp-dim { padding: 16px 18px; font-family: var(--font-mono); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--navy); display: flex; align-items: center; }
        .cmp-cell { padding: 16px 18px; font-size: 13.5px; line-height: 1.55; }
        .cmp-cell--bot { color: rgba(11,23,41,.6); border-left: 1px solid rgba(11,23,41,.06); }
        .cmp-cell--agent { color: var(--navy); font-weight: 500; background: rgba(61,139,61,.06); border-left: 1px solid rgba(61,139,61,.15); }
        @media (max-width: 720px) {
          .cmp-head { display: none; }
          .cmp-row { grid-template-columns: 1fr; }
          .cmp-dim { padding-bottom: 4px; background: rgba(11,23,41,.03); }
          .cmp-cell--bot::before { content: "Chatbot: "; font-weight: 700; color: rgba(11,23,41,.4); }
          .cmp-cell--agent::before { content: "Your Agent: "; font-weight: 700; color: var(--green); }
          .cmp-cell { border-left: none; }
        }

        .cta-btn {
          display: inline-flex; align-items: center; justify-content: center;
          background: var(--green); color: #fff; font-size: 13px; font-weight: 700;
          letter-spacing: .08em; text-transform: uppercase; padding: 14px 30px;
          border-radius: 4px; box-shadow: 0 8px 24px rgba(61,139,61,.3);
          transition: filter .15s; text-decoration: none;
        }
        .cta-btn:hover { filter: brightness(1.1); }
        .cta-btn-outline {
          display: inline-flex; align-items: center; justify-content: center;
          background: transparent; color: #fff; font-size: 13px; font-weight: 700;
          letter-spacing: .08em; text-transform: uppercase; padding: 13px 30px;
          border-radius: 4px; border: 1.5px solid rgba(255,255,255,.35);
          transition: border-color .15s, background .15s; text-decoration: none;
        }
        .cta-btn-outline:hover { border-color: #fff; background: rgba(255,255,255,.07); }
      `}</style>
    </>
  );
}
