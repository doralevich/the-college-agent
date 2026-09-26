"use client";

import { useState } from "react";
import {
  PLAN_TIERS,
  type BillingInterval,
  type PlanTier,
} from "@/lib/pricing/intro-cutoff";

// The interactive half of /pricing: the monthly/annual toggle and the three plan cards.
//
// The plans are the same agent at three allowances, so the cards carry only what differs -
// price and AI usage - and everything they share sits once, below, under "Every plan
// includes". Repeating an identical feature list on each card (the usual pricing-page shape)
// would imply differences that are not there.
//
// FAIR_USE_NOTE is deliberately NOT repeated here: under "Every plan includes" it restated the
// list right above it and the FAQ right below. It still sits beside the price on /build and in
// the Terms, where it is the only statement of the promise.
//
// Each card links into /build with ?plan and ?interval, which preselects that plan there.
// Styling reuses /build's tokens (green #2D7A3A on cream) so arriving at checkout does not
// feel like a different site.

function dollars(cents: number): string {
  const d = cents / 100;
  return "$" + d.toLocaleString("en-US", { minimumFractionDigits: d % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 });
}

const EVERY_PLAN = [
  "Your own private agent, built and set up for you",
  "Hosting, monitoring, and updates",
  "Works on the web and Telegram, on any device",
  "Connect your calendar, email, Canvas, and more",
  "Top up AI usage any time from Settings",
  "Cancel any time, pause over summer",
  "7-day money-back guarantee",
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "What's the difference between the plans?",
    a: "Only how much AI usage comes with it each month. Every plan is the same private agent with the same features. Pick the one that matches how much you'll lean on it.",
  },
  {
    q: "What is AI usage?",
    a: "Your agent runs on AI models, and each time it thinks - reading a syllabus, outlining an essay, planning your week - that costs a little. Your plan includes a set amount of it every month, added to your balance each billing period.",
  },
  {
    q: "What happens if I use it all?",
    a: "Top up any time from Settings and your agent keeps going. Otherwise, your allowance is added again at your next billing date.",
  },
  {
    q: "How does annual billing work?",
    a: "Annual is ten months' price for twelve: two months free. A full year of AI usage is added when you subscribe, and again each year you renew.",
  },
  {
    q: "Can I cancel?",
    a: "Yes, any time. And every plan comes with a 7-day money-back guarantee.",
  },
];

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlanCard({ tier, interval }: { tier: PlanTier; interval: BillingInterval }) {
  const annual = interval === "annual";
  const price = annual ? tier.annualCents : tier.monthlyCents;
  const href = `/build?plan=${tier.id}&interval=${interval}`;
  return (
    <div className={`cp-card${tier.popular ? " is-popular" : ""}`}>
      {tier.popular && <span className="cp-badge">Most popular</span>}
      <h2 className="cp-name">{tier.name}</h2>
      <p className="cp-blurb">{tier.blurb}</p>

      <div className="cp-price-row">
        <span className="cp-price">{dollars(price)}</span>
        <span className="cp-period">{annual ? "/year" : "/month"}</span>
      </div>
      <p className="cp-subprice">
        {annual
          ? `${dollars(Math.round(tier.annualCents / 12))}/month, billed yearly · 2 months free`
          : "Billed monthly · cancel any time"}
      </p>

      {/* The one thing that differs between plans, so it gets the weight. */}
      <div className="cp-allowance">
        <span className="cp-allowance-amount">{dollars(tier.allowanceCents)}</span>
        <span className="cp-allowance-label">of AI usage included every month</span>
        {annual && <span className="cp-allowance-note">{dollars(tier.allowanceCents * 12)} added up front each year</span>}
      </div>

      <a href={href} className={`cp-cta${tier.popular ? "" : " is-outline"}`}>
        Choose {tier.name}
      </a>
    </div>
  );
}

