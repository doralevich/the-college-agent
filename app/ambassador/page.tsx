import type { Metadata } from "next";
import { CalendarCheck2, FileText, ListChecks, Sparkles, TrendingUp, BookOpen } from "lucide-react";
import Nav from "../components/Nav";

export const metadata: Metadata = {
  title: "Become a College Agent Campus Ambassador | The College Agent",
  description:
    "Apply to become a College Agent Campus Ambassador. Help students succeed, build your resume, gain leadership experience, and earn commissions representing one of the first AI platforms built for college students.",
  alternates: { canonical: "https://thecollegeagent.ai/ambassador" },
  openGraph: {
    title: "Become a College Agent Campus Ambassador",
    description:
      "Represent one of the first AI platforms built for college students. Build your resume, gain real-world experience, and earn commissions.",
    url: "https://thecollegeagent.ai/ambassador",
  },
  twitter: {
    title: "Become a College Agent Campus Ambassador",
    description:
      "Help students succeed. Build your resume. Earn commissions.",
  },
};

const STUDENT_USES = [
  { icon: ListChecks,     title: "Stay Organized",      desc: "Assignments, deadlines, notes, and syllabi — all in one place." },
  { icon: BookOpen,       title: "Study Smarter",       desc: "Turn class notes into study guides, flashcards, quizzes, and review tools." },
  { icon: CalendarCheck2, title: "Manage your Workload", desc: "Build study plans around exams, projects, work, and activities." },
  { icon: FileText,       title: "Writing & Research",  desc: "Organize sources, format citations, and keep papers on track." },
  { icon: TrendingUp,     title: "Track your Progress", desc: "Monitor grades, calculate averages, and identify areas to improve." },
];

const LOOKING_FOR = [
  "Are respected and well-connected within their university community",
  "Demonstrate strong communication and relationship-building skills",
  "Are passionate about helping fellow students succeed",
  "Have an interest in AI, innovation, and emerging technology",
  "Want to gain meaningful leadership and professional experience",
];

const INCLUDED = [
  "Your own custom College Agent — built specifically for your success",
  "Ambassador Toolkit",
  "Onboarding & training",
  "Direct access to the College Agent team",
];

const GAINED = [
  "Leadership experience",
  "Resume-building experience",
  "Hands-on exposure to AI and emerging technology",
  "Communication and professional networking skills",
  "The opportunity to earn commissions",
];

const COMMISSION_TIERS = [
  { qty: 10, bonus: 250 },
  { qty: 25, bonus: 750 },
  { qty: 50, bonus: 1800 },
];

const HOW_IT_WORKS = [
  { num: "01", title: "Apply",  text: "Submit a short application." },
  { num: "02", title: "Launch", text: "Receive your personalized College Agent, referral link, and Ambassador Toolkit." },
  { num: "03", title: "Lead",   text: "Share The College Agent with your network, help fellow students succeed, and earn commissions for every qualified purchase." },
];

