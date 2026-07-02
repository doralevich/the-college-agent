import type { Metadata } from "next";
import Nav from "../components/Nav";

export const metadata: Metadata = {
  title: "FAQ — The College Agent",
  description:
    "Answers to the most common questions about The College Agent — what it is, how it works, who it's for, and what it costs.",
  alternates: { canonical: "https://thecollegeagent.ai/faq" },
  openGraph: {
    title: "FAQ — The College Agent",
    description:
      "Answers to the most common questions about The College Agent — what it is, how it works, who it's for, and what it costs.",
    url: "https://thecollegeagent.ai/faq",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is The College Agent?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The College Agent is a personal AI companion built specifically for college students. It manages your class schedule, study plans, internship applications, social calendar, and career goals — and gets smarter the longer you use it.",
      },
    },
    {
      "@type": "Question",
      name: "Can high school students use The College Agent?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. High school students can start using The College Agent to prepare for college — building study habits, researching schools, and getting a head start on their college years.",
      },
    },
    {
      "@type": "Question",
      name: "How does The College Agent help with internships?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The College Agent tracks internship deadlines, helps write outreach emails, manages your application pipeline, and prepares you for interviews — so by junior year you have real experience on your resume.",
      },
    },
    {
      "@type": "Question",
      name: "Is The College Agent different from ChatGPT?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. ChatGPT is a general-purpose tool. The College Agent is dedicated to your college life — it knows your classes, your goals, your schedule, and your progress. It grows with you over 4 years.",
      },
    },
    {
      "@type": "Question",
      name: "What does The College Agent cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The College Agent offers flexible plans. Visit thecollegeagent.ai/build to see current pricing.",
      },
    },
  ],
};

const FAQS = [
  {
    q: "What is The College Agent?",
    a: (
      <>
        <p>The College Agent is a personal AI companion built specifically for college students. Unlike generic AI tools like ChatGPT or Claude, The College Agent is designed entirely around your college life — your classes, your schedule, your goals, your internship pipeline, and your communication style.</p>
        <p>It manages your class schedule, builds study guides from your notes, tracks internship deadlines, drafts professional emails, and helps you build a career plan — all in one system that gets smarter the longer you use it.</p>
        <p>Think of it less like a tool you pull up occasionally and more like a personal AI operator that&apos;s always working in the background on your behalf.</p>
        <p>Learn more on the <a href="/for-students" style={{ color: "var(--green)" }}>student overview page</a>.</p>
      </>
    ),
  },
  {
    q: "Can high school students use The College Agent?",
    a: (
      <>
        <p>Yes. High school students can — and should — start using The College Agent before they arrive on campus. The students who thrive in college are the ones who arrive with systems already in place.</p>
        <p>Starting in high school means your agent already knows your goals, your work style, and your plans by the time freshman year begins. You&apos;re not setting it up while also adjusting to a new environment — you&apos;re already a step ahead.</p>
        <p>The College Agent helps high schoolers build study habits, think through their 4-year plan, and arrive at college ready to perform instead of scrambling to catch up.</p>
        <p>Read more on the <a href="/for-high-school" style={{ color: "var(--green)" }}>high school students page</a>.</p>
      </>
    ),
  },
  {
    q: "How does The College Agent help with internships?",
    a: (
      <>
        <p>The College Agent manages your entire internship pipeline from first research to signed offer. Here&apos;s what that includes:</p>
        <ul>
          <li><strong>Target company tracking</strong> — Research, identify, and monitor companies you&apos;re interested in, with application window alerts.</li>
          <li><strong>Deadline management</strong> — Application deadlines surface weeks in advance so you have time to prepare properly.</li>
          <li><strong>Outreach email drafting</strong> — Cold emails to recruiters and alumni, in your voice, that sound natural and professional.</li>
          <li><strong>Application status tracking</strong> — Every application in one place: company, role, status, follow-up date.</li>
          <li><strong>Interview preparation</strong> — Behavioral questions, company research, case frameworks tailored to your target roles.</li>
        </ul>
        <p>The goal is that by junior year, you have real internship experience on your resume — not because you got lucky, but because you had a system working for you since freshman year.</p>
        <p>See full details on the <a href="/internships" style={{ color: "var(--green)" }}>internship prep page</a>.</p>
      </>
    ),
  },
  {
    q: "Is The College Agent different from ChatGPT?",
    a: (
      <>
        <p>Yes — fundamentally different. ChatGPT is a horizontal, general-purpose AI tool. It can help with many things, for anyone, but it doesn&apos;t know you. Every conversation starts from zero. It doesn&apos;t know your classes, your professors, your deadlines, your career goals, or how you like to communicate.</p>
        <p>The College Agent is vertical — built entirely for college students, configured specifically for you. It knows:</p>
        <ul>
          <li>Your school and major</li>
          <li>Your classes and syllabi</li>
          <li>Your communication style</li>
          <li>Your internship targets</li>
          <li>Your 4-year plan and career goals</li>
        </ul>
        <p>That context is what makes it genuinely useful instead of generically capable. It&apos;s not a tool you open when you remember to — it&apos;s a system that&apos;s working on your behalf.</p>
        <p>And because it&apos;s built on the <a href="https://apolloclaw.ai" target="_blank" rel="noopener noreferrer" style={{ color: "var(--green)" }}>Apollo Claw</a> infrastructure, it gets smarter the more you use it — across every semester, every class, every year.</p>
      </>
    ),
  },
  {
    q: "What does The College Agent cost?",
    a: (
      <>
        <p>The College Agent offers flexible plans designed for different students and families. Plans vary by agent tier, hosting, support level, and onboarding experience.</p>
        <p>To see current pricing and choose the right plan, visit <a href="/build" style={{ color: "var(--green)" }}>thecollegeagent.ai/build</a>.</p>
        <p>Many parents purchase the agent as a gift for their student — for freshman move-in, a birthday, or as an investment in their four-year success. If you&apos;re a parent considering it for your student, the <a href="/for-parents" style={{ color: "var(--green)" }}>parents page</a> has more context on what to expect.</p>
      </>
    ),
  },
];

