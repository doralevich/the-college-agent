import type { Metadata } from "next";
import { BadgeDollarSign, Megaphone, School, ShieldCheck, Sparkles, Users } from "lucide-react";
import Nav from "../components/Nav";
import AmbassadorForm from "./AmbassadorForm";

export const metadata: Metadata = {
  title: "College Agent Ambassador Program | The College Agent",
  description:
    "Apply to become a College Agent Ambassador and introduce a personal AI agent for college students to your campus, club, parent network, or student community.",
  alternates: { canonical: "https://thecollegeagent.ai/affiliate" },
  openGraph: {
    title: "College Agent Ambassador Program",
    description:
      "Request to become a College Agent Ambassador and help students discover a personal AI agent for school, internships, and campus life.",
    url: "https://thecollegeagent.ai/affiliate",
  },
  twitter: {
    title: "College Agent Ambassador Program",
    description:
      "Apply to introduce College Agent to students, parents, clubs, and campus communities.",
  },
};

const FIT_POINTS = [
  { icon: School, title: "Campus reach", text: "Students, clubs, athletics, Greek life, residence halls, or major-specific groups." },
  { icon: Users, title: "Parent networks", text: "Families looking for a smarter way to support students without managing every deadline." },
  { icon: Megaphone, title: "Real influence", text: "Short videos, demos, group chats, newsletters, or in-person introductions that move people." },
];

const PROGRAM_POINTS = [
  "Ambassador applications are reviewed before approval.",
  "Approved Ambassadors receive referral details and launch assets.",
  "Every promotion must be honest and clearly disclosed.",
  "Best-fit partners may be invited into paid campus campaigns.",
];

export default function AffiliatePage() {
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
                Ambassador Program
              </div>
              <h1>Bring College Agent <br />to your campus.</h1>
              <p>
                We are looking for students, parents, and campus connectors who can introduce College Agent
                to the people who need a smarter way to handle school, deadlines, internships, and daily life.
              </p>
              <div className="affiliate-actions">
                <a href="#request" className="btn-purple">Apply as Ambassador</a>
                <a href="/build" className="btn-outline">See the Agent</a>
              </div>
            </div>
            <div className="affiliate-panel" aria-label="Ambassador program summary">
              <div className="panel-icon"><Sparkles size={26} strokeWidth={1.9} /></div>
              <h2>Who this is for</h2>
              <p>
                Students with campus reach, parents with family networks, and connectors who can introduce
                College Agent to the right people.
              </p>
              <div className="mini-stat-grid">
                <div><strong>Campus</strong><span>students</span></div>
                <div><strong>Parent</strong><span>networks</span></div>
                <div><strong>Club</strong><span>leaders</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="affiliate-section">
          <div className="affiliate-shell">
            <div className="section-heading">
              <span className="mono-label">Good Fit</span>
              <h2>Trust comes first.</h2>
              <p>
                This is not a mass affiliate signup page. We want people who can explain the product clearly,
                reach real students or parents, and represent the brand responsibly.
              </p>
            </div>
            <div className="fit-grid">
              {FIT_POINTS.map(({ icon: Icon, title, text }) => (
                <div key={title} className="fit-card">
                  <div className="fit-icon"><Icon size={23} strokeWidth={1.9} /></div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="affiliate-section program-band">
          <div className="affiliate-shell program-grid">
            <div>
              <span className="mono-label">How It Works</span>
              <h2>Request access first. We approve the right partners.</h2>
            </div>
            <div className="program-list">
              {PROGRAM_POINTS.map((point) => (
                <div key={point} className="program-item">
                  <ShieldCheck size={18} strokeWidth={2.1} />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="request" className="affiliate-section request-section">
          <div className="affiliate-shell request-grid">
            <div className="request-copy">
              <span className="mono-label">Submit Your Request</span>
              <h2>Tell us why you would make a strong College Agent Ambassador.</h2>
              <p>
                Your request goes directly to David and Jill for review. Include your school, network,
                audience, and the way you would introduce College Agent.
              </p>
              <div className="review-note">
                <BadgeDollarSign size={20} strokeWidth={2} />
                <span>Referral and campaign details are shared after approval.</span>
              </div>
            </div>
            <AmbassadorForm />
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
