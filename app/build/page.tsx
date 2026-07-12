"use client";

import { useEffect, useState } from "react";
import BuildNav from "../components/BuildNav";
import { trackMeta } from "../components/MetaPixel";
import {
  PLAN_AMOUNT_CENTS,
  PRO_PLAN_AMOUNT_CENTS,
  PRO_HOSTING_AMOUNT_CENTS,
  HOSTING_AMOUNT_CENTS,
  HOSTING_ANNUAL_AMOUNT_CENTS,
} from "@/lib/pricing/intro-cutoff";

// Single price model: one-time platform fee ($599) PLUS recurring hosting, the
// student's choice of $25/month or $250/year (annual = 10 x monthly, 2 months free).
// The Stripe Checkout Session bundles both line items (see app/api/build/checkout);
// we POST to that endpoint and redirect to the returned session.url so students land
// on a session WE created (with user_id metadata), not a static Payment Link — the
// metadata is what lets the webhook activate the right account on payment.

const FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap";

type InfoForm = {
  firstName: string;
  lastName: string;
  schoolEmail: string;
  mobile: string;
};

function formatPrice(cents: number): string {
  const dollars = cents / 100;
  return "$" + dollars.toLocaleString("en-US", {
    minimumFractionDigits: dollars % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

export default function BuildPage() {
  const [step, setStep] = useState<"welcome" | "who" | "plan" | "info">("welcome");
  const [info, setInfo] = useState<InfoForm>({
    firstName: "",
    lastName: "",
    schoolEmail: "",
    mobile: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Checkout requires an explicit Terms acceptance — the API refuses sessions
  // without it, and the acceptance timestamp rides the Stripe metadata.
  const [agreeTerms, setAgreeTerms] = useState(false);
  // Optional extra credits on top of the included $20 — default none. Added as a
  // one-time Stripe line item; delivered to the agent at provisioning.
  const [extraCents, setExtraCents] = useState(0);
  // Hosting billing choice: $25/month or $250/year (2 months free on annual).
  const [hostingInterval, setHostingInterval] = useState<"monthly" | "annual">("monthly");
  // Which build is being bought: the student plan (default) or the professional build
  // for faculty / administration / athletic departments. Deep-linkable via ?plan=pro.
  const [plan, setPlan] = useState<"student" | "pro">("student");
  // Which audience they picked on the "who" step; rides checkout metadata so the
  // post-payment intake and our records agree with what they were charged.
  const [buyerRole, setBuyerRole] = useState<string>("");
  // Referral code from ?ref=... — kept in localStorage so it survives the multi-step
  // flow and a canceled-checkout round trip. Applied server-side at checkout.
  const [ref, setRef] = useState<string>("");

  useEffect(() => {
    // Deep link from the athletics/administration pages: they already told us who they
    // are, so land straight on the professional plan card.
    if (new URLSearchParams(window.location.search).get("plan") === "pro") {
      setPlan("pro");
      setStep("plan");
    }
    const fromUrl = new URLSearchParams(window.location.search).get("ref")?.trim() ?? "";
    if (fromUrl) {
      localStorage.setItem("ca-ref", fromUrl);
      setRef(fromUrl);
    } else {
      setRef(localStorage.getItem("ca-ref") ?? "");
    }
  }, []);

  // The HTML snippet pulls Inter + IBM Plex Mono from Google Fonts. App Router
  // client components can't render <link> into <head>, so inject once on mount
  // and clean up to avoid duplicates on navigation.
  useEffect(() => {
    const links: HTMLLinkElement[] = [];
    const add = (attrs: Record<string, string>) => {
      const el = document.createElement("link");
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
      document.head.appendChild(el);
      links.push(el);
    };
    add({ rel: "preconnect", href: "https://fonts.googleapis.com" });
    add({ rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" });
    add({ rel: "stylesheet", href: FONTS_HREF });
    return () => {
      links.forEach((el) => el.remove());
    };
  }, []);

  const planPrice = formatPrice(PLAN_AMOUNT_CENTS);
  const proPrice = formatPrice(PRO_PLAN_AMOUNT_CENTS);
  const proHostingPrice = formatPrice(PRO_HOSTING_AMOUNT_CENTS);
  const hostingPrice = formatPrice(HOSTING_AMOUNT_CENTS);
  const hostingAnnualPrice = formatPrice(HOSTING_ANNUAL_AMOUNT_CENTS);

  function continueToWho() {
    setError(null);
    setStep("who");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function chooseWho(role: string, planFor: "student" | "pro") {
    setBuyerRole(role);
    setPlan(planFor);
    setError(null);
    setStep("plan");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function continueToInfo() {
    setError(null);
    setStep("info");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function setField<K extends keyof InfoForm>(key: K, value: string) {
    setInfo((prev) => ({ ...prev, [key]: value }));
  }

  function validateInfo(): string | null {
    if (!info.firstName.trim()) return "First name is required.";
    if (!info.lastName.trim()) return "Last name is required.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(info.schoolEmail.trim())) return "Enter a valid school email.";
    // Phone is optional here to cut pre-payment friction — it's collected again in onboarding.
    if (!agreeTerms) return "Please agree to the Terms & Conditions to continue.";
    return null;
  }

  async function handleContinueToPayment(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    const v = validateInfo();
    if (v) {
      setError(v);
      return;
    }
    setLoading(true);
    setError(null);

    // Lead capture is best-effort — never block payment if it fails.
    fetch("/api/lead-capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: info.firstName.trim(),
        lastName: info.lastName.trim(),
        schoolEmail: info.schoolEmail.trim(),
        mobile: info.mobile.trim(),
      }),
    }).catch(() => {});
    // Top-of-funnel conversion signal for Meta Ads optimization (no-op until the Pixel ID is set).
    trackMeta("Lead");

    try {
      const res = await fetch("/api/build/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: info.schoolEmail.trim(),
          firstName: info.firstName.trim(),
          lastName: info.lastName.trim(),
          termsAccepted: agreeTerms,
          hostingInterval,
          plan,
          ...(buyerRole ? { buyerRole } : {}),
          ...(extraCents > 0 ? { extraCreditsCents: extraCents } : {}),
          ...(ref ? { ref } : {}),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.url) {
        throw new Error(body?.error?.message ?? `Checkout failed (${res.status})`);
      }
      trackMeta("InitiateCheckout");
      window.location.href = body.url as string;
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <>
      <BuildNav />

      {/* Column layout so the footer pins to the bottom even on short steps. */}
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <main style={{ paddingTop: 72, flex: 1 }}>
        <section className="ca-checkout">
          <div className="ca-panel">

            {step === "welcome" && (
              <>
                <div className="ca-head-row">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="ca-eyebrow" style={{ textAlign: "left" }}>Welcome</p>
                    <h2 className="ca-h2" style={{ textAlign: "left" }}>Meet your College Agent.</h2>
                    <p className="ca-sub" style={{ textAlign: "left", margin: "10px 0 0", maxWidth: "none", fontSize: 15 }}>
                      Not another chatbot. Not homework help. A personal AI agent built around your
                      classes, your calendar, and your life, in your corner from day one to graduation.
                    </p>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/avatars/guy-01.webp" alt="The College Agent waving" className="ca-head-guy" />
                </div>

                <ul className="ca-welcome-points">
                  <li>
                    <span className="ca-check"><CheckIcon /></span>
                    <span><b>Knows your world.</b> Your classes, deadlines, professors, and goals. No generic chatbot answers.</span>
                  </li>
                  <li>
                    <span className="ca-check"><CheckIcon /></span>
                    <span><b>Works where you are.</b> On the web and Telegram, connected to your calendar, email, and Canvas.</span>
                  </li>
                  <li>
                    <span className="ca-check"><CheckIcon /></span>
                    <span><b>Ready in minutes.</b> Answer a few questions and your agent is live within 30 minutes.</span>
                  </li>
                </ul>

                <div className="ca-welcome-cta-wrap">
                  <button type="button" className="ca-cta" onClick={continueToWho}>
                    Let&apos;s get started
                  </button>
                  <p className="ca-trust">One plan. Everything included.</p>
                </div>
              </>
            )}

            {step === "who" && (
              <>
                <p className="ca-eyebrow">Get started</p>
                <h2 className="ca-h2">Who is this agent for?</h2>
                <p className="ca-sub">Pick the one that fits, and we&apos;ll set up the right build.</p>
                <div className="ca-who-grid">
                  {[
                    { role: "Student", label: "A student", desc: "Classes, deadlines, studying, and campus life.", plan: "student" as const },
                    { role: "Faculty", label: "Faculty / Professor", desc: "Teaching, office hours, research, and communications.", plan: "pro" as const },
                    { role: "Administration / Staff", label: "Administration / Staff", desc: "Admissions, advising, the registrar, and campus offices.", plan: "pro" as const },
                    { role: "Athletic Department", label: "Athletic Department", desc: "Coaches, operations, recruiting, and game day.", plan: "pro" as const },
                  ].map((o) => (
                    <button key={o.role} type="button" className="ca-who-opt" onClick={() => chooseWho(o.role, o.plan)}>
                      <span className="ca-who-label">{o.label}</span>
                      <span className="ca-who-desc">{o.desc}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === "plan" && plan === "student" && (
              <>
                <p className="ca-eyebrow">Get started</p>
                <h2 className="ca-h2">One plan. Everything included.</h2>
                <p className="ca-sub">
                  Your own AI agent, set up for you and ready to go. No build fees, no add-ons, no
                  hosting tiers to figure out.
                </p>

                <div className="ca-card">
                  <h3 className="ca-plan-name">The College Agent</h3>
                  <p className="ca-plan-desc">
                    Your AI, built around your classes, your calendar, and your life. Live within 30 minutes.
                  </p>

                  <div className="ca-price-row">
                    <span className="ca-price">{planPrice}</span>
                    <span className="ca-period">one-time</span>
                  </div>
                  <div className="ca-extra" style={{ marginTop: 0 }}>
                    <p className="ca-extra-label">
                      Cloud hosting <span>(keeps your agent running 24/7)</span>
                    </p>
                    <div className="ca-extra-chips" role="group" aria-label="Hosting billing">
                      <button
                        type="button"
                        className={hostingInterval === "monthly" ? "is-active" : ""}
                        onClick={() => setHostingInterval("monthly")}
                      >
                        {hostingPrice}/month
                      </button>
                      <button
                        type="button"
                        className={hostingInterval === "annual" ? "is-active" : ""}
                        onClick={() => setHostingInterval("annual")}
                      >
                        {hostingAnnualPrice}/year
                      </button>
                    </div>
                  </div>
                  <p className="ca-savenote">
                    {hostingInterval === "annual"
                      ? `Annual hosting is 10 months' price: 2 months free. Cancel any time.`
                      : `Cancel hosting any time, pause over summer.`}
                  </p>
                  {ref && (
                    <p className="ca-savenote" style={{ color: "var(--ca-green)", fontWeight: 600 }}>
                      Referral applied: your first month of hosting is free.
                    </p>
                  )}

                  <ul className="ca-features">
                    <li><span className="ca-check"><CheckIcon /></span>Your own AI Agent, built and set up for you</li>
                    <li><span className="ca-check"><CheckIcon /></span>$20 in AI credits included to get you started</li>
                    <li><span className="ca-check"><CheckIcon /></span>Works on the web and Telegram, any device</li>
                    <li><span className="ca-check"><CheckIcon /></span>Connect your calendar, email, Canvas, and more</li>
                    <li><span className="ca-check"><CheckIcon /></span>Cancel anytime, pause over summer</li>
                    <li><span className="ca-check"><CheckIcon /></span>7-day money-back guarantee</li>
                  </ul>

                  <div className="ca-extra">
                    <p className="ca-extra-label">
                      Start with extra credits <span>(optional)</span>
                    </p>
                    <div className="ca-extra-chips" role="group" aria-label="Extra credits">
                      {[0, 1000, 2500, 5000].map((cents) => (
                        <button
                          key={cents}
                          type="button"
                          className={extraCents === cents ? "is-active" : ""}
                          onClick={() => setExtraCents(cents)}
                        >
                          {cents === 0 ? "None" : `+${formatPrice(cents)}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button type="button" className="ca-cta" onClick={continueToInfo}>
                    Let&apos;s do it!
                  </button>

                  <p className="ca-trust">Secure checkout by Stripe &middot; 7-day money-back guarantee</p>
                </div>

                <p className="ca-next">
                  After checkout you&apos;ll fill out a <b>2-minute onboarding form</b>, and your agent
                  goes live within 30 minutes.
                </p>

                <p className="ca-custom">
                  Not a student?{" "}
                  <button type="button" className="ca-switch-link" onClick={() => setStep("who")}>Change who this is for</button>
                </p>
              </>
            )}

            {step === "plan" && plan === "pro" && (
              <>
                <p className="ca-eyebrow">Get started</p>
                <h2 className="ca-h2">The professional build.</h2>
                <p className="ca-sub">
                  For faculty, administration, and athletic departments. White-glove setup, a
                  role-geared intake, and an agent that runs your busywork.
                </p>

                <div className="ca-card ca-card-pro">
                  <h3 className="ca-plan-name">The College Agent — Professional</h3>
                  <p className="ca-plan-desc">
                    Built for your office, program, or team. Scheduling, travel, recruiting
                    coordination, compliance deadlines, communications, and game-day operations,
                    run by an agent that knows your department.
                  </p>
                  <div className="ca-price-row">
                    <span className="ca-price">{proPrice}</span>
                    <span className="ca-period">one-time</span>
                  </div>
                  <p className="ca-savenote">Plus {proHostingPrice}/month hosting. White-glove setup included.</p>
                  <ul className="ca-features">
                    <li><span className="ca-check"><CheckIcon /></span>Your own professional AI agent, built and set up for you</li>
                    <li><span className="ca-check"><CheckIcon /></span>Geared to your role, team, and season in a 5-minute intake</li>
                    <li><span className="ca-check"><CheckIcon /></span>Connect your calendar, email, and the tools you already use</li>
                    <li><span className="ca-check"><CheckIcon /></span>Works on the web and Telegram, any device</li>
                    <li><span className="ca-check"><CheckIcon /></span>7-day money-back guarantee</li>
                  </ul>
                  <button type="button" className="ca-cta" onClick={continueToInfo}>
                    Build my professional agent
                  </button>
                  <p className="ca-trust">Piloting with athletic departments now &middot; Questions? <a href="/consultation" style={{ color: "var(--ca-green)", textDecoration: "underline" }}>Book a consultation</a></p>
                </div>

                <p className="ca-next">
                  After checkout you&apos;ll fill out a <b>2-minute onboarding form</b>, and your agent
                  goes live within 30 minutes.
                </p>

                <p className="ca-custom">
                  Buying for a student?{" "}
                  <button type="button" className="ca-switch-link" onClick={() => setStep("who")}>Change who this is for</button>
                </p>
              </>
            )}

            {step === "info" && (
              <>
                <div className="ca-head-row">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="ca-eyebrow" style={{ textAlign: "left" }}>Step 1 of 2</p>
                    <h2 className="ca-h2" style={{ textAlign: "left" }}>Tell us about yourself.</h2>
                    <p className="ca-sub" style={{ textAlign: "left", margin: "10px 0 0", maxWidth: "none", fontSize: 14 }}>
                      Quick details so we know who&apos;s building this agent. Next step is secure payment.
                      {plan === "pro" && (
                        <>
                          {" "}
                          <b>Professional build, {proPrice} one-time plus {proHostingPrice}/month hosting.</b>
                        </>
                      )}
                    </p>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/avatars/guy-04.webp" alt="The College Agent" className="ca-head-guy" />
                </div>

                <form className="ca-form" onSubmit={handleContinueToPayment} noValidate>
                  <div className="ca-row">
                    <label className="ca-field">
                      <span>First name</span>
                      <input
                        type="text"
                        autoComplete="given-name"
                        value={info.firstName}
                        onChange={(e) => setField("firstName", e.target.value)}
                        required
                      />
                    </label>
                    <label className="ca-field">
                      <span>Last name</span>
                      <input
                        type="text"
                        autoComplete="family-name"
                        value={info.lastName}
                        onChange={(e) => setField("lastName", e.target.value)}
                        required
                      />
                    </label>
                  </div>

                  <label className="ca-field">
                    <span>School email</span>
                    <input
                      type="email"
                      autoComplete="email"
                      value={info.schoolEmail}
                      onChange={(e) => setField("schoolEmail", e.target.value)}
                      placeholder="you@school.edu"
                      required
                    />
                    <span style={{ fontWeight: 400, fontSize: 12, color: "var(--ca-muted)" }}>
                      This is the email you&apos;ll use to log in to your agent.
                    </span>
                  </label>

                  <label className="ca-field">
                    <span>Phone <span style={{ opacity: 0.55, fontWeight: 400 }}>(optional)</span></span>
                    <input
                      type="tel"
                      autoComplete="tel"
                      value={info.mobile}
                      onChange={(e) => setField("mobile", e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </label>

                  <label className="ca-terms">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      required
                    />
                    <span>
                      I agree to the{" "}
                      <a href="/terms" target="_blank" rel="noopener noreferrer">Terms &amp; Conditions</a>,
                      including the 7-day refund policy, and the{" "}
                      <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
                    </span>
                  </label>

                  {error && <p className="ca-error" role="alert">{error}</p>}

                  <button type="submit" className="ca-cta" disabled={loading || !agreeTerms} aria-busy={loading}>
                    {loading ? "Loading..." : "Continue to payment"}
                  </button>

                  <p className="ca-trust">Secure checkout by Stripe &middot; 7-day money-back guarantee</p>
                </form>
              </>
            )}

          </div>
        </section>
      </main>

      <footer
        className="dark-section"
        style={{ borderTop: "1px solid rgba(255,255,255,.06)", padding: "32px 24px", textAlign: "center" }}
      >
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "rgba(255,255,255,.92)",
            letterSpacing: ".04em",
          }}
        >
          &copy; 2026 Apollo[Claw]. All rights reserved. &nbsp;&middot;&nbsp;{" "}
          <a href="mailto:hello@thecollegeagent.ai" style={{ color: "rgba(255,255,255,.92)", textDecoration: "underline" }}>
            hello@thecollegeagent.ai
          </a>
        </p>
      </footer>
      </div>


      <style>{`
        .ca-checkout {
          --ca-green: #2D7A3A;
          --ca-green-dark: #245F2E;
          --ca-green-tint: #F2F8EF;
          --ca-green-check: #E7F1E3;
          --ca-cream: #EDEBE4;
          --ca-white: #FFFFFF;
          --ca-ink: #1A1A1A;
          --ca-body: #565650;
          --ca-muted: #8A897F;
          --ca-line: #E6E4DC;
          --ca-sans: 'Inter', system-ui, -apple-system, sans-serif;
          --ca-mono: 'IBM Plex Mono', ui-monospace, monospace;

          box-sizing: border-box;
          font-family: var(--ca-sans);
          /* Soft grid arc: faint green graph-paper visible at the top, fading to clean
             white (replaces the flat tan). Pure CSS, crisp at any size. */
          background:
            radial-gradient(115% 68% at 50% 0%, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 26%, #fff 64%),
            linear-gradient(rgba(45,122,58,.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(45,122,58,.07) 1px, transparent 1px),
            linear-gradient(180deg, rgba(45,122,58,.05), rgba(255,255,255,0) 55%),
            #fff;
          background-size: 100% 100%, 52px 52px, 52px 52px, 100% 100%, auto;
          color: var(--ca-ink);
          padding: 64px 20px;
          display: flex;
          justify-content: center;
          -webkit-font-smoothing: antialiased;
        }
        .ca-checkout *, .ca-checkout *::before, .ca-checkout *::after { box-sizing: border-box; }

        .ca-panel {
          background: var(--ca-white);
          border-radius: 20px;
          border: 1px solid var(--ca-line);
          padding: 56px 40px;
          width: 100%;
          max-width: 760px;
        }

        .ca-eyebrow {
          font-family: var(--ca-mono);
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--ca-green);
          margin: 0 0 12px;
          text-align: center;
        }
        .ca-h2 {
          font-size: 30px;
          font-weight: 600;
          letter-spacing: -0.01em;
          margin: 0 0 10px;
          text-align: center;
          color: var(--ca-ink);
        }
        .ca-sub {
          font-size: 16px;
          line-height: 1.6;
          color: var(--ca-body);
          margin: 0 auto 32px;
          text-align: center;
          max-width: 460px;
        }

        .ca-toggle {
          display: flex;
          gap: 4px;
          background: var(--ca-cream);
          border: 1px solid var(--ca-line);
          border-radius: 12px;
          padding: 4px;
          width: fit-content;
          margin: 0 auto 8px;
        }
        .ca-toggle button {
          font-family: var(--ca-sans);
          font-size: 14px;
          font-weight: 500;
          border: none;
          background: transparent;
          color: var(--ca-body);
          padding: 9px 20px;
          border-radius: 9px;
          cursor: pointer;
          transition: background 0.18s ease, color 0.18s ease;
          position: relative;
        }
        .ca-toggle button.is-active {
          background: var(--ca-green);
          color: #fff;
        }
        .ca-save-pill {
          font-family: var(--ca-mono);
          font-size: 10px;
          letter-spacing: 0.04em;
          background: var(--ca-green-check);
          color: var(--ca-green-dark);
          border-radius: 999px;
          padding: 2px 7px;
          margin-left: 7px;
          vertical-align: middle;
        }
        .ca-toggle button.is-active .ca-save-pill {
          background: rgba(255,255,255,0.22);
          color: #fff;
        }

        .ca-who-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          max-width: 560px;
          margin: 0 auto;
        }
        @media (max-width: 560px) { .ca-who-grid { grid-template-columns: 1fr; } }
        .ca-who-opt {
          display: flex;
          flex-direction: column;
          gap: 6px;
          text-align: left;
          background: var(--ca-white);
          border: 1.5px solid var(--ca-line);
          border-radius: 14px;
          padding: 20px 18px;
          cursor: pointer;
          transition: border-color .15s, box-shadow .15s, transform .06s;
          font-family: var(--ca-sans);
        }
        .ca-who-opt:hover {
          border-color: var(--ca-green);
          box-shadow: 0 8px 24px rgba(45,122,58,.12);
        }
        .ca-who-opt:active { transform: scale(.99); }
        .ca-who-label { font-size: 16px; font-weight: 700; color: var(--ca-ink); }
        .ca-who-desc { font-size: 13px; line-height: 1.5; color: var(--ca-body); }
        .ca-switch-link {
          border: none;
          background: transparent;
          color: var(--ca-green);
          font-family: inherit;
          font-size: inherit;
          cursor: pointer;
          text-decoration: underline;
          padding: 0;
        }
        .ca-card-pro {
          border-color: var(--ca-ink);
          background: #fff;
          margin-top: 18px;
        }
        .ca-card {
          border: 2px solid var(--ca-green);
          background: var(--ca-green-tint);
          border-radius: 18px;
          padding: 34px 34px 30px;
          max-width: 460px;
          margin: 24px auto 0;
        }
        .ca-plan-name {
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 4px;
          color: var(--ca-ink);
        }
        .ca-plan-desc {
          font-size: 14px;
          line-height: 1.55;
          color: var(--ca-body);
          margin: 0 0 22px;
        }
        .ca-price-row {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin-bottom: 4px;
        }
        .ca-price {
          font-size: 42px;
          font-weight: 700;
          color: var(--ca-green);
          letter-spacing: -0.02em;
          line-height: 1;
        }
        .ca-period {
          font-family: var(--ca-mono);
          font-size: 14px;
          color: var(--ca-muted);
        }
        .ca-savenote {
          font-size: 13px;
          color: var(--ca-green-dark);
          font-weight: 500;
          margin: 0 0 24px;
          min-height: 18px;
        }

        .ca-head-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          max-width: 100%;
          margin: 0 0 26px;
        }
        .ca-head-guy {
          flex: 0 0 auto;
          width: 260px;
          height: auto;
          margin: -14px 0;
          filter: drop-shadow(0 18px 36px rgba(45,122,58,.32));
        }
        @media (max-width: 560px) {
          .ca-head-guy { width: 150px; margin: 0; }
        }
        .ca-welcome-points {
          list-style: none;
          margin: 30px 0 34px;
          padding: 0;
          max-width: 100%;
          text-align: left;
        }
        .ca-welcome-points li {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          font-size: 15.5px;
          line-height: 1.6;
          color: var(--ca-ink);
          padding: 10px 0;
        }
        .ca-welcome-points b { font-weight: 600; }
        .ca-welcome-cta-wrap {
          max-width: 380px;
          margin: 0 auto;
        }
        .ca-features { list-style: none; margin: 0 0 28px; padding: 0; }
        .ca-features li {
          display: flex;
          align-items: flex-start;
          gap: 11px;
          font-size: 15px;
          color: var(--ca-ink);
          padding: 7px 0;
        }
        .ca-check {
          flex: 0 0 auto;
          width: 24px; height: 24px;
          border-radius: 50%;
          background: var(--ca-green);
          color: #fff;
          display: flex; align-items: center; justify-content: center;
          margin-top: 1px;
        }
        .ca-check svg { width: 13px; height: 13px; }

        .ca-cta {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          height: 54px;
          background: var(--ca-green);
          color: #fff;
          font-family: var(--ca-sans);
          font-size: 16px;
          font-weight: 600;
          border-radius: 12px;
          text-decoration: none;
          cursor: pointer;
          transition: background 0.18s ease, transform 0.06s ease;
        }
        .ca-cta:hover { background: var(--ca-green-dark); }
        .ca-cta:active { transform: scale(0.99); }
        .ca-cta[disabled] { opacity: 0.7; cursor: progress; }
        .ca-cta[disabled]:hover { background: var(--ca-green); }
        .ca-error {
          color: #B23636;
          background: #FDECEC;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 13px;
          margin: 12px 0 0;
          text-align: center;
        }

        .ca-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
          max-width: 460px;
          margin: 0 auto;
        }
        .ca-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .ca-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .ca-field > span {
          font-size: 13px;
          font-weight: 500;
          color: var(--ca-body);
        }
        .ca-field input {
          font-family: var(--ca-sans);
          font-size: 15px;
          color: var(--ca-ink);
          background: var(--ca-white);
          border: 1px solid var(--ca-line);
          border-radius: 10px;
          padding: 12px 14px;
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .ca-field input:focus {
          border-color: var(--ca-green);
          box-shadow: 0 0 0 3px rgba(45, 122, 58, 0.15);
        }
        @media (max-width: 480px) {
          .ca-row { grid-template-columns: 1fr; }
        }

        .ca-trust {
          font-family: var(--ca-mono);
          font-size: 11.5px;
          letter-spacing: 0.02em;
          color: var(--ca-muted);
          text-align: center;
          margin: 16px 0 0;
        }

        .ca-extra {
          margin: 0 0 22px;
        }
        .ca-extra-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--ca-body);
          margin: 0 0 8px;
        }
        .ca-extra-label span {
          font-weight: 400;
          color: var(--ca-muted);
        }
        .ca-extra-chips {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .ca-extra-chips button {
          font-family: var(--ca-sans);
          font-size: 13.5px;
          font-weight: 600;
          padding: 8px 16px;
          border-radius: 999px;
          border: 1.5px solid var(--ca-line);
          background: var(--ca-white);
          color: var(--ca-body);
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s, color 0.15s;
        }
        .ca-extra-chips button.is-active {
          border-color: var(--ca-green);
          background: var(--ca-green);
          color: #fff;
        }

        .ca-terms {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 13px;
          line-height: 1.55;
          color: var(--ca-body);
          margin: 2px 0 4px;
          cursor: pointer;
        }
        .ca-terms input {
          flex: 0 0 auto;
          width: 17px;
          height: 17px;
          margin-top: 2px;
          accent-color: var(--ca-green);
          cursor: pointer;
        }
        .ca-terms a {
          color: var(--ca-green);
          font-weight: 600;
          text-decoration: underline;
        }


        .ca-next {
          font-size: 13px;
          line-height: 1.6;
          color: var(--ca-body);
          text-align: center;
          max-width: 440px;
          margin: 28px auto 0;
        }
        .ca-next b { font-weight: 600; color: var(--ca-ink); }

        .ca-custom {
          font-family: var(--ca-mono);
          font-size: 13px;
          color: var(--ca-muted);
          text-align: center;
          margin: 36px 0 0;
        }
        .ca-custom a { color: var(--ca-green); text-decoration: none; }
        .ca-custom a:hover { text-decoration: underline; }

        .ca-checkout :focus-visible {
          outline: 2px solid var(--ca-green);
          outline-offset: 2px;
        }

        @media (max-width: 560px) {
          .ca-panel { padding: 40px 22px; }
          .ca-card { padding: 28px 22px 26px; }
          .ca-h2 { font-size: 25px; }
          .ca-price { font-size: 36px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ca-toggle button, .ca-cta { transition: none; }
        }
      `}</style>
    </>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="none">
      <path d="M2.5 6.2l2.2 2.2 4.8-4.8" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