export default function FAQPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Nav />
      <main style={{ paddingTop: 100, minHeight: "100vh", background: "var(--cream2)" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px 100px" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--green)" }}>Frequently Asked Questions</span>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: "var(--navy)", marginTop: 10, marginBottom: 12, lineHeight: 1.08, letterSpacing: "-.03em" }}>
            Everything you want to know about The College Agent.
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.75, color: "rgba(11,23,41,.65)", marginBottom: 56 }}>
            Can&apos;t find your answer here? <a href="https://apolloclaw.ai/contact" target="_blank" rel="noopener noreferrer" style={{ color: "var(--green)", textDecoration: "underline" }}>Contact us</a> directly.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
            {FAQS.map(({ q, a }) => (
              <div key={q} style={{ background: "#fff", borderRadius: 16, padding: "32px 36px", border: "1px solid rgba(11,23,41,.07)", boxShadow: "0 4px 16px rgba(11,23,41,.04)" }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--navy)", marginBottom: 20, lineHeight: 1.2, letterSpacing: "-.02em" }}>
                  {q}
                </h2>
                <div className="faq-body">{a}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 56, padding: "36px", background: "var(--navy, #0b1729)", borderRadius: 16, textAlign: "center" }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 12, letterSpacing: "-.025em" }}>Ready to build your agent?</h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,.6)", marginBottom: 28, lineHeight: 1.7 }}>
              Pick your plan and have your agent live in as little as 30 minutes.
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <a href="/build" className="btn-green">See Plans & Pricing</a>
              <a href="/about" className="btn-outline-light">About The College Agent</a>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .faq-body p { font-size: 15px; line-height: 1.8; color: rgba(11,23,41,.7); margin-bottom: 14px; }
        .faq-body ul { padding-left: 20px; margin-bottom: 14px; }
        .faq-body li { font-size: 15px; line-height: 1.8; color: rgba(11,23,41,.7); margin-bottom: 6px; }
        .faq-body strong { color: var(--navy); }
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
      `}</style>
    </>
  );
}
