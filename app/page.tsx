import type { Metadata } from "next";
import SchoolMarquee from "./components/SchoolMarquee";
import Explainer from "./components/Explainer";
import ChatBot from "./components/ChatBot";
import Nav from "./components/Nav";
import IntegrationGlobe from "./components/IntegrationGlobe";
import { Footer } from "./components/Footer";
import { ShieldCheck, Sparkles } from "lucide-react";
import { categoryLabel, getCollegeAgentPosts, postTitle } from "@/lib/sanity-blog";
import { INTRO_PLAN_AMOUNT_CENTS, HOSTING_AMOUNT_CENTS } from "@/lib/pricing/intro-cutoff";

const CALENDLY = "https://calendly.com/therealdaveo/the-college-agent-consult";

// Re-render every 5 minutes so the "most recent posts" section rotates on its own as
// new posts publish (and pricing flips automatically when the intro window closes).
export const revalidate = 300;

function price(cents: number): string {
  return "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 });
}

export const metadata: Metadata = {
  title: "The College Agent: AI Study Companion for College Students",
  description:
    "The College Agent is your AI study companion for all four years of college — plan your schedule, study smarter, prep for internships, and build your career.",
  alternates: { canonical: "https://thecollegeagent.ai" },
};

const AGENT_WAYS = [
  {
    guy: "/avatars/guy-12.webp",
    title: "Own Your Schedule",
    desc: "Your classes, calendar, deadlines, and commitments, all in one place. Your College Agent keeps everything organized, so you always know what's next.",
  },
  {
    guy: "/avatars/guy-04.webp",
    title: "Never Miss a Deadline",
    desc: "Upload a syllabus once, and every assignment, quiz, exam, and due date is tracked automatically, with reminders sent well before each due date.",
  },
  {
    guy: "/avatars/guy-02.webp",
    title: "Study Smarter",
    desc: "Personalized study plans, practice questions, quizzes, and review schedules that adapt to your workload, exams, and changing priorities.",
  },
  {
    guy: "/avatars/guy-11.webp",
    title: "Write with Confidence",
    desc: "Draft professional emails to professors, advisors, recruiters, and classmates in your own voice, ready to review and send.",
  },
  {
    guy: "/avatars/guy-03.webp",
    title: "Manage Your Entire College Life",
    desc: "From classes and campus events to travel, budgets, clubs, and personal goals, your College Agent keeps everything organized in one place.",
  },
  {
    guy: "/avatars/guy-09.webp",
    title: "Build Your Career Early",
    desc: "Create a stronger resume, optimize your LinkedIn profile, find internships, prepare for interviews, and build your professional network, starting freshman year.",
  },
  {
    guy: "/avatars/guy-08.webp",
    title: "Connected to Your Tools",
    desc: "Works with the apps students already rely on, including calendars, email, cloud storage, notes, and learning platforms, bringing everything together in one place.",
  },
  {
    guy: "/avatars/guy-05.webp",
    title: "Always Available",
    desc: "Your College Agent is available 24/7 to answer questions, organize tasks, plan your schedule, and help you stay ahead whenever you need it.",
  },
];

// The proof: things a student can literally type at their agent on day one.
const ASK_CATEGORIES = [
  {
    label: "Academics",
    asks: [
      "Turn this syllabus into my semester plan.",
      "What's due this week?",
      "Quiz me on Chapter 7 before Friday's exam.",
    ],
  },
  {
    label: "Career",
    asks: [
      "Punch up my resume and LinkedIn profile.",
      "Find internships I should apply for this month.",
      "Get me ready for Tuesday's interview.",
    ],
  },
  {
    label: "Life",
    asks: [
      "Find the best flights home for fall break.",
      "Remind me about Mom's birthday and help me pick a gift.",
      "Build me a monthly budget I can actually keep.",
    ],
  },
  {
    label: "Clubs & Activities",
    asks: [
      "Keep my club meetings and events on my calendar.",
      "Plan our fundraiser from idea to event day.",
      "Remind me about intramural games and practices.",
    ],
  },
  {
    label: "Athletics",
    asks: [
      "Run our season travel and keep the whole staff in sync.",
      "Keep recruiting organized from first contact to signing day.",
      "Track every compliance deadline across the program.",
    ],
  },
  {
    label: "Administration",
    asks: [
      "Run orientation from planning through day-of execution.",
      "Keep our office's reports and deadlines on schedule.",
      "Draft communications to students, families, and campus partners.",
    ],
  },
];

