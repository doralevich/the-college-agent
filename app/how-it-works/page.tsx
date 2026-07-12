import type { Metadata } from "next";
import Nav from "../components/Nav";
import { PageHero } from "../components/PageHero";
import { Footer } from "../components/Footer";
import {
  INTRO_PLAN_AMOUNT_CENTS,
  HOSTING_AMOUNT_CENTS,
} from "@/lib/pricing/intro-cutoff";

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

function price(cents: number): string {
  const dollars = cents / 100;
  return "$" + dollars.toLocaleString("en-US", { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 });
}

export default function HowItWorksPage() {
    const plan = price(INTRO_PLAN_AMOUNT_CENTS);
  const hosting = price(HOSTING_AMOUNT_CENTS);

  const steps = [
    {
      title: "Create Your Account",
      body: `Start at thecollegeagent.ai/build and enter your name, school email, and phone number. Your account is automatically created during checkout, so there's nothing extra to set up.`,
    },
    {
      title: "Choose Your Plan",
      body: `One plan. Everything included. ${plan} one-time to build and personalize your College Agent, plus secure cloud hosting: your choice of ${hosting}/month or $250/year (two months free). Includes $20 in AI credits to get started. Secure checkout with Stripe, and a 7-day money-back guarantee.`,
    },
    {
      title: "Personalize Your Agent",
      body: `In about five minutes, tell your College Agent about yourself. Choose its name and appearance, then share your school, classes, goals, schedule, and how you like to work. You can update your information anytime as your college life evolves.`,
    },
    {
      title: "We Build Your Agent",
      body: `Once your intake is complete, we configure your personalized College Agent behind the scenes. Within about 30 minutes, it's live and ready in your dashboard and on your phone.`,
    },
    {
      title: "Start Using Your Agent",
      body: `Upload your syllabi, class schedule, notes, and other important information. From there, simply talk to your agent. Ask questions. Plan your week. Draft emails. Prepare for exams. Track internships. Manage your entire college life.`,
    },
    {
      title: "Connect the Tools You Already Use",
      body: `Your College Agent works with the apps students rely on every day, including Canvas, Gmail, Google Calendar, Google Drive, Outlook, Notion, Microsoft Teams, Dropbox, Telegram, and hundreds more. The more you connect, the more your agent can help.`,
    },
  ];

  return (
    <>
      <Nav />
      <main style={{ paddingTop: 114, minHeight: "100vh", background: "var(--cream2)" }}>
        <PageHero
          label="How It Works"
          title="From sign-up to your own College Agent in about 30 minutes."
          sub="Building your agent is simple. You choose your plan, complete a short intake, personalize your agent, and we bring it to life with your schedule, school, goals, and preferences already built in."
          primary={{ label: "Let's Get Started", href: "/build" }}
          secondary={{ label: "See the Features", href: "/for-students#everything" }}
        />

        {/* THE STEPS */}
        <section style={{ padding: "72px 0" }}>
          <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px" }}>
            <div style={{ display: "grid", gap: 30 }}>
              {steps.map(({ title, body }, i) => (
                <div key={title} style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(61,139,61,.1)", border: "2px solid var(--green)", color: "var(--green)", fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                    {i + 1}
                  </div>
                  <div>
                    <h2 style={{ fontSize: 19, fontWeight: 800, color: "var(--navy)", margin: "0 0 6px", letterSpacing: "-.015em" }}>{title}</h2>
                    <p style={{ fontSize: 15, lineHeight: 1.75, color: "rgba(11,23,41,.7)", margin: 0 }}>{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