export default function PricingPlans() {
  const [billing, setBilling] = useState<BillingInterval>("monthly");

  return (
    <section className="cp">
      <div className="cp-head">
        <p className="cp-eyebrow">Pricing</p>
        <h1 className="cp-h1">Pick the plan that fits your semester.</h1>
        <p className="cp-sub">
          Every plan is your own private agent, set up for you. The difference is how much AI usage
          comes with it each month.
        </p>

        <div className="cp-toggle" role="group" aria-label="Billing interval">
          <button
            type="button"
            className={billing === "monthly" ? "is-active" : ""}
            onClick={() => setBilling("monthly")}
            aria-pressed={billing === "monthly"}
          >
            Monthly
          </button>
          <button
            type="button"
            className={billing === "annual" ? "is-active" : ""}
            onClick={() => setBilling("annual")}
            aria-pressed={billing === "annual"}
          >
            Annual <span className="cp-save">2 months free</span>
          </button>
        </div>
      </div>

      <div className="cp-grid">
        {PLAN_TIERS.map((tier) => (
          <PlanCard key={tier.id} tier={tier} interval={billing} />
        ))}
      </div>

      <div className="cp-includes">
        <h2 className="cp-h2">Every plan includes</h2>
        <ul>
          {EVERY_PLAN.map((item) => (
            <li key={item}>
              <span className="cp-check"><CheckIcon /></span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="cp-faq">
        <h2 className="cp-h2">Questions</h2>
        {FAQ.map(({ q, a }) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </div>

      <style>{`
        .cp {
          --cp-green: #2D7A3A;
          --cp-green-dark: #245F2E;
          --cp-green-tint: #F2F8EF;
          --cp-green-check: #E7F1E3;
          --cp-white: #FFFFFF;
          --cp-ink: #1A1A1A;
          --cp-body: #565650;
          --cp-muted: #8A897F;
          --cp-line: #E6E4DC;
          --cp-mono: 'IBM Plex Mono', ui-monospace, monospace;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          color: var(--cp-ink);
          padding: 32px 20px 96px;
          -webkit-font-smoothing: antialiased;
        }
        .cp *, .cp *::before, .cp *::after { box-sizing: border-box; }

        .cp-head { text-align: center; max-width: 640px; margin: 0 auto; }
        .cp-eyebrow {
          font-family: var(--cp-mono); font-size: 12px; font-weight: 500;
          letter-spacing: 0.16em; text-transform: uppercase; color: var(--cp-green); margin: 0 0 12px;
        }
        .cp-h1 { font-size: 40px; line-height: 1.12; font-weight: 700; letter-spacing: -0.02em; margin: 0 0 14px; }
        .cp-sub { font-size: 17px; line-height: 1.6; color: var(--cp-body); margin: 0 auto 28px; max-width: 520px; }

        .cp-toggle {
          display: inline-flex; gap: 4px; background: var(--cp-white);
          border: 1px solid var(--cp-line); border-radius: 12px; padding: 4px;
        }
        .cp-toggle button {
          font: inherit; font-size: 14px; font-weight: 500; border: none; background: transparent;
          color: var(--cp-body); padding: 9px 20px; border-radius: 9px; cursor: pointer;
          transition: background 0.18s ease, color 0.18s ease;
        }
        .cp-toggle button.is-active { background: var(--cp-green); color: #fff; }
        .cp-save {
          font-family: var(--cp-mono); font-size: 10px; letter-spacing: 0.04em;
          background: var(--cp-green-check); color: var(--cp-green-dark);
          border-radius: 999px; padding: 2px 7px; margin-left: 7px; vertical-align: middle;
        }
        .cp-toggle button.is-active .cp-save { background: rgba(255,255,255,0.22); color: #fff; }

        .cp-grid {
          display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px;
          max-width: 1040px; margin: 44px auto 0; align-items: stretch;
        }
        .cp-card {
          position: relative; display: flex; flex-direction: column;
          background: var(--cp-white); border: 1px solid var(--cp-line);
          border-radius: 18px; padding: 30px 26px 26px;
        }
        .cp-card.is-popular { border: 2px solid var(--cp-green); background: var(--cp-green-tint); }
        .cp-badge {
          position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
          font-family: var(--cp-mono); font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase;
          background: var(--cp-green); color: #fff; border-radius: 999px; padding: 4px 12px; white-space: nowrap;
        }
        .cp-name { font-size: 20px; font-weight: 600; margin: 0 0 4px; }
        .cp-blurb { font-size: 14px; line-height: 1.55; color: var(--cp-body); margin: 0 0 22px; min-height: 44px; }
        .cp-price-row { display: flex; align-items: baseline; gap: 6px; }
        .cp-price { font-size: 44px; font-weight: 700; letter-spacing: -0.02em; line-height: 1; color: var(--cp-ink); }
        .cp-card.is-popular .cp-price { color: var(--cp-green); }
        .cp-period { font-family: var(--cp-mono); font-size: 14px; color: var(--cp-muted); }
        .cp-subprice { font-size: 13px; color: var(--cp-muted); margin: 8px 0 22px; min-height: 18px; }

        .cp-allowance {
          display: flex; flex-direction: column; gap: 2px;
          background: var(--cp-green-check); border-radius: 12px; padding: 14px 16px; margin: 0 0 24px;
        }
        .cp-allowance-amount { font-size: 26px; font-weight: 700; color: var(--cp-green-dark); line-height: 1.1; }
        .cp-allowance-label { font-size: 13.5px; color: var(--cp-ink); }
        .cp-allowance-note { font-size: 12px; color: var(--cp-body); margin-top: 4px; }

        .cp-cta {
          margin-top: auto; display: flex; align-items: center; justify-content: center;
          height: 50px; border-radius: 12px; font-size: 15px; font-weight: 600; text-decoration: none;
          background: var(--cp-green); color: #fff; border: 2px solid var(--cp-green);
          transition: background 0.18s ease, color 0.18s ease;
        }
        .cp-cta:hover { background: var(--cp-green-dark); border-color: var(--cp-green-dark); }
        .cp-cta.is-outline { background: transparent; color: var(--cp-green); }
        .cp-cta.is-outline:hover { background: var(--cp-green); color: #fff; }

        .cp-h2 { font-size: 24px; font-weight: 600; letter-spacing: -0.01em; margin: 0 0 20px; text-align: center; }
        .cp-includes {
          max-width: 760px; margin: 64px auto 0; background: var(--cp-white);
          border: 1px solid var(--cp-line); border-radius: 18px; padding: 36px 36px 30px;
        }
        .cp-includes ul {
          list-style: none; margin: 0; padding: 0;
          display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 28px;
        }
        .cp-includes li { display: flex; align-items: flex-start; gap: 11px; font-size: 15px; line-height: 1.5; padding: 6px 0; }
        .cp-check {
          flex: 0 0 auto; width: 22px; height: 22px; border-radius: 50%;
          background: var(--cp-green); color: #fff; display: flex; align-items: center; justify-content: center; margin-top: 1px;
        }
        .cp-check svg { width: 12px; height: 12px; }

        .cp-faq { max-width: 760px; margin: 56px auto 0; }
        .cp-faq details {
          background: var(--cp-white); border: 1px solid var(--cp-line); border-radius: 14px;
          padding: 18px 22px; margin-bottom: 10px;
        }
        .cp-faq summary { font-size: 16px; font-weight: 600; cursor: pointer; list-style-position: inside; }
        .cp-faq details p { font-size: 15px; line-height: 1.65; color: var(--cp-body); margin: 12px 0 0; }

        @media (max-width: 860px) {
          .cp-grid { grid-template-columns: minmax(0, 1fr); max-width: 440px; gap: 28px; }
          .cp-blurb { min-height: 0; }
        }
        @media (max-width: 560px) {
          .cp-h1 { font-size: 30px; }
          .cp-includes { padding: 28px 22px 24px; }
          .cp-includes ul { grid-template-columns: minmax(0, 1fr); }
        }
      `}</style>
    </section>
  );
}