function buildJsonLd() {
  const planPrice = (INTRO_PLAN_AMOUNT_CENTS / 100).toFixed(2);
  const hostingPrice = (HOSTING_AMOUNT_CENTS / 100).toFixed(0);
  return {
  "@context": "https://schema.org",
  "@graph": [
    {
      // The brand entity. Anchors "The College Agent" to this domain and its homepage so
      // Google ranks the home page (not a deep page like /terms) for the brand query, and
      // can surface a knowledge panel / brand sitelinks.
      "@type": "Organization",
      "@id": "https://thecollegeagent.ai/#organization",
      name: "The College Agent",
      alternateName: "College Agent",
      url: "https://thecollegeagent.ai",
      logo: "https://thecollegeagent.ai/college-agent-icon.png",
      description:
        "An AI study companion for college students that manages academics, class schedules, notes, deadlines, internships, and career planning across all four years of college.",
      parentOrganization: { "@type": "Organization", name: "Apollo[Claw]", url: "https://apolloclaw.ai" },
    },
    {
      // The site entity — tells Google the homepage is this domain's canonical entry point.
      "@type": "WebSite",
      "@id": "https://thecollegeagent.ai/#website",
      name: "The College Agent",
      url: "https://thecollegeagent.ai",
      inLanguage: "en-US",
      publisher: { "@id": "https://thecollegeagent.ai/#organization" },
    },
    {
      "@type": "Service",
      "@id": "https://thecollegeagent.ai/#service",
      name: "The College Agent",
      alternateName: ["College AI companion", "AI study partner for college students"],
      description:
        "An AI study companion and study partner for enrolled college students that helps with studying, class schedules, notes, deadlines, internships, and career planning across all four years of college.",
      disambiguatingDescription:
        "An ongoing AI study companion for enrolled college students across all four years of college. Not a college admissions, enrollment, or student-registration service.",
      provider: { "@id": "https://thecollegeagent.ai/#organization" },
      url: "https://thecollegeagent.ai",
      serviceType: "AI Companion for College Students",
      category: "Education Technology",
      audience: { "@type": "EducationalAudience", educationalRole: "student" },
      keywords:
        "AI companion for college students, AI study companion, AI study partner, AI for college students, AI class schedule planner, AI college planner, AI internship prep, college AI companion",
      areaServed: "United States",
      offers: [
        { "@type": "Offer", name: "The College Agent (one-time build)", price: planPrice, priceCurrency: "USD" },
        { "@type": "Offer", name: "Cloud hosting (monthly)", price: hostingPrice, priceCurrency: "USD" },
      ],
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://thecollegeagent.ai/#app",
      name: "The College Agent",
      operatingSystem: "Web, iOS, Android",
      applicationCategory: "EducationApplication",
      publisher: { "@id": "https://thecollegeagent.ai/#organization" },
      description:
        "An AI study companion and study partner for college students that helps with studying, class schedules, notes, deadlines, internships, and career planning across all four years of college.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
    {
      "@type": "FAQPage",
      "@id": "https://thecollegeagent.ai/#faq",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is The College Agent?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "The College Agent is a personal AI study companion built specifically for college students — not an admissions tool. It's a 4-year companion that manages your academics, class schedules, study plans, internship pipeline, and career goals across all four years of college. It grows smarter every semester and stays with you from freshman orientation to graduation.",
          },
        },
        {
          "@type": "Question",
          name: "How does The College Agent help college students?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "The College Agent helps college students manage their entire academic and professional life — organizing class schedules, tracking deadlines, building personalized study plans, drafting professor emails, preparing for internship applications, and planning their career path. It's one AI companion that handles everything, from studying smarter to landing your first internship.",
          },
        },
        {
          "@type": "Question",
          name: "Can The College Agent help with internship prep?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. The College Agent tracks internship deadlines, drafts outreach emails to recruiters and alumni, manages your application pipeline, and prepares you for interviews so you can land your first internship before junior year.",
          },
        },
        {
          "@type": "Question",
          name: "Is The College Agent just for freshmen?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. The College Agent is built for all four years of college. Freshmen use it to get organized and build strong habits. Sophomores and juniors use it to lock in internships and build their professional network. Seniors use it to manage career planning, interviews, and the job search. It grows with you every semester.",
          },
        },
        {
          "@type": "Question",
          name: "How is The College Agent different from ChatGPT?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "ChatGPT is a general-purpose tool that starts from zero every conversation. The College Agent is a 4-year AI companion configured for your school, major, classes, and goals — it grows smarter with every semester. It has context about your schedule, your professors, your internship timeline, and your career direction. ChatGPT can answer questions. The College Agent manages your college life.",
          },
        },
      ],
    },
  ],
  };
}

