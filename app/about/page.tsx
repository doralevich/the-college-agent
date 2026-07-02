import type { Metadata } from "next";
import Nav from "../components/Nav";

export const metadata: Metadata = {
  title: "About The College Agent — AI Built for Your Entire College Journey",
  description:
    "The College Agent is a personal AI companion built by Apollo Claw to solve the real challenges college students face — from freshman orientation to senior career planning.",
  alternates: { canonical: "https://thecollegeagent.ai/about" },
  openGraph: {
    title: "About The College Agent — AI Built for Your Entire College Journey",
    description:
      "The College Agent is a personal AI companion built by Apollo Claw to solve the real challenges college students face — from freshman orientation to senior career planning.",
    url: "https://thecollegeagent.ai/about",
  },
};

export default function AboutPage() {
  return (
    <>
      <Nav />
      <main style={{ paddingTop: 100, minHeight: "100vh", background: "var(--cream2)" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px 100px" }}>
          <span className="mono-label">Our Mission</span>
          <h1 style={{ fontSize: "clamp(30px, 4vw, 48px)", fontWeight: 800, color: "var(--navy)", marginTop: 10, marginBottom: 20, lineHeight: 1.08, letterSpacing: "-.03em" }}>
            AI Built for Your Entire College Journey
          </h1>
          <p className="lead-text">
            College is one of the most important and overwhelming four-year stretches of a person&apos;s life. There are classes to manage, deadlines to hit, internships to land, connections to build, and a career to plan — all at once, with very little infrastructure to help you stay on top of it.
          </p>

          <Section title="Why The College Agent Exists">
            <p>
              The College Agent was built by <a href="https://apolloclaw.ai" target="_blank" rel="noopener noreferrer" style={{ color: "var(--green)" }}>Apollo Claw</a>, an AI infrastructure company focused on building personalized AI systems for real people in real situations. The problem was simple: generic AI tools like ChatGPT are powerful, but they don&apos;t know you. They don&apos;t know your professors, your schedule, your goals, your internship deadlines, or your communication style. Every time you open them, you start from zero.
            </p>
            <p>
              College students needed something different — an AI that grows with them, remembers what matters, and gets smarter with every semester. That&apos;s what The College Agent is.
            </p>
          </Section>

          <Section title="What Makes It Different from Generic AI">
            <p>
              Most AI tools are horizontal — they can do many things for anyone. The College Agent is vertical: it&apos;s designed entirely around the college student experience. It knows the rhythm of a semester. It understands the difference between a midterm week and a recruiting season. It helps you write a cold email to a recruiter the same way it helps you draft a request to a professor for an extension.
            </p>
            <p>
              When you set up your College Agent, you tell it about your school, your major, your year, your goals, and how you work. From that point forward, it operates as your personal AI operator — not a tool you pull up when you remember to, but a system that&apos;s always ready when you need it.
            </p>
            <ul>
              <li><strong>It knows your classes</strong> — your professors, your syllabi, your assignment deadlines.</li>
              <li><strong>It tracks your goals</strong> — internship targets, LinkedIn milestones, career ambitions.</li>
              <li><strong>It learns your voice</strong> — so emails it drafts actually sound like you.</li>
              <li><strong>It grows smarter</strong> — the longer you use it, the more effective it becomes.</li>
            </ul>
          </Section>

          <Section title="The 4-Year Vision">
            <p>
              Most tools help you today. The College Agent is built for the long game.
            </p>
            <p>
              By <strong>sophomore year</strong>, your agent knows your academic patterns, your strongest subjects, and which professors you work best with. It&apos;s helping you plan the semesters ahead, not just the week in front of you.
            </p>
            <p>
              By <strong>junior year</strong>, you have internship experience on your resume, a LinkedIn that actually reflects your work, and a network of connections your agent has helped you maintain. You&apos;re not scrambling in recruiting season — you&apos;re prepared.
            </p>
            <p>
              By <strong>senior year</strong>, your post-graduation plan is already in motion. Your agent has been working alongside you for three years. You&apos;re not starting your career from scratch — you&apos;re building on a foundation.
            </p>
            <p>
              That&apos;s the difference between a tool and a companion. The College Agent is the latter.
            </p>
          </Section>

          <Section title="Built on Real Infrastructure">
            <p>
              Every College Agent is built on the Apollo Claw AI platform — the same infrastructure used by professionals, consultants, and companies who need AI that actually works for their specific context. Students get access to that same power, configured entirely for college life.
            </p>
            <p>
              Your agent is named, personalized, and yours. It&apos;s not a shared product. It&apos;s not a generic subscription. It&apos;s an AI built around the way you work.
            </p>
          </Section>

          <div style={{ marginTop: 48, display: "flex", gap: 16, flexWrap: "wrap" }}>
            <a href="/build" className="btn-purple">Build My Agent</a>
            <a href="/for-students" className="btn-outline-dark">For Students</a>
            <a href="/blog" className="btn-outline-dark">Read the Blog</a>
          </div>
        </div>
      </main>

      <style>{`
        .mono-label {
          font-family: var(--font-mono); font-size: 11px; font-weight: 600;
          text-transform: uppercase; letter-spacing: .1em; color: var(--green);
          margin-bottom: 14px; display: block;
        }
        .lead-text {
          font-size: 18px; line-height: 1.75; color: rgba(11,23,41,.75);
          margin-bottom: 40px; font-weight: 400;
        }
        main p { font-size: 15px; line-height: 1.8; color: rgba(11,23,41,.7); margin-bottom: 14px; }
        main ul { padding-left: 20px; margin-bottom: 14px; }
        main li { font-size: 15px; line-height: 1.8; color: rgba(11,23,41,.7); margin-bottom: 8px; }
        main strong { color: var(--navy); }
        main a { text-decoration: underline; }
        .btn-purple {
          display: inline-flex; align-items: center; justify-content: center;
          background: var(--green); color: #fff; font-size: 13px; font-weight: 700;
          letter-spacing: .08em; text-transform: uppercase; padding: 14px 30px;
          border-radius: 4px; box-shadow: 0 8px 24px rgba(61,139,61,.3);
          transition: filter .15s; border: none; cursor: pointer; text-decoration: none;
        }
        .btn-purple:hover { filter: brightness(1.1); }
        .btn-outline-dark {
          display: inline-flex; align-items: center; justify-content: center;
          background: transparent; color: var(--navy); font-size: 13px; font-weight: 700;
          letter-spacing: .08em; text-transform: uppercase; padding: 13px 30px;
          border-radius: 4px; border: 1.5px solid rgba(11,23,41,.25);
          transition: border-color .15s; cursor: pointer; text-decoration: none;
        }
        .btn-outline-dark:hover { border-color: var(--navy); }
      `}</style>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--navy)", marginBottom: 16, letterSpacing: "-.02em" }}>{title}</h2>
      {children}
    </div>
  );
}
