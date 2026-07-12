import type { Metadata } from "next";
import Nav from "../components/Nav";
import { PageHero } from "../components/PageHero";
import { Footer } from "../components/Footer";
import HowItWorksSteps from "./HowItWorksSteps";

export const metadata: Metadata = {
  title: "How It Works, The College Agent",
  description:
    "The whole process, step by step: sign up, pay for your agent, fill out your intake, and your personal AI agent is live within 30 minutes. What you pay, what you get, and how your data stays yours.",
  alternates: { canonical: "https://thecollegeagent.ai/how-it-works" },
  openGraph: {
    title: "How It Works, The College Agent",
    description:
      "The whole process, step by step: sign up, pay for your agent, fill out your intake, and your personal AI agent is live within 30 minutes.",
    url: "https://thecollegeagent.ai/how-it-works",
    images: [{ url: "/og-image.jpg", width: 1200, height: 1200, alt: "The College Agent" }],
  },
};

export default function HowItWorksPage() {
  return (
    <>
      <Nav />
      <main style={{ paddingTop: 114, minHeight: "100vh", background: "var(--cream2)" }}>
        <PageHero
          label="How It Works"
          title="From sign-up to your own College Agent in about 30 minutes."
          sub="Building your agent is simple. Tell us who you are, complete a short intake, personalize your agent, and we bring it to life with your schedule, school, goals, and preferences already built in."
          primary={{ label: "Let's Get Started", href: "/build" }}
          secondary={{ label: "See the Features", href: "/for-students#everything" }}
        />

        {/* THE STEPS — interactive: audience toggle + expandable steps */}
        <section style={{ padding: "72px 0" }}>
          <HowItWorksSteps />
        </section>

        {/* YOUR FILES ARE YOUR FILES */}
        <section style={{ background: "#fff", padding: "64px 0" }}>
          <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px", textAlign: "center" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--green)", marginBottom: 14, display: "block" }}>
              Your Data, Your Rules
            </span>
            <h2 style={{ fontSize: "clamp(24px, 2.6vw, 34px)", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-.02em", color: "var(--navy)", marginBottom: 16 }}>
              Your files are your files.
            </h2>
            <p style={{ fontSize: 15.5, lineHeight: 1.8, color: "rgba(11,23,41,.7)", maxWidth: 640, margin: "0 auto 14px" }}>
              Everything your agent keeps for you, from class notes and syllabi to documents and
              plans, belongs to you. You can download all of your files from your dashboard at any
              time, for any reason. If you ever decide to delete your account, grab everything
              first and walk away with it. No lock-in, ever.
            </p>
            <a href="/build" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: "var(--green)", color: "#fff", fontSize: 13, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", padding: "14px 30px", borderRadius: 4, boxShadow: "0 8px 24px rgba(61,139,61,.3)", textDecoration: "none", marginTop: 14 }}>
              Let&apos;s Get Started
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