export default async function Home() {
  const jsonLd = buildJsonLd();

  // Three most recent posts, newest first. The blog index sorts oldest-first for its own
  // reasons; here recency is the whole point, so re-sort and slice.
  const recentPosts = (await getCollegeAgentPosts())
    .slice()
    .sort((a, b) => new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime())
    .slice(0, 3);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Nav />

      {/* HERO */}
      <section className="dark-section" style={{
        padding: "162px 0 90px",
        overflow: "hidden",
      }}>
        <div className="hero-glow" />
        <div className="hero-row" style={{
          position: "relative", zIndex: 1,
          maxWidth: 1160, margin: "0 auto", padding: "0 24px",
          alignItems: "center", justifyContent: "space-between",
          gap: 48,
        }}>
          {/* LEFT: text */}
          <div style={{ flex: "1 1 480px", minWidth: 0 }}>
            <div className="hero-badge">
              <span style={{ color: "var(--green)", fontSize: 14 }}>&#9670;</span>
              Apollo[Claw] College Edition
            </div>
            <h1 className="hero-h1" style={{ color: "#fff" }}>
              The AI assistant built <br />for college life.
            </h1>
            <p className="hero-punch">It learns from you! That&apos;s the difference!</p>
            <p className="hero-sub">
              It understands your classes, assignments, deadlines, notes, study plans, calendar,
              professor emails, internships, and goals. It remembers what matters, keeps work
              moving, and becomes smarter with every semester.
            </p>
            <div className="hero-cta-row" style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 28 }}>
              <a href="/build" className="btn-purple">Build My Agent</a>
              <a href="/demo" className="btn-outline">Try the Free Demo</a>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(255,255,255,.5)", maxWidth: 520, marginBottom: 0 }}>
              Built for every stage of college. Manage classes, study smarter, land internships, and prepare for your career, from freshman orientation to graduation.
            </p>
          </div>

          {/* RIGHT: mascot */}
          <div className="hero-mascot-wrap">
            <img
              src="/mascot.webp"
              alt="The College Agent mascot"
              className="hero-mascot"
            />
          </div>
        </div>
      </section>

      {/* WHAT THE COLLEGE AGENT DOES */}
      <section id="what-it-does" style={{ background: "#fff", padding: "72px 0 78px" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <span className="mono-label">What The College Agent Does</span>
            <h2 className="section-title ways-title">
              Your personal college <span style={{ color: "var(--green)" }}>operating system.</span>
            </h2>
            <p className="section-sub ways-sub" style={{ maxWidth: 760, margin: "18px auto 0" }}>
              More than answering questions, your College Agent helps run your academic life. It organizes
              your classes, tracks assignments, manages deadlines, drafts emails, plans your schedule, and
              helps you stay ahead, all in one place.
            </p>
          </div>
          <div className="uc-grid">
            {AGENT_WAYS.map(({ guy, title, desc }) => (
              <div key={title} className="uc-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={guy} alt="" className="uc-guy" loading="lazy" />
                <div className="uc-card-text">
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Grouped by area: Academics, Communication, Career, Life. */}
          <div className="asks-band">
            <div className="asks-head">
              <span className="mono-label asks-eyebrow" style={{ color: "rgba(61,139,61,.85)" }}>Just Ask. It&apos;s Handled.</span>
              <h3>Real conversations with my Agent.</h3>
            </div>
            <div className="asks-cats">
              {ASK_CATEGORIES.map((cat) => (
                <div key={cat.label} className="ask-cat">
                  <div className="ask-cat-label">{cat.label}</div>
                  <div className="ask-cat-chips">
                    {cat.asks.map((ask) => (
                      <div key={ask} className="ask-chip">&ldquo;{ask}&rdquo;</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: "center", marginTop: 32 }}>
              <a href="/build" className="btn-purple">Build My Agent</a>
            </div>
            <div style={{ textAlign: "center", marginTop: 20, display: "flex", justifyContent: "center", gap: 28, flexWrap: "wrap" }}>
              <a href="/study" style={{ fontSize: 13, fontWeight: 600, color: "var(--green)", textDecoration: "underline", textUnderlineOffset: 3 }}>AI Study Companion &rarr;</a>
              <a href="/internships" style={{ fontSize: 13, fontWeight: 600, color: "var(--green)", textDecoration: "underline", textUnderlineOffset: 3 }}>AI Internship Prep &rarr;</a>
            </div>
          </div>
        </div>
      </section>

      {/* DUAL BUYER */}
      <section style={{ background: "var(--cream2)", padding: "70px 0" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px" }}>
          <div className="dual-grid">
            <div className="dual-card dual-card-student">
              <div className="dual-icon"><Sparkles size={24} strokeWidth={1.9} /></div>
              <span className="dual-tag dual-tag-student">For Students</span>
              <h2>Your college life, handled.</h2>
              <p>Your personal AI agent helps manage classes, deadlines, professor emails, study plans, internship prep, and goals, so you stay organized, prepared, and one step ahead.</p>
              <a href="/for-students" style={{ display: "inline-block", marginTop: 16, fontSize: 13, fontWeight: 600, color: "var(--green)", textDecoration: "underline", textUnderlineOffset: 3 }}>See how it works for students &rarr;</a>
            </div>
            <div className="dual-card dual-card-parent">
              <div className="dual-icon"><ShieldCheck size={24} strokeWidth={1.9} /></div>
              <span className="dual-tag dual-tag-parent">For Parents</span>
              <h2>A four-year advantage.</h2>
              <p>More than tutoring. More than AI. Give your student a personalized support system that keeps them organized, accountable, and prepared, from the first day of college to the first job offer.</p>
              <a href="/for-parents" style={{ display: "inline-block", marginTop: 16, fontSize: 13, fontWeight: 600, color: "var(--navy)", textDecoration: "underline", textUnderlineOffset: 3 }}>See how it works for parents &rarr;</a>
            </div>
          </div>
        </div>
      </section>

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
          <div className="process-grid">
            {[
              { n: "1", phase: "Step 1", title: "Sign Up", desc: "Two minutes at thecollegeagent.ai/build: your name, school email, and phone. No account to create first, no password to invent." },
              { n: "2", phase: "Step 2", title: "One Plan, Everything Included", desc: `${price(INTRO_PLAN_AMOUNT_CENTS)} one-time to build your agent, plus hosting at ${price(HOSTING_AMOUNT_CENTS)}/month or $250/year (two months free), with $20 of AI credits included. Secure checkout by Stripe and a 7-day money-back guarantee.` },
              { n: "3", phase: "Step 3", title: "Five-Minute Intake", desc: "Name your agent, give it a face, and tell it about your school, your classes, and how you like to work. It saves as you go." },
              { n: "4", phase: "Step 4", title: "Your Agent Comes to Life", desc: "Live within 30 minutes: personalized with everything you shared, in your dashboard and on Telegram. Feed it a syllabus and watch it go." },
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
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <a
              href="/how-it-works"
              style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "rgba(61,139,61,.9)", textDecoration: "underline", textUnderlineOffset: 4 }}
            >
              The full process, step by step
            </a>
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

      {/* MOST RECENT BLOG POSTS, rotates automatically as new posts publish (ISR above). */}
      {recentPosts.length > 0 && (
        <section style={{ background: "var(--cream2)", padding: "72px 0 76px" }}>
          <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}>
            <div style={{ textAlign: "center", marginBottom: 36 }}>
              <span className="mono-label">From the Blog</span>
              <h2 className="section-title">Most recent posts</h2>
            </div>
            <div className="home-blog-grid">
              {recentPosts.map((post) => {
                const hasImage = Boolean(post.featuredImageUrl);
                const title = postTitle(post);
                return (
                  <article key={post._id} className="home-blog-card">
                    <a href={`/blog/${post.slug.current}`} aria-label={title}>
                      {hasImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={post.featuredImageUrl} alt="" className="home-blog-image" />
                      ) : (
                        // No featured image yet: the header block carries the category
                        // and title itself instead of sitting there blank green.
                        <div className="home-blog-image home-blog-image-fallback">
                          <span className="home-blog-fallback-cat">{categoryLabel(post.category)}</span>
                          <span className="home-blog-fallback-title">{title}</span>
                        </div>
                      )}
                    </a>
                    <div className="home-blog-body">
                      <div className="home-blog-meta">
                        {hasImage && <span className="home-blog-cat">{categoryLabel(post.category)}</span>}
                        {post.publishedAt && (
                          <span className="home-blog-date">
                            {new Date(post.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        )}
                      </div>
                      {hasImage && <h3><a href={`/blog/${post.slug.current}`}>{title}</a></h3>}
                      {post.excerpt ? <p>{post.excerpt}</p> : null}
                      <a className="home-blog-link" href={`/blog/${post.slug.current}`}>Read article</a>
                    </div>
                  </article>
                );
              })}
            </div>
            <div style={{ textAlign: "center", marginTop: 34 }}>
              <a
                href="/blog"
                style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "rgba(61,139,61,.9)", textDecoration: "underline", textUnderlineOffset: 4 }}
              >
                See all posts
              </a>
            </div>
          </div>
        </section>
      )}

      {/* SCHOOL MARQUEE, the trust strip sits at the bottom, just above the footer. */}
      <SchoolMarquee />

      {/* CHATBOT */}
      <ChatBot />

      {/* FOOTER */}
      <Footer />

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
          font-size: clamp(30px, 4vw, 50px); font-weight: 800; line-height: 1.06;
          letter-spacing: -.035em; color: #fff; margin-bottom: 20px; text-align: left;
        }
        .hero-punch {
          font-size: clamp(17px, 1.6vw, 21px); font-weight: 700; color: var(--green);
          margin: 0 0 14px; letter-spacing: -.01em;
        }
        .hero-sub {
          font-size: clamp(16px, 1.4vw, 19px); line-height: 1.7;
          color: rgba(255,255,255,.65); max-width: 680px; margin: 0 0 36px;
        }
        .hero-mascot-wrap {
          flex: 0 0 420px; display: flex; align-items: center; justify-content: center;
        }
        .hero-mascot {
          width: 100%; max-width: 420px; height: auto;
          filter: drop-shadow(0 24px 48px rgba(0,0,0,.35));
          animation: mascot-float 4s ease-in-out infinite;
        }
        @keyframes mascot-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
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

        /* USE CASES — the "what we do" showcase. Oversized header, roomy cards with a
           hover lift so the section reads as the main event, not a feature list. */
        .ways-title { white-space: nowrap; font-size: clamp(30px, 4.4vw, 54px); }
        .ways-sub { font-size: 17.5px; }
        .uc-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        .uc-card {
          background: var(--cream2); border: 1px solid rgba(11,23,41,.07); border-radius: 18px;
          padding: 28px 30px; box-shadow: 0 8px 28px rgba(11,23,41,.04);
          display: flex; gap: 20px; align-items: flex-start;
          transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
        }
        .uc-card:hover {
          transform: translateY(-4px);
          border-color: rgba(61,139,61,.35);
          box-shadow: 0 18px 44px rgba(11,23,41,.10);
        }
        .uc-guy {
          width: 74px; height: auto; flex-shrink: 0; align-self: center;
          filter: drop-shadow(0 10px 18px rgba(27,94,42,.22));
          transition: transform .18s ease;
        }
        .uc-card:hover .uc-guy { transform: scale(1.07); }
        .uc-card-text { min-width: 0; }
        .uc-card h3 { font-size: 19px; font-weight: 800; color: var(--navy); margin-bottom: 8px; letter-spacing: -.015em; }
        .uc-card p { font-size: 14.5px; line-height: 1.68; color: rgba(11,23,41,.66); }
        @media (prefers-reduced-motion: reduce) {
          .uc-card, .uc-guy { transition: none; }
          .uc-card:hover { transform: none; }
          .uc-card:hover .uc-guy { transform: none; }
        }

        /* POWER ASKS */
        .asks-band {
          margin-top: 64px; background: var(--navy); border-radius: 22px;
          padding: 52px 36px 44px; overflow: hidden; position: relative;
        }
        .asks-head { text-align: center; margin-bottom: 34px; }
        .asks-eyebrow { display: block; margin-bottom: 12px; }
        .asks-head h3 {
          font-size: clamp(22px, 2.6vw, 30px); font-weight: 800; color: #fff;
          letter-spacing: -.02em; line-height: 1.2;
        }
        .asks-cats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px 22px; align-items: start; }
        .ask-cat-label {
          font-family: var(--font-mono); font-size: 11px; font-weight: 700; text-transform: uppercase;
          letter-spacing: .1em; color: rgba(61,139,61,.9); margin-bottom: 14px; padding-bottom: 10px;
          border-bottom: 1px solid rgba(255,255,255,.1);
        }
        .ask-cat-chips { display: flex; flex-direction: column; gap: 10px; }
        .ask-chip {
          background: rgba(255,255,255,.06); border: 1px solid rgba(61,139,61,.35);
          border-radius: 12px; padding: 13px 15px;
          font-size: 13.5px; line-height: 1.5; color: rgba(255,255,255,.85); font-style: italic;
        }

        /* HOME BLOG */
        .home-blog-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; }
        .home-blog-card {
          background: #fff; border: 1px solid rgba(11,23,41,.08); border-radius: 16px;
          overflow: hidden; box-shadow: 0 10px 32px rgba(11,23,41,.05);
          display: flex; flex-direction: column;
        }
        .home-blog-image { width: 100%; height: 170px; object-fit: cover; display: block; }
        .home-blog-image-fallback {
          background: linear-gradient(135deg, rgba(61,139,61,.9), var(--navy));
          display: flex; flex-direction: column; justify-content: flex-end;
          gap: 8px; padding: 16px 18px;
        }
        .home-blog-fallback-cat {
          font-family: var(--font-mono); font-size: 10px; font-weight: 700;
          text-transform: uppercase; letter-spacing: .08em; color: rgba(255,255,255,.75);
        }
        .home-blog-fallback-title {
          color: #fff; font-size: 18px; font-weight: 800; line-height: 1.3;
          letter-spacing: -.01em;
          display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
        }
        .home-blog-body { padding: 20px 22px 22px; display: flex; flex-direction: column; flex: 1; }
        .home-blog-meta { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .home-blog-cat {
          font-family: var(--font-mono); font-size: 10px; font-weight: 700;
          text-transform: uppercase; letter-spacing: .08em; color: var(--green);
          background: rgba(61,139,61,.1); padding: 3px 9px; border-radius: 99px;
        }
        .home-blog-date { font-family: var(--font-mono); font-size: 11px; color: rgba(11,23,41,.4); }
        .home-blog-body h3 { font-size: 17px; font-weight: 800; line-height: 1.3; letter-spacing: -.01em; margin-bottom: 8px; }
        .home-blog-body h3 a { color: var(--navy); text-decoration: none; }
        .home-blog-body h3 a:hover { color: var(--green); }
        .home-blog-body p {
          font-size: 13.5px; line-height: 1.65; color: rgba(11,23,41,.6); margin-bottom: 14px;
          display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
        }
        .home-blog-link {
          margin-top: auto; font-family: var(--font-mono); font-size: 11.5px; font-weight: 600;
          letter-spacing: .05em; text-transform: uppercase; color: var(--green);
          text-decoration: underline; text-underline-offset: 3px;
        }

        /* HERO layout — the row is a class (not inline) so the mobile stack below can win. */
        .hero-row { display: flex; }

        /* PROCESS */
        .process-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 32px 48px; max-width: 1000px; margin: 0 auto;
        }
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
          .asks-cats { grid-template-columns: repeat(2, 1fr); gap: 18px 22px; }
          .home-blog-grid { grid-template-columns: 1fr; max-width: 520px; margin: 0 auto; }
          .stat-grid { grid-template-columns: repeat(3, 1fr); gap: 20px; }
          .stat-item { border-right: none; border-bottom: 1px solid rgba(255,255,255,.15); padding-bottom: 20px; }
          .stat-item:last-child { border-bottom: none; }
          .int-menu-grid { grid-template-columns: repeat(2, 1fr); }
          .hero-mascot-wrap { flex: 0 0 280px; }
          .hero-mascot { max-width: 280px; }
        }
        @media (max-width: 640px) {
          /* Stack the hero: mascot on top, centered copy, natural headline wrapping. */
          .hero-row { flex-direction: column; gap: 30px; text-align: center; }
          .hero-h1 { white-space: normal; font-size: clamp(34px, 10vw, 52px); text-align: center; }
          .hero-h1 br { display: none; }
          .hero-punch {
          font-size: clamp(17px, 1.6vw, 21px); font-weight: 700; color: var(--green);
          margin: 0 0 14px; letter-spacing: -.01em;
        }
        .hero-sub { margin-bottom: 28px; }
          .hero-cta-row { justify-content: center; }
          .hero-mascot-wrap { flex: 0 0 auto; order: -1; margin: 0 auto; }
          .hero-mascot { max-width: 200px; }
          .dual-grid { grid-template-columns: 1fr; }
          .uc-grid { grid-template-columns: 1fr; }
          .asks-cats { grid-template-columns: 1fr; gap: 22px; }
          .asks-band { padding: 34px 22px 32px; }
          .stat-grid { grid-template-columns: repeat(2, 1fr); }
          .int-menu-grid { grid-template-columns: 1fr 1fr; }
          .process-grid { grid-template-columns: 1fr; gap: 26px; }
        }
      `}</style>
    </>
  );
}
