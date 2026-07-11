import type { Metadata } from "next";
import Link from "next/link";
import Nav from "../../components/Nav";
import AmbassadorForm from "../AmbassadorForm";

export const metadata: Metadata = {
  title: "Apply | College Agent Ambassador Program",
  description:
    "Apply to become a College Agent Ambassador. Tell us about you, your network, and why you'd be a great fit.",
  alternates: { canonical: "https://thecollegeagent.ai/ambassador/apply" },
  openGraph: {
    title: "Apply | College Agent Ambassador Program",
    description:
      "Apply to become a College Agent Ambassador. Build your resume, gain real-world experience, and earn commissions.",
    url: "https://thecollegeagent.ai/ambassador/apply",
    images: [{ url: "/og-image.jpg", width: 1200, height: 1200, alt: "The College Agent" }],
  },
  twitter: {
    title: "Apply | College Agent Ambassador Program",
    description:
      "Apply to become a College Agent Ambassador. Build your resume, gain experience, earn commissions.",
  },
};

export default function AmbassadorApplyPage() {
  return (
    <>
      <Nav />
      <main style={{ paddingTop: 114, minHeight: "100vh", background: "var(--cream2)" }}>
        <section className="affiliate-hero dark-section apply-hero">
          <div className="affiliate-glow" />
          <div className="affiliate-shell">
            <Link href="/ambassador" className="apply-back">&larr; Back to Ambassador Program</Link>
            <div className="apply-hero-copy">
              <div className="hero-badge">
                <span style={{ color: "var(--green)", fontSize: 14 }}>&#9670;</span>
                Campus Ambassador Application
              </div>
              <h1>Apply to become a College Agent Campus Ambassador.</h1>
              <p>
                Tell us about you, your university, and your network. We&apos;ll review and reach out
                with next steps if the program is a match.
              </p>
            </div>
          </div>
        </section>

        <section className="affiliate-section apply-form-section">
          <div className="affiliate-shell apply-shell">
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
        .apply-hero {
          position: relative;
          padding: 48px 0 56px;
          overflow: hidden;
        }
        /* hero uses the site's standard .dark-section navy + grid */
        .affiliate-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 30% 20%, rgba(61,139,61,.18), transparent 50%);
          pointer-events: none;
        }
        .apply-back {
          position: relative;
          z-index: 1;
          display: inline-block;
          margin-bottom: 28px;
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: rgba(255,255,255,.55);
          transition: color .15s;
        }
        .apply-back:hover {
          color: var(--green);
        }
        .apply-hero-copy {
          position: relative;
          z-index: 1;
          max-width: 720px;
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
          margin-bottom: 24px;
        }
        .apply-hero-copy h1 {
          font-size: clamp(30px, 4vw, 44px);
          font-weight: 800;
          color: #fff;
          line-height: 1.15;
          letter-spacing: -.01em;
          margin-bottom: 16px;
        }
        .apply-hero-copy p {
          font-size: 16px;
          color: rgba(255,255,255,.6);
          line-height: 1.65;
          max-width: 580px;
          margin: 0;
        }
        .apply-form-section {
          padding: 56px 0 100px;
        }
        .apply-shell {
          max-width: 760px;
        }
        .ambassador-form,
        .ambassador-success {
          background: #fff;
          border: 1px solid rgba(11,23,41,.08);
          border-radius: 12px;
          box-shadow: 0 22px 70px rgba(11,23,41,.08);
          padding: 36px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .form-grid {
          display: grid;
          gap: 18px;
        }
        .form-grid.two {
          grid-template-columns: repeat(2, 1fr);
        }
        .ambassador-form label,
        .ambassador-form fieldset {
          display: flex;
          flex-direction: column;
          gap: 6px;
          border: none;
          padding: 0;
          margin: 0;
        }
        .ambassador-form label > span,
        .ambassador-form legend {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: rgba(11,23,41,.5);
        }
        .ambassador-form input[type="text"],
        .ambassador-form input[type="email"],
        .ambassador-form input[type="tel"],
        .ambassador-form select,
        .ambassador-form textarea {
          width: 100%;
          padding: 12px 14px;
          border: 1.5px solid rgba(11,23,41,.12);
          border-radius: 6px;
          font-size: 14px;
          font-family: inherit;
          color: var(--navy);
          background: #fff;
          outline: none;
          transition: border-color .15s;
        }
        .ambassador-form select {
          appearance: none;
          -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%230b1220' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          padding-right: 36px;
        }
        .ambassador-form textarea {
          resize: vertical;
          font-family: inherit;
        }
        .ambassador-form input:focus,
        .ambassador-form select:focus,
        .ambassador-form textarea:focus {
          border-color: var(--green);
          box-shadow: 0 0 0 3px rgba(61,139,61,.08);
        }
        .channel-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px 16px;
        }
        .channel-option {
          display: flex !important;
          flex-direction: row !important;
          align-items: center;
          gap: 10px;
          padding: 4px 0;
          cursor: pointer;
        }
        .channel-option input {
          width: 16px;
          height: 16px;
          accent-color: var(--green);
          cursor: pointer;
        }
        .channel-option span {
          font-family: inherit !important;
          font-size: 14px !important;
          font-weight: 400 !important;
          letter-spacing: 0 !important;
          text-transform: none !important;
          color: var(--navy) !important;
        }
        .form-error {
          color: #c83d3d;
          font-size: 13px;
          margin: 0;
        }
        .ambassador-submit {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 14px;
          padding: 14px 28px;
          margin-top: 4px;
        }
        .ambassador-submit:disabled {
          opacity: .5;
          cursor: not-allowed;
        }
        .ambassador-success {
          text-align: center;
          align-items: center;
          padding: 56px 36px;
        }
        .success-mark {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(61,139,61,.1);
          color: var(--green);
          font-size: 28px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }
        .ambassador-success h2 {
          font-size: 26px;
          font-weight: 800;
          color: var(--navy);
          margin: 0 0 10px;
        }
        .ambassador-success p {
          font-size: 15px;
          color: rgba(11,23,41,.6);
          line-height: 1.6;
          max-width: 440px;
          margin: 0;
        }

        @media (max-width: 640px) {
          .form-grid.two,
          .channel-grid {
            grid-template-columns: 1fr;
          }
          .ambassador-form {
            padding: 26px 22px;
          }
        }
      `}</style>
    </>
  );
}
