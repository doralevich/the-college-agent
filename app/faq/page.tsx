import type { Metadata } from "next";
import Nav from "../components/Nav";
import { Footer } from "../components/Footer";

export const metadata: Metadata = {
  title: "FAQ — The College Agent, AI Companion for College Students",
  description:
    "Common questions about The College Agent AI study companion: what it is, how it works, who it's for, pricing, privacy, and how it compares to ChatGPT.",
  alternates: { canonical: "https://thecollegeagent.ai/faq" },
  openGraph: {
    type: "website",
    title: "FAQ — The College Agent, AI Companion for College Students",
    description:
      "Common questions about The College Agent AI study companion: what it is, how it works, who it's for, pricing, privacy, and how it compares to ChatGPT.",
    url: "https://thecollegeagent.ai/faq",
    images: [{ url: "https://thecollegeagent.ai/og-image.png", width: 1200, height: 630, alt: "The College Agent" }],
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://thecollegeagent.ai" },
    { "@type": "ListItem", position: 2, name: "FAQ", item: "https://thecollegeagent.ai/faq" },
  ],
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
        text: "The College Agent is a personal AI companion built specifically for college students. It manages your class schedule, study plans, internship applications, social calendar, and career goals, and gets smarter the longer you use it.",
      },
    },
    {
      "@type": "Question",
      name: "Can high school students use The College Agent?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. High school students can start using The College Agent to prepare for college, building study habits, researching schools, and getting a head start on their college years.",
      },
    },
    {
      "@type": "Question",
      name: "How does The College Agent help with internships?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The College Agent tracks internship deadlines, helps write outreach emails, manages your application pipeline, and prepares you for interviews, so by junior year you have real experience on your resume.",
      },
    },
    {
      "@type": "Question",
      name: "Is The College Agent different from ChatGPT?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. ChatGPT is a general-purpose tool. The College Agent is dedicated to your college life, it knows your classes, your goals, your schedule, and your progress. It grows with you over 4 years.",
      },
    },
    {
      "@type": "Question",
      name: "What does The College Agent cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The College Agent is one plan with everything included: $599 one-time to build your agent, plus cloud hosting at $25/month or $250/year (the annual price equals ten monthly payments, so two months are free). Every new account starts with $20 of AI usage credits, and there is a 7-day money-back guarantee. Visit thecollegeagent.ai/build to get started.",
      },
    },
    {
      "@type": "Question",
      name: "Is The College Agent safe to use?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Your data is stored securely on the Apollo Claw infrastructure and is never shared or used to train public AI models. Your agent is private to you.",
      },
    },
    {
      "@type": "Question",
      name: "How is The College Agent different from Notion or Google Calendar?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Notion and Google Calendar are organizational tools, they store and display information you put into them. The College Agent is an AI that actively does things: it drafts emails, builds study guides, surfaces deadlines proactively, generates practice questions, and manages your internship pipeline. It doesn't wait for you to organize it. It organizes you.",
      },
    },
    {
      "@type": "Question",
      name: "Can I use The College Agent for graduate school?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Graduate students, MBAs, law students, medical students, PhD candidates, can use The College Agent for thesis research organization, networking in professional programs, fellowship applications, and career planning.",
      },
    },
    {
      "@type": "Question",
      name: "Does The College Agent work with my college's systems?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The College Agent works alongside whatever systems your school uses, Canvas, Blackboard, Brightspace, Google Workspace. You bring your course materials in, and your agent works with them regardless of platform.",
      },
    },
  ],
};

