import type { Metadata } from "next";
import Nav from "../components/Nav";
import { PageHero } from "../components/PageHero";
import { Footer } from "../components/Footer";
import { AgentChatDemo } from "../components/AgentChatDemo";
import { ChatbotComparison } from "../components/ChatbotComparison";
import { FourPillars } from "../components/FourPillars";

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

        {/* THE FOUR PILLARS (shared with the homepage) */}
        <FourPillars background="var(--cream2)" />

        {/* THE COMPARISON TABLE (shared with the homepage) */}
        <ChatbotComparison background="#fff" />

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

        {/* CTA — green band so it doesn't melt into the navy footer. */}
        <section style={{ padding: "76px 0", background: "var(--green)" }}>
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

        .cta-btn {
          display: inline-flex; align-items: center; justify-content: center;
          background: #fff; color: var(--green); font-size: 13px; font-weight: 700;
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
