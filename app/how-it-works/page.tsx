import type { Metadata } from "next";
import Nav from "../components/Nav";
import { PageHero } from "../components/PageHero";
import { Footer } from "../components/Footer";
import {
  INTRO_CUTOFF_LABEL,
  INTRO_PLAN_AMOUNT_CENTS,
  REGULAR_PLAN_AMOUNT_CENTS,
  HOSTING_AMOUNT_CENTS,
  introPromoActive,
} from "@/lib/pricing/intro-cutoff";

export const metadata: Metadata = {
  title: "How It Works — The College Agent",
  description:
    "The whole process, step by step: sign up, pay for your agent, fill out your intake, and your personal AI agent is live within 30 minutes. What you pay, what you get, and how your data stays yours.",
  alternates: { canonical: "https://thecollegeagent.ai/how-it-works" },
  openGraph: {
    title: "How It Works — The College Agent",
    description:
      "The whole process, step by step: sign up, pay for your agent, fill out your intake, and your personal AI agent is live within 30 minutes.",
    url: "https://thecollegeagent.ai/how-it-works",
  },
};

function price(cents: number): string {
  const dollars = cents / 100;
  return "$" + dollars.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export default function HowItWorksPage() {
  const promo = introPromoActive();
  const plan = price(promo ? INTRO_PLAN_AMOUNT_CENTS : REGULAR_PLAN_AMOUNT_CENTS);
  const regular = price(REGULAR_PLAN_AMOUNT_CENTS);
  const hosting = price(HOSTING_AMOUNT_CENTS);

  const steps = [
    {
      title: "Sign up",
      body: `Start at thecollegeagent.ai/build. Tap "Let's get started," look over what's included, and enter your name, school email, and phone. No account to create first and no password to invent; your account is created for you at checkout.`,
    },
    {
      title: "Pay for your agent",
      body: `One plan, everything included: ${plan} one-time to build and configure your personal agent${promo ? ` (intro pricing through ${INTRO_CUTOFF_LABEL}; ${regular} after)` : ""}, plus ${hosting}/month for cloud hosting that keeps it running 24/7. Your plan includes $20 of AI usage credits to get you started. Checkout is handled by Stripe; we never see your card number. You can cancel hosting any time and pause over the summer.`,
    },
    {
      title: "Check your email",
      body: `The moment your payment lands, we create your account and email you a magic sign-in link. One tap and you're in your dashboard. Your receipt and order summary arrive alongside it.`,
    },
    {
      title: "Fill out your intake",
      body: `A short, friendly questionnaire: name your agent, give it a face (upload a photo or pick one of ours), then tell it about you, your school, your classes, and how you like to work. It saves as you go, takes about five minutes for the basics, and you can go deeper whenever you want. You can review and edit your answers later from the Checklist tab.`,
    },
    {
      title: "Your agent comes to life",
      body: `When your intake is done, we build your agent automatically. It's provisioned in about a minute and fully live within 30 minutes: personalized with everything you shared, connected to web chat in your dashboard, and reachable on Telegram from your phone.`,
    },
    {
      title: "Start talking",
      body: `Open Chat and just talk to it. The "Now what?" tab walks you through the first moves, and the Checklist tracks everything you can feed it to make it perfect: syllabi, quiz and test schedules, notes, birthdays, budgets, and more. Add it to your phone's home screen so it's one tap away.`,
    },
    {
      title: "Connect your tools",
      body: `Head to Integrations and plug in what you already use: Canvas, Blackbaud, Google Classroom, Gmail, Google Calendar, Outlook, Google Drive, Dropbox, Notion, and thousands more. Your agent can then check deadlines, watch your inbox, and manage your calendar for you.`,
    },
    {
      title: "Credits, after your first $20",
      body: `Your agent's AI usage draws from your credit balance, and your plan includes $20 to start. When it runs low, add more in the Credits tab ($10, $25, or $50), set a low-balance warning, or turn on auto-recharge so it never runs dry. Advanced users can bring their own Anthropic or OpenAI API key instead.`,
    },
    {
      title: "It grows with you",
      body: `Update your intake as life changes, feed it each new semester, and it gets sharper the longer you use it. Love it? Share your referral link: your friend gets their first month of hosting free, and you get a free month when they join.`,
    },
  ];

  return (
    <>
      <Nav />
      <main style={{ paddingTop: 72, minHeight: "100vh", background: "var(--cream2)" }}>
        <PageHero
          label="How It Works"
          title="From sign-up to a living agent in about 30 minutes."
          sub="Here's the entire process, step by step: what you do, what you pay, what you get, and what happens behind the scenes."
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
            <p style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(11,23,41,.55)", maxWidth: 640, margin: "0 auto" }}>
              The details live in our{" "}
              <a href="/privacy" style={{ color: "var(--green)", textDecoration: "underline" }}>Privacy Policy</a>{" "}
              and{" "}
              <a href="/terms" style={{ color: "var(--green)", textDecoration: "underline" }}>Terms &amp; Conditions</a>.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section style={{ background: "var(--navy, #0b1729)", padding: "64px 0" }}>
          <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 24px", textAlign: "center" }}>
            <h2 style={{ fontSize: "clamp(24px, 2.8vw, 34px)", fontWeight: 800, color: "#fff", marginBottom: 14, letterSpacing: "-.025em" }}>
              Ready when you are.
            </h2>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: "rgba(255,255,255,.6)", marginBottom: 28 }}>
              Thirty minutes from now, you could have an agent that knows your classes, your
              schedule, and your goals.
            </p>
            <a href="/build" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: "var(--green)", color: "#fff", fontSize: 13, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", padding: "14px 30px", borderRadius: 4, boxShadow: "0 8px 24px rgba(61,139,61,.3)", textDecoration: "none" }}>
              Let&apos;s Get Started
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