const FAQS = [
  {
    q: "What is The College Agent?",
    a: (
      <>
        <p>The College Agent is a personal AI companion built specifically for college students. Unlike generic AI tools like ChatGPT or Claude, The College Agent is designed entirely around your college life, your classes, your schedule, your goals, your internship pipeline, and your communication style.</p>
        <p>It manages your class schedule, builds study guides from your notes, tracks internship deadlines, drafts professional emails, and helps you build a career plan, all in one system that gets smarter the longer you use it.</p>
        <p>Think of it less like a tool you pull up occasionally and more like a personal AI operator that&apos;s always working in the background on your behalf. It knows your semester rhythm, your professors, your goals, and your communication style, and it uses that context to actually help you, not just give you generic advice.</p>
        <p>Learn more on the <a href="/for-students" style={{ color: "var(--green)" }}>student overview page</a>.</p>
      </>
    ),
  },
  {
    q: "Can high school students use The College Agent?",
    a: (
      <>
        <p>Yes. High school students can, and should, start using The College Agent before they arrive on campus. The students who thrive in college are the ones who arrive with systems already in place.</p>
        <p>Starting in high school means your agent already knows your goals, your work style, and your plans by the time freshman year begins. You&apos;re not setting it up while also adjusting to a new environment, you&apos;re already a step ahead.</p>
        <p>The College Agent helps high schoolers build study habits, think through their 4-year plan, create a LinkedIn profile, and arrive at college ready to perform instead of scrambling to catch up. Junior year is a great time to start, you have time to build habits before senior year, and you&apos;ll arrive at college with a full year of agent context already built up.</p>
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
          <li><strong>Target company tracking</strong>, Research, identify, and monitor companies you&apos;re interested in, with application window alerts surfaced weeks in advance.</li>
          <li><strong>Deadline management</strong>, Application deadlines surface weeks in advance so you have time to prepare properly, not scramble when the window closes.</li>
          <li><strong>Outreach email drafting</strong>, Cold emails to recruiters and alumni, in your voice, that sound natural and professional.</li>
          <li><strong>Application status tracking</strong>, Every application in one place: company, role, status, follow-up date.</li>
          <li><strong>Interview preparation</strong>, Behavioral questions, company research, and case frameworks tailored to your target roles.</li>
          <li><strong>Resume tailoring</strong>, Your base resume gets adjusted for each application to match the specific role and company language.</li>
        </ul>
        <p>The goal is that by junior year, you have real internship experience on your resume, not because you got lucky, but because you had a system working for you since freshman year.</p>
        <p>See full details on the <a href="/internships" style={{ color: "var(--green)" }}>internship prep page</a>.</p>
      </>
    ),
  },
  {
    q: "Is The College Agent different from ChatGPT?",
    a: (
      <>
        <p>Yes, fundamentally different. ChatGPT is a horizontal, general-purpose AI tool. It can help with many things, for anyone, but it doesn&apos;t know you. Every conversation starts from zero. It doesn&apos;t know your classes, your professors, your deadlines, your career goals, or how you like to communicate.</p>
        <p>The College Agent is vertical, built entirely for college students, configured specifically for you. It knows:</p>
        <ul>
          <li>Your school and major</li>
          <li>Your classes and syllabi</li>
          <li>Your communication style</li>
          <li>Your internship targets</li>
          <li>Your 4-year plan and career goals</li>
        </ul>
        <p>That context is what makes it genuinely useful instead of generically capable. It&apos;s not a tool you open when you remember to, it&apos;s a system that&apos;s working on your behalf.</p>
        <p>And because it&apos;s built on the <a href="https://apolloclaw.ai" target="_blank" rel="noopener noreferrer" style={{ color: "var(--green)" }}>Apollo Claw</a> infrastructure, it gets smarter the more you use it, across every semester, every class, every year.</p>
      </>
    ),
  },
  {
    q: "What does The College Agent cost?",
    a: (
      <>
        <p>One plan, everything included: $599 one-time to build and configure your agent, plus cloud hosting at $25/month or $250/year (the annual price equals ten monthly payments, so two months are free). Every new account starts with $20 of AI usage credits, and there is a 7-day money-back guarantee: if it&apos;s not for you, one email within 7 days gets you a full refund.</p>
        <p>To get started, visit <a href="/build" style={{ color: "var(--green)" }}>thecollegeagent.ai/build</a>.</p>
        <p>For context, a single private tutoring session typically costs $80–$150. A college counselor charges $3,000–$10,000. The College Agent covers academic organization, communication support, internship tracking, and career planning, across all four years, for a fraction of what parents typically spend on individual academic services.</p>
        <p>Many parents purchase the agent as a gift for their student, for freshman move-in, a birthday, or as an investment in their four-year success. If you&apos;re a parent considering it for your student, the <a href="/for-parents" style={{ color: "var(--green)" }}>parents page</a> has more context on what to expect.</p>
      </>
    ),
  },
  {
    q: "Is The College Agent safe to use?",
    a: (
      <>
        <p>Yes. Safety and privacy are core to how The College Agent is built. Here&apos;s what you can expect:</p>
        <ul>
          <li><strong>Your data is private</strong>, Your agent&apos;s memory, your class materials, your goals, and your conversations are never shared with other users or used to train public AI models.</li>
          <li><strong>Secure infrastructure</strong>, Every College Agent is hosted on the Apollo Claw platform, which is built with security-first practices. Your data is encrypted in transit and at rest.</li>
          <li><strong>No surveillance</strong>, The agent works for you, not your parents or your school. It&apos;s not a monitoring tool. It&apos;s a personal support system that belongs to the student.</li>
          <li><strong>Academic integrity</strong>, The College Agent is designed to help you organize, prepare, and communicate, not to do your academic work for you. It drafts emails and builds study guides; it doesn&apos;t write your papers or take your exams.</li>
        </ul>
        <p>If you have specific questions about data handling or security, <a href="https://apolloclaw.ai/contact" target="_blank" rel="noopener noreferrer" style={{ color: "var(--green)" }}>contact us directly</a>.</p>
      </>
    ),
  },
  {
    q: "How is The College Agent different from Notion or Google Calendar?",
    a: (
      <>
        <p>Notion and Google Calendar are organizational tools, they store and display information you put into them. They&apos;re passive. They wait for you to update them, maintain them, and actually use them. Most students set up a beautiful Notion dashboard in September and abandon it by October.</p>
        <p>The College Agent is fundamentally different because it&apos;s an AI that actively does things:</p>
        <ul>
          <li><strong>It generates content</strong>, Study guides, practice tests, email drafts, cover letters. Not just places to store them.</li>
          <li><strong>It surfaces information proactively</strong>, Your agent tells you what&apos;s coming before you have to check. You don&apos;t log into it to see your deadlines. It reminds you.</li>
          <li><strong>It improves over time</strong>, The more you use it, the more context it has. After a full semester, your agent knows your patterns, your strengths, and your goals in a way that a calendar app never could.</li>
          <li><strong>It understands your context</strong>, It knows when exam season is, when recruiting season starts, and how to prioritize based on what actually matters right now.</li>
        </ul>
        <p>Think of Notion as a filing cabinet and Google Calendar as a clock. The College Agent is a colleague who knows your schedule, your goals, and your work style, and actively helps you succeed.</p>
      </>
    ),
  },
  {
    q: "Can I use The College Agent for graduate school?",
    a: (
      <>
        <p>Yes. The College Agent is built for college students, but its core capabilities, organization, communication, career planning, and research support, are directly applicable to graduate programs.</p>
        <p>Graduate students who get significant value from The College Agent include:</p>
        <ul>
          <li><strong>MBA students</strong>, Managing recruiting timelines, networking, case prep, and the intense social and academic calendar of a business program.</li>
          <li><strong>Law students</strong>, Tracking course loads, managing law review deadlines, preparing for clerkship applications and bar prep.</li>
          <li><strong>Medical students</strong>, Organizing USMLE study schedules, managing clinical rotations, and tracking residency application timelines.</li>
          <li><strong>PhD candidates</strong>, Research organization, advisor communication, conference submissions, and academic job market preparation.</li>
        </ul>
        <p>If you&apos;re a graduate student and want to discuss whether The College Agent is a fit for your specific program, <a href="https://apolloclaw.ai/contact" target="_blank" rel="noopener noreferrer" style={{ color: "var(--green)" }}>reach out directly</a>.</p>
      </>
    ),
  },
  {
    q: "Does The College Agent work with my college's systems?",
    a: (
      <>
        <p>Yes. The College Agent is designed to work alongside whatever systems your school uses, it doesn&apos;t require any special integration with your university&apos;s platforms.</p>
        <p>Here&apos;s how it works with the most common college platforms:</p>
        <ul>
          <li><strong>Canvas, Blackboard, Brightspace</strong>, You export or copy your syllabus content into your agent. It organizes the deadlines, readings, and assignments automatically.</li>
          <li><strong>Google Workspace / Gmail</strong>, Your agent drafts emails you send from your own account. No integration required; it just helps you write better messages.</li>
          <li><strong>Your school&apos;s course registration system</strong>, You tell your agent what you&apos;re enrolled in. It doesn&apos;t need direct access to your registrar&apos;s portal.</li>
        </ul>
        <p>The College Agent isn&apos;t a plugin for your school&apos;s LMS. It&apos;s a personal AI that works with the information you bring it, which means it works regardless of what system your school uses, and it keeps your academic information private from your institution.</p>
        <p>If you have a specific integration question, <a href="https://apolloclaw.ai/contact" target="_blank" rel="noopener noreferrer" style={{ color: "var(--green)" }}>contact us</a> and we can discuss your setup.</p>
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Nav />
      <main style={{ paddingTop: 142, minHeight: "100vh", background: "var(--cream2)" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px 100px" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--green)" }}>Frequently Asked Questions</span>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: "var(--navy)", marginTop: 10, marginBottom: 12, lineHeight: 1.08, letterSpacing: "-.03em" }}>
            Everything you want to know about The College Agent.
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.75, color: "rgba(11,23,41,.65)", marginBottom: 56 }}>
            Common questions about AI for college students, what The College Agent is, how it works, what it costs, and whether it&apos;s right for you.
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

          {/* INTERNAL LINKS */}
          <div style={{ marginTop: 48, paddingTop: 32, borderTop: "1px solid rgba(11,23,41,.1)" }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--navy)", marginBottom: 16, letterSpacing: "-.02em" }}>Explore More</h2>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <a href="/for-students" style={{ fontSize: 14, color: "var(--green)", textDecoration: "underline", fontWeight: 600 }}>AI for College Students →</a>
              <a href="/for-parents" style={{ fontSize: 14, color: "var(--green)", textDecoration: "underline", fontWeight: 600 }}>For Parents →</a>
              <a href="/study" style={{ fontSize: 14, color: "var(--green)", textDecoration: "underline", fontWeight: 600 }}>AI Study Companion →</a>
            </div>
          </div>

          <div style={{ marginTop: 56, padding: "36px", background: "var(--navy, #0b1729)", borderRadius: 16, textAlign: "center" }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 12, letterSpacing: "-.025em" }}>Ready to build your agent?</h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,.6)", marginBottom: 28, lineHeight: 1.7 }}>
              One plan, everything included. Your agent can be live 30 minutes from now.
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <a href="/build" className="btn-green">Let&apos;s Get Started</a>
              <a href="/about" className="btn-outline-light">About The College Agent</a>
            </div>
          </div>
        </div>
      </main>

      <Footer />

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