export default function AmbassadorPage() {
  return (
    <>
      <Nav />
      <main style={{ paddingTop: 72, minHeight: "100vh", background: "var(--cream2)" }}>
        <section className="affiliate-hero dark-section">
          <div className="affiliate-glow" />
          <div className="affiliate-shell hero-shell">
            <div className="affiliate-copy">
              <div className="hero-badge">
                <span style={{ color: "var(--green)", fontSize: 14 }}>&#9670;</span>
                Campus Ambassador Program
              </div>
              <h1>Become a College Agent Campus Ambassador.</h1>
              <p className="hero-tagline">Help students succeed. Build your resume. Earn commissions.</p>
              <p>
                Our AI Virtual Agent sets students up for success by providing personalized support
                that reduces academic stress and helps students thrive. Represent it on your campus,
                gain real-world experience, and turn your network into opportunity.
              </p>
              <div className="affiliate-actions">
                <a href="/ambassador/apply" className="btn-purple">Apply Now</a>
                <a href="/build" className="btn-outline">See the Agent</a>
              </div>
            </div>
            <div className="affiliate-panel" aria-label="Ambassador program highlights">
              <div className="panel-icon"><Sparkles size={26} strokeWidth={1.9} /></div>
              <h2>Why join</h2>
              <p>
                Gain real-world experience, strengthen your resume, and earn commissions while
                making a meaningful impact on campus.
              </p>
              <div className="mini-stat-grid">
                <div><strong>$75</strong><span>per qualified purchase</span></div>
                <div><strong>+$1800</strong><span>at 50 qualified purchases</span></div>
                <div><strong>1:1</strong><span>access to the team</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="affiliate-section">
          <div className="affiliate-shell">
            <div className="section-heading">
              <span className="mono-label">Why Students Use The College Agent</span>
              <h2>A 24/7 AI-powered academic assistant built for college students.</h2>
              <p>
                Personalized for each student — not a general chatbot. An agent that knows your
                classes, your schedule, and your goals.
              </p>
            </div>
            <div className="fit-grid uses-grid">
              {STUDENT_USES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="fit-card use-card">
                  <div className="fit-icon"><Icon size={23} strokeWidth={1.9} /></div>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="affiliate-section program-band">
          <div className="affiliate-shell">
            <div className="section-heading">
              <span className="mono-label">Why Become an Ambassador?</span>
              <h2>This is more than a referral program.</h2>
              <p>
                As a College Agent Ambassador, you&apos;ll represent an emerging AI platform while gaining
                practical experience that can strengthen your resume and prepare you for internships and
                future careers.
              </p>
            </div>
          </div>
        </section>

        <section className="affiliate-section">
          <div className="affiliate-shell two-col-section">
            <div>
              <span className="mono-label">Who We&apos;re Looking For</span>
              <h2>We&apos;re looking for students who:</h2>
              <ul className="bullet-list">
                {LOOKING_FOR.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <div className="two-col-cards">
              <div className="info-card">
                <span className="mono-label">What&apos;s Included</span>
                <ul className="bullet-list">
                  {INCLUDED.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
              <div className="info-card">
                <span className="mono-label">What You&apos;ll Gain</span>
                <ul className="bullet-list">
                  {GAINED.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="affiliate-section commissions-section">
          <div className="affiliate-shell">
            <div className="section-heading">
              <span className="mono-label">Commissions</span>
              <h2>Earn $75 for every qualified purchase — plus growth incentives.</h2>
            </div>
            <div className="tier-grid">
              {COMMISSION_TIERS.map(({ qty, bonus }) => (
                <div key={qty} className="tier-card">
                  <span className="tier-qty">{qty}</span>
                  <span className="tier-label">Qualified Purchases</span>
                  <span className="tier-arrow">&rarr;</span>
                  <span className="tier-bonus">+${bonus.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="affiliate-section how-section">
          <div className="affiliate-shell">
            <div className="section-heading">
              <span className="mono-label">How It Works</span>
              <h2>Three steps.</h2>
            </div>
            <div className="how-grid">
              {HOW_IT_WORKS.map(({ num, title, text }) => (
                <div key={num} className="how-card">
                  <span className="how-num">{num}</span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="affiliate-section final-cta-section">
          <div className="affiliate-shell">
            <div className="final-cta-card">
              <span className="mono-label">Ready to Apply?</span>
              <h2>Apply to Become a Campus Ambassador!</h2>
              <p>
                Make an impact. Help students. Grow with College Agent.
              </p>
              <p className="applications-note">Applications are now open.</p>
              <a href="/ambassador/apply" className="btn-purple final-cta-btn">Apply Now</a>
            </div>
          </div>
        </section>
      </main>

      <style>{`
        .affiliate-shell {
          width: min(1160px, calc(100% - 48px));
          margin: 0 auto;
        }
        main {
          overflow-x: hidden;
        }
        main *,
        main *::before,
        main *::after {
          box-sizing: border-box;
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: rgba(255,255,255,.6);
          background: rgba(61,139,61,.18);
          border: 1px solid rgba(61,139,61,.3);
          padding: 6px 14px;
          border-radius: 99px;
          margin-bottom: 28px;
        }
        .btn-outline {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          color: #fff;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
          padding: 13px 30px;
          border-radius: 4px;
          border: 1.5px solid rgba(255,255,255,.35);
          transition: border-color .15s, background .15s;
          cursor: pointer;
        }
        .btn-outline:hover {
          border-color: #fff;
          background: rgba(255,255,255,.07);
        }
        .affiliate-hero {
          position: relative;
          overflow: hidden;
          padding: 96px 0 72px;
        }
        .affiliate-glow {
          position: absolute;
          inset: -20% auto auto 45%;
          width: 680px;
          height: 680px;
          background: radial-gradient(circle, rgba(61,139,61,.22), transparent 62%);
          pointer-events: none;
        }
        .hero-shell {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(320px, .9fr);
          gap: 48px;
          align-items: center;
        }
        .affiliate-copy,
        .affiliate-panel,
        .request-copy,
        .ambassador-form {
          min-width: 0;
          max-width: 100%;
          overflow-wrap: break-word;
        }
        .affiliate-copy h1 {
          color: #fff;
          font-size: clamp(38px, 6vw, 68px);
          line-height: 1.02;
          letter-spacing: 0;
          margin-bottom: 22px;
          max-width: 100%;
        }
        .affiliate-copy p {
          max-width: 690px;
          color: rgba(255,255,255,.68);
          font-size: 18px;
          line-height: 1.75;
          margin-bottom: 34px;
        }
        .affiliate-actions {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          max-width: 100%;
        }
        .affiliate-panel {
          border: 1px solid rgba(255,255,255,.14);
          border-radius: 8px;
          background: rgba(255,255,255,.08);
          box-shadow: 0 28px 80px rgba(0,0,0,.24);
          padding: 34px;
          backdrop-filter: blur(18px);
        }
        .panel-icon, .fit-icon {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(61,139,61,.16);
          color: var(--green);
          margin-bottom: 18px;
        }
        .affiliate-panel h2 {
          color: #fff;
          font-size: 25px;
          line-height: 1.15;
          margin-bottom: 12px;
        }
        .affiliate-panel p {
          color: rgba(255,255,255,.62);
          font-size: 15px;
          line-height: 1.7;
          margin-bottom: 24px;
        }
        .mini-stat-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          border-top: 1px solid rgba(255,255,255,.12);
          padding-top: 18px;
          gap: 12px;
        }
        .mini-stat-grid strong {
          display: block;
          color: #fff;
          font-size: 14px;
          margin-bottom: 3px;
        }
        .mini-stat-grid span {
          color: rgba(255,255,255,.42);
          font-family: var(--font-mono);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: .08em;
        }
        .affiliate-section {
          padding: 72px 0;
        }
        .section-heading {
          max-width: 760px;
          margin-bottom: 34px;
        }
        .section-heading h2,
        .program-grid h2,
        .request-copy h2 {
          color: var(--navy);
          font-size: clamp(28px, 3.6vw, 44px);
          line-height: 1.08;
          letter-spacing: 0;
          margin-bottom: 14px;
        }
        .section-heading p,
        .request-copy p {
          color: rgba(11,23,41,.66);
          font-size: 16px;
          line-height: 1.78;
        }
        .fit-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }
        .fit-card {
          background: #fff;
          border: 1px solid rgba(11,23,41,.08);
          border-radius: 8px;
          padding: 28px;
          box-shadow: 0 16px 48px rgba(11,23,41,.06);
        }
        .fit-card h3 {
          font-size: 19px;
          margin-bottom: 10px;
          color: var(--navy);
        }
        .fit-card p {
          font-size: 14px;
          line-height: 1.68;
          color: rgba(11,23,41,.64);
        }
        .program-band {
          background: #fff;
          border-top: 1px solid rgba(11,23,41,.07);
          border-bottom: 1px solid rgba(11,23,41,.07);
        }
        .program-grid {
          display: grid;
          grid-template-columns: minmax(0, .9fr) minmax(320px, 1fr);
          gap: 48px;
          align-items: start;
        }
        .program-list {
          display: grid;
          gap: 12px;
        }
        .program-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          background: var(--cream2);
          border: 1px solid rgba(11,23,41,.07);
          border-radius: 8px;
          padding: 16px;
          color: rgba(11,23,41,.72);
          line-height: 1.55;
        }
        .program-item svg {
          color: var(--green);
          flex: 0 0 auto;
          margin-top: 2px;
        }
        .request-section {
          padding-bottom: 90px;
        }
        .request-grid {
          display: grid;
          grid-template-columns: minmax(300px, .82fr) minmax(0, 1fr);
          gap: 44px;
          align-items: start;
        }
        .request-copy {
          position: sticky;
          top: 104px;
        }
        .review-note {
          margin-top: 24px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid rgba(61,139,61,.18);
          background: rgba(61,139,61,.08);
          color: rgba(11,23,41,.72);
          line-height: 1.55;
        }
        .review-note svg {
          color: var(--green);
          flex: 0 0 auto;
        }
        .hero-tagline {
          font-size: 18px;
          font-weight: 600;
          color: #fff;
          margin-bottom: 14px !important;
          line-height: 1.45;
        }
        .applications-note {
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: var(--green);
          margin-top: 12px !important;
        }
        .final-cta-section {
          padding-bottom: 100px;
        }
        .final-cta-card {
          background: #fff;
          border: 1px solid rgba(11,23,41,.08);
          border-radius: 16px;
          padding: 48px 40px;
          text-align: center;
          max-width: 720px;
          margin: 0 auto;
          box-shadow: 0 22px 70px rgba(11,23,41,.06);
        }
        .final-cta-card h2 {
          font-size: clamp(24px, 2.4vw, 30px);
          font-weight: 800;
          color: var(--navy);
          margin: 14px 0 14px;
          line-height: 1.25;
        }
        .final-cta-card p {
          font-size: 15.5px;
          color: rgba(11,23,41,.65);
          line-height: 1.6;
          max-width: 520px;
          margin: 0 auto;
        }
        .final-cta-card .applications-note {
          margin-top: 18px !important;
        }
        .final-cta-btn {
          display: inline-block;
          margin-top: 28px;
          font-size: 14px;
          padding: 14px 36px;
        }
        .uses-grid {
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .use-card {
          padding: 26px 22px 24px;
        }
        .use-card h3 {
          margin: 0 0 8px;
        }
        .use-card p {
          font-size: 14px;
          color: rgba(11,23,41,.6);
          line-height: 1.55;
          margin: 0;
        }
        .two-col-section {
          display: grid;
          grid-template-columns: 1fr 1.1fr;
          gap: 56px;
          align-items: start;
        }
        .two-col-section h2 {
          font-size: clamp(22px, 2.2vw, 28px);
          font-weight: 800;
          color: var(--navy);
          margin: 12px 0 18px;
          line-height: 1.25;
        }
        .two-col-cards {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .info-card {
          background: #fff;
          border: 1px solid rgba(11,23,41,.08);
          border-radius: 12px;
          padding: 24px 24px 20px;
        }
        .info-card .mono-label {
          margin-bottom: 12px;
          display: block;
        }
        .bullet-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .bullet-list li {
          position: relative;
          padding-left: 22px;
          font-size: 14.5px;
          color: rgba(11,23,41,.72);
          line-height: 1.55;
        }
        .bullet-list li::before {
          content: "";
          position: absolute;
          left: 0;
          top: 9px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--green);
        }
        .commissions-section {
          background: rgba(61,139,61,.04);
        }
        .tier-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-top: 32px;
        }
        .tier-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 28px 20px;
          background: #fff;
          border: 1px solid rgba(11,23,41,.08);
          border-radius: 12px;
          text-align: center;
        }
        .tier-qty {
          font-size: 42px;
          font-weight: 800;
          color: var(--navy);
          line-height: 1;
        }
        .tier-label {
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: rgba(11,23,41,.5);
        }
        .tier-arrow {
          font-size: 18px;
          color: rgba(11,23,41,.3);
          margin: 2px 0;
        }
        .tier-bonus {
          font-size: 26px;
          font-weight: 800;
          color: var(--green);
          line-height: 1;
        }
        .how-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-top: 32px;
        }
        .how-card {
          background: #fff;
          border: 1px solid rgba(11,23,41,.08);
          border-radius: 12px;
          padding: 28px 24px;
        }
        .how-num {
          display: inline-block;
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: .12em;
          color: var(--green);
          margin-bottom: 14px;
        }
        .how-card h3 {
          font-size: 20px;
          font-weight: 800;
          color: var(--navy);
          margin: 0 0 10px;
        }
        .how-card p {
          font-size: 14.5px;
          color: rgba(11,23,41,.65);
          line-height: 1.55;
          margin: 0;
        }
        @media (max-width: 720px) {
          .two-col-section {
            grid-template-columns: 1fr;
            gap: 32px;
          }
          .uses-grid,
          .tier-grid,
          .how-grid {
            grid-template-columns: 1fr;
          }
        }
        .ambassador-form,
        .ambassador-success {
          background: #fff;
          border: 1px solid rgba(11,23,41,.08);
          border-radius: 8px;
          box-shadow: 0 22px 70px rgba(11,23,41,.08);
          padding: 30px;
        }
        .form-grid {
          display: grid;
          gap: 16px;
          margin-bottom: 18px;
        }
        .form-grid.two {
          grid-template-columns: repeat(2, 1fr);
        }
        .ambassador-form label,
        .ambassador-form fieldset {
          display: block;
          margin-bottom: 18px;
          border: 0;
        }
        .ambassador-form label > span,
        .ambassador-form legend {
          display: block;
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: rgba(11,23,41,.48);
          margin-bottom: 9px;
        }
        .ambassador-form input[type="text"],
        .ambassador-form input[type="email"],
        .ambassador-form input[type="tel"],
        .ambassador-form select,
        .ambassador-form textarea {
          width: 100%;
          border: 1.5px solid rgba(11,23,41,.12);
          border-radius: 6px;
          background: #fff;
          color: var(--navy);
          font: inherit;
          font-size: 15px;
          outline: none;
          padding: 12px 14px;
          transition: border-color .15s, box-shadow .15s;
        }
        .ambassador-form select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%230b1220' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          padding-right: 36px;
        }
        .ambassador-form textarea {
          resize: vertical;
        }
        .ambassador-form input:focus,
        .ambassador-form select:focus,
        .ambassador-form textarea:focus {
          border-color: var(--green);
          box-shadow: 0 0 0 3px rgba(61,139,61,.08);
        }
        .channel-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        .channel-option {
          display: flex !important;
          align-items: center;
          gap: 8px;
          margin: 0 !important;
          min-height: 38px;
          border: 1px solid rgba(11,23,41,.08);
          border-radius: 6px;
          padding: 9px 10px;
          background: var(--cream2);
        }
        .channel-option input {
          width: 15px;
          height: 15px;
          accent-color: var(--green);
          flex: 0 0 auto;
        }
        .channel-option span {
          margin: 0 !important;
          font-family: inherit !important;
          font-size: 13px !important;
          letter-spacing: 0 !important;
          text-transform: none !important;
          color: rgba(11,23,41,.72) !important;
        }
        .form-error {
          color: var(--red);
          font-size: 13px;
          margin: -4px 0 16px;
        }
        .ambassador-submit {
          width: 100%;
          gap: 9px;
          min-height: 48px;
        }
        .ambassador-submit:disabled {
          opacity: .58;
          cursor: not-allowed;
        }
        .ambassador-success {
          text-align: center;
          padding: 44px 32px;
        }
        .success-mark {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          background: rgba(61,139,61,.12);
          color: var(--green);
          font-size: 30px;
          font-weight: 800;
        }
        .ambassador-success h2 {
          color: var(--navy);
          font-size: 26px;
          margin-bottom: 10px;
        }
        .ambassador-success p {
          color: rgba(11,23,41,.62);
          line-height: 1.7;
        }
        @media (max-width: 900px) {
          .hero-shell,
          .program-grid,
          .request-grid {
            grid-template-columns: 1fr;
          }
          .request-copy {
            position: static;
          }
          .fit-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 640px) {
          .affiliate-shell {
            width: calc(100vw - 80px) !important;
            max-width: calc(100vw - 80px) !important;
            margin-left: 16px;
            margin-right: 64px;
          }
          .affiliate-hero,
          .affiliate-section,
          .affiliate-panel,
          .fit-card,
          .program-item,
          .ambassador-form {
            max-width: 100vw;
            overflow-x: hidden;
          }
          .affiliate-panel,
          .fit-card,
          .program-item,
          .ambassador-form,
          .section-heading {
            width: calc(100vw - 80px);
            max-width: calc(100vw - 80px);
          }
          .affiliate-hero {
            padding: 76px 0 56px;
          }
          .affiliate-actions,
          .affiliate-actions a {
            width: calc(100% - 56px);
          }
          .affiliate-copy,
          .affiliate-panel,
          .section-heading,
          .program-grid,
          .request-grid {
            padding-right: 56px;
          }
          .affiliate-actions a {
            min-width: 0;
            max-width: 100%;
            white-space: normal;
            text-align: center;
            line-height: 1.35;
            padding-left: 18px;
            padding-right: 18px;
            overflow-wrap: anywhere;
          }
          .affiliate-actions .btn-purple,
          .affiliate-actions .btn-outline {
            font-size: 11px;
            letter-spacing: .04em;
          }
          .affiliate-copy h1 {
            font-size: clamp(30px, 8vw, 36px);
          }
          .affiliate-copy p {
            font-size: 15px;
            line-height: 1.7;
            max-width: 100%;
          }
          .affiliate-panel {
            padding: 28px 24px;
          }
          .affiliate-panel p,
          .section-heading p,
          .request-copy p {
            font-size: 15px;
            line-height: 1.65;
          }
          .section-heading h2,
          .program-grid h2,
          .request-copy h2 {
            font-size: 30px;
          }
          .form-grid.two,
          .channel-grid,
          .mini-stat-grid {
            grid-template-columns: 1fr;
          }
          .ambassador-form {
            padding: 22px;
          }
        }
      `}</style>
    </>
  );
}
