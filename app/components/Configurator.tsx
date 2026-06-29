"use client";

import { useState, useCallback } from "react";

const CALENDLY = "https://calendly.com/therealdaveo/apolloai";

type Tier = "undergraduate" | "graduate" | "scholar";
type HostingPlan = "basic" | "plus" | "pro" | "max";
type SupportPlan = "none" | "sixmonths" | "annual";
type Onboarding = "standard" | "whiteglove";

export interface ConfigSummary {
  impl: string;
  tier: string;
  setupFee: number;
  hosting: string;
  hostingFee: number;
  hostingAnnual: boolean;
  support: string;
  supportPrice: string;
  onboarding: string;
  onboardingFee: number;
  // Keys for server-side Stripe price resolution (must match lib/pricing.ts keys).
  planKey: Tier;
  hostingKey: HostingPlan;
  supportKey: SupportPlan;
  onboardingKey: Onboarding;
}

interface ConfigState {
  tier: Tier | null;
  hosting: HostingPlan | null;
  support: SupportPlan | null;
  onboarding: Onboarding | null;
}

const TIERS: { id: Tier; badge: string; name: string; price: number; readyTime: string; desc: string; features: string[] }[] = [
  {
    id: "undergraduate", badge: "Most Popular", name: "The Undergraduate", price: 199, readyTime: "30 min – 72 hours",
    desc: "The fastest path to your own AI agent. Submit your completed onboarding form and our proprietary software spins up your agent, ready within 30 minutes to 72 hours.",
    features: [
      "3 integrations included",
      "Agent live in 30 min – 72 hours",
      "Standard onboarding form",
      "Web portal access",
      "Cloud hosted via Apollo Claw",
      "Telegram access",
    ],
  },
  {
    id: "graduate", badge: "Advanced", name: "The Graduate", price: 399, readyTime: "30 min – 72 hours",
    desc: "More depth, more personalization. Submit your enhanced onboarding form and our proprietary software develops your agent within 30 minutes to 72 hours, plus a live call and 7 days of post-launch support.",
    features: [
      "5 integrations included",
      "Agent live in 30 min – 72 hours",
      "Enhanced onboarding form",
      "30-minute onboarding call",
      "7 days post-launch support",
      "Web portal access",
      "Cloud hosted via Apollo Claw",
      "Telegram access",
    ],
  },
  {
    id: "scholar", badge: "Most Powerful", name: "The Scholar", price: 599, readyTime: "30 min – 72 hours",
    desc: "Built for high-achievers who want the full picture. Submit your enhanced onboarding form and our proprietary software develops your agent within 30 minutes to 72 hours, backed by a 60-minute deep-dive call and 14 days of post-launch support.",
    features: [
      "7 integrations included",
      "Agent live in 30 min – 72 hours",
      "Enhanced onboarding form",
      "60-minute onboarding call",
      "14 days post-launch support",
      "Web portal access",
      "Cloud hosted via Apollo Claw",
      "Telegram access",
    ],
  },
];

const SUPPORT_PLANS: { id: SupportPlan; label: string; price: string; fee: number; desc: string }[] = [
  { id: "none",      label: "No Support Plan",  price: "Included",   fee: 0,    desc: "Go independent after setup. You own the agent." },
  { id: "sixmonths", label: "6 Months Support", price: "$750",       fee: 750,  desc: "6 months of check-ins, integration updates, and priority support." },
  { id: "annual",    label: "Annual Support",   price: "$1,200/yr",  fee: 1200, desc: "Best value. Full year of support, updates, and access to new features as they ship." },
];

const HOSTING_PRICES: Record<HostingPlan, number> = { basic: 19.99, plus: 29.99, pro: 49.99, max: 99 };
const HOSTING_LABELS: Record<HostingPlan, string> = { basic: "Basic", plus: "Plus", pro: "Pro", max: "Max" };

const HOSTING_TIERS: {
  id: HostingPlan;
  price: number;
  name: string;
  features: { text: string; bold?: boolean }[];
}[] = [
  {
    id: "basic", price: 19.99, name: "Basic",
    features: [
      { text: "1 vCPU" },
      { text: "4 GB RAM" },
      { text: "12 GB storage" },
      { text: "Bring your own API keys (BYOK)" },
      { text: "All supported AI models" },
      { text: "1,000+ ready-to-use integrations" },
      { text: "$20/month in AI credits" },
      { text: "75 web searches / month" },
      { text: "1K app actions / month" },
    ],
  },
  {
    id: "plus", price: 29.99, name: "Plus",
    features: [
      { text: "2 vCPU" },
      { text: "6 GB RAM" },
      { text: "20 GB storage" },
      { text: "Bring your own API keys (BYOK)" },
      { text: "All supported AI models" },
      { text: "1,000+ ready-to-use integrations" },
      { text: "$20/month in AI credits" },
      { text: "75 web searches / month" },
      { text: "1K app actions / month" },
    ],
  },
  {
    id: "pro", price: 49.99, name: "Pro",
    features: [
      { text: "4 vCPU" },
      { text: "8 GB RAM" },
      { text: "30 GB storage" },
      { text: "Bring your own API keys (BYOK)" },
      { text: "All supported AI models" },
      { text: "1,000+ ready-to-use integrations" },
      { text: "$20/month in AI credits" },
      { text: "75 web searches / month" },
      { text: "1K app actions / month" },
    ],
  },
  {
    id: "max", price: 99, name: "Max",
    features: [
      { text: "6 vCPU" },
      { text: "12 GB RAM" },
      { text: "50 GB storage" },
      { text: "Email & Telegram Support", bold: true },
      { text: "Bring your own API keys (BYOK)" },
      { text: "All supported AI models" },
      { text: "1,000+ ready-to-use integrations" },
      { text: "$20/month in AI credits" },
      { text: "75 web searches / month" },
      { text: "1K app actions / month" },
    ],
  },
];

export default function Configurator({ onComplete }: { onComplete?: (s: ConfigSummary) => void } = {}) {
  const [config, setConfig] = useState<ConfigState>({
    tier: null, hosting: null, support: null, onboarding: null,
  });

  const selectHosting = useCallback((plan: HostingPlan) => {
    setConfig((prev) => ({ ...prev, hosting: plan }));
  }, []);

  const isComplete = config.tier && config.hosting && config.support && config.onboarding;

  const handleCTA = () => {
    const tierData = TIERS.find(t => t.id === config.tier)!;
    const wg = config.onboarding === "whiteglove";
    const summary: ConfigSummary = {
      impl: tierData.name,
      tier: config.tier ?? "",
      setupFee: tierData.price,
      hosting: config.hosting ? HOSTING_LABELS[config.hosting] : "",
      hostingFee: config.hosting ? HOSTING_PRICES[config.hosting] : 0,
      hostingAnnual: false,
      support: SUPPORT_PLANS.find(p => p.id === config.support)?.label ?? "None",
      supportPrice: SUPPORT_PLANS.find(p => p.id === config.support)?.price ?? "Included",
      onboarding: wg ? "White Glove" : "Standard",
      onboardingFee: wg ? 650 : 0,
      planKey: config.tier!,
      hostingKey: config.hosting!,
      supportKey: config.support!,
      onboardingKey: config.onboarding!,
    };
    if (onComplete) { onComplete(summary); return; }
    window.open(CALENDLY, "_blank");
  };

  const tierData = config.tier ? TIERS.find(t => t.id === config.tier) : null;
  const setupFee = tierData?.price ?? null;
  const hostingFee = config.hosting ? HOSTING_PRICES[config.hosting] : null;
  const supportPlan = config.support ? SUPPORT_PLANS.find(p => p.id === config.support) : null;
  const implLabel = tierData?.name ?? null;

  return (
    <section id="configurator" style={{ background: "var(--cream)", padding: "32px 0 90px" }}>

      {/* STEP 1 — full width */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 32px" }}>
        <div className="config-step">
          <div className="step-header">
            <div className="step-num">1</div>
            <span className="step-title">Choose Your Agent&apos;s Build</span>
          </div>
          <p style={{ fontSize: 14, color: "rgba(11,23,41,.55)", lineHeight: 1.7, marginBottom: 24 }}>
            Every College Agent is built around you. Your schedule, your goals, your communication style.
            Choose the tier that fits where you are right now. All three include cloud hosting, Telegram access,
            web portal access, and everything listed below.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {TIERS.map((card) => (
              <div
                key={card.id}
                className={`impl-card ${config.tier === card.id ? "selected" : ""}`}
                onClick={() => setConfig(prev => ({ ...prev, tier: card.id }))}
                style={{ cursor: "pointer", display: "flex", flexDirection: "column" }}
              >
                <div className="impl-badge">{card.badge}</div>
                <div className="impl-name">{card.name}</div>
                <div className="impl-desc" style={{ marginBottom: 16 }}>{card.desc}</div>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 7, marginBottom: 20, flex: 1 }}>
                  {card.features.map(f => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(11,23,41,.7)" }}>
                      <span style={{ width: 16, height: 16, borderRadius: "50%", background: "rgba(61,139,61,.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 9, color: "var(--green)", fontWeight: 700 }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <div style={{ borderTop: "1px solid rgba(11,23,41,.07)", paddingTop: 14 }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 800, color: "var(--green)" }}>
                    ${card.price.toLocaleString()}
                    <span style={{ fontSize: 12, fontWeight: 400, color: "rgba(11,23,41,.35)", marginLeft: 4 }}>one-time</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="custom-note" style={{ marginTop: 16 }}>
            Need more integrations or something custom?{" "}
            <a href={CALENDLY} target="_blank" rel="noopener noreferrer">
              Custom integrations available as needed.
            </a>
          </p>
        </div>
      </div>

      {/* STEP 2 — full width */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 32px" }}>
        <div className="config-step">
          <div className="step-header">
            <div className="step-num">2</div>
            <span className="step-title">Choose Your Hosting Plan</span>
          </div>
          <div className="hosting-grid">
            {HOSTING_TIERS.map((plan) => (
              <div
                key={plan.id}
                className={`hosting-card ${config.hosting === plan.id ? "selected" : ""}`}
                onClick={() => selectHosting(plan.id)}
              >
                <div className="hosting-price">
                  ${plan.price}<span className="hosting-price-unit">/mo</span>
                </div>
                <div className="hosting-name">{plan.name}</div>
                <ul className="hosting-features">
                  {plan.features.map((f, i) => (
                    <li key={i} className={f.bold ? "bold" : undefined}>{f.text}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="hosting-note">
            Apollo Claw cloud hosting is required for all College Agent deployments. Your agent lives
            in the cloud, accessible from anywhere, on any device.
          </p>
        </div>
      </div>

      <div className="config-layout">
        {/* LEFT COLUMN */}
        <div className="config-main">

          {/* STEP 3 — Support Plan */}
          <div className="config-step">
            <div className="step-header">
              <div className="step-num">3</div>
              <span className="step-title">Choose Your Support Plan</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {SUPPORT_PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={`support-option ${config.support === plan.id ? "selected" : ""}`}
                  onClick={() => setConfig(prev => ({ ...prev, support: plan.id }))}
                >
                  <div className="tier-radio" />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--navy)" }}>{plan.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--green)", fontFamily: "var(--font-mono)" }}>{plan.price}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(11,23,41,.55)", lineHeight: 1.5 }}>{plan.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* STEP 4 — Onboarding */}
          <div className="config-step">
            <div className="step-header">
              <div className="step-num">4</div>
              <span className="step-title">Choose Your Onboarding Experience</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {([
                {
                  id: "standard" as Onboarding,
                  label: "Standard Onboarding",
                  price: "Included",
                  priceColor: "#27ae60",
                  time: "Agent ready in 30 minutes to 72 hours",
                  desc: "Complete your onboarding form after checkout. Our proprietary software develops your agent and has it live within 30 minutes to 72 hours.",
                },
                {
                  id: "whiteglove" as Onboarding,
                  label: "White Glove Onboarding",
                  price: "+$650",
                  priceColor: "var(--green)",
                  time: "Agent ready in 30 minutes to 72 hours",
                  desc: "A dedicated 60-minute deep-dive call before your form is submitted. Our proprietary software develops your agent with advanced skills, custom workflows, and deep personalization, live within 30 minutes to 72 hours.",
                },
              ] as const).map((opt) => (
                <div
                  key={opt.id}
                  className={`support-option ${config.onboarding === opt.id ? "selected" : ""}`}
                  onClick={() => setConfig(prev => ({ ...prev, onboarding: opt.id }))}
                >
                  <div className="tier-radio" />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--navy)" }}>{opt.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: opt.priceColor, fontFamily: "var(--font-mono)" }}>{opt.price}</span>
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--green)", fontWeight: 600, marginBottom: 4 }}>{opt.time}</div>
                    <div style={{ fontSize: 12, color: "rgba(11,23,41,.55)", lineHeight: 1.5 }}>{opt.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* STEP 5 */}
          <div className="config-step">
            <div className="step-header">
              <div className="step-num">5</div>
              <span className="step-title">What&apos;s Always Included</span>
            </div>
            <div className="included-list">
              {[
                "Named AI personal agent, built around you",
                "Your voice and communication style trained in",
                "Brave Search, real-time research built in",
                "PDF reader, upload, summarize, and query any document",
                "Communication via Telegram, accessible anywhere",
                "Web portal access",
                "LinkedIn integration included",
                "Google Workspace or Office 365 (appropriate access required)",
                "Cloud hosted via Apollo Claw, access from any device",
                "Agent ready in 30 minutes to 72 hours",
                "Support plan options available",
              ].map((item) => (
                <div key={item} className="included-item">
                  <div className="included-check" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ORDER SUMMARY */}
        <div className="order-summary">
          <div className="progress-dots">
            <div className={`dot ${config.tier ? "done" : ""}`} />
            <div className={`dot ${config.hosting ? "done" : ""}`} />
            <div className={`dot ${config.support ? "done" : ""}`} />
            <div className={`dot ${config.onboarding ? "done" : ""}`} />
          </div>
          <div className="order-title">Order Summary</div>

          <div className="order-row">
            <div className="order-label">Implementation</div>
            <div className={`order-value ${implLabel ? "" : "placeholder"}`}>
              {implLabel ?? "Not selected"}
            </div>
          </div>
          <div className="order-row">
            <div className="order-label">Setup Fee</div>
            <div className={`order-value ${setupFee ? "" : "placeholder"}`}>
              {setupFee ? `$${setupFee.toLocaleString()}` : "--"}
            </div>
          </div>
          <div className="order-row">
            <div className="order-label">Hosting</div>
            <div className={`order-value ${config.hosting ? "" : "placeholder"}`}>
              {config.hosting
                ? `${HOSTING_LABELS[config.hosting]} ($${hostingFee}/mo)`
                : "Not selected"}
            </div>
          </div>
          <div className="order-row">
            <div className="order-label">Support Plan</div>
            <div className={`order-value ${config.support ? "" : "placeholder"}`}>
              {supportPlan ? supportPlan.price : "Not selected"}
            </div>
          </div>
          <div className="order-row">
            <div className="order-label">Onboarding</div>
            <div className={`order-value ${config.onboarding ? "" : "placeholder"}`}>
              {config.onboarding === "whiteglove" ? "White Glove (+$650)" : config.onboarding === "standard" ? "Standard (Included)" : "Not selected"}
            </div>
          </div>
          <div className="order-row">
            <div className="order-label">Agent Ready</div>
            <div className="order-value">
              {config.onboarding ? "30 minutes to 72 hours" : "--"}
            </div>
          </div>

          <hr className="order-divider" />

          <div className="order-total-label">Total</div>
          <div className="order-total">
            {setupFee ? (
              <>
                ${setupFee.toLocaleString()}
                {hostingFee && (
                  <span> + ${hostingFee}/mo</span>
                )}
                {supportPlan && supportPlan.fee > 0 && (
                  <span> + {supportPlan.price}</span>
                )}
              </>
            ) : (
              <>-- <span>+ --/mo</span></>
            )}
          </div>

          <button
            className={`btn-purple order-cta ${isComplete ? "" : "btn-disabled"}`}
            onClick={isComplete ? handleCTA : undefined}
          >
            Build My Agent &rarr;
          </button>

        </div>
      </div>

      <style>{`
        .config-layout {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 32px;
          align-items: start;
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 24px;
        }
        .config-main { display: flex; flex-direction: column; gap: 24px; }
        .config-step {
          background: #fff;
          border: 1px solid rgba(11,23,41,0.08);
          border-radius: 14px;
          padding: 28px;
        }
        .step-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
        .step-num {
          width: 28px; height: 28px; border-radius: 50%;
          background: var(--green); color: #fff;
          font-family: var(--font-mono); font-size: 12px; font-weight: 700;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .step-title { font-size: 15px; font-weight: 700; color: var(--navy); }

        .impl-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .impl-card {
          border: 2px solid rgba(11,23,41,0.1); border-radius: 10px; padding: 18px;
          cursor: default; transition: border-color .15s;
        }
        .impl-card.selected { border-color: var(--green); background: rgba(61,139,61,0.04); }
        .impl-badge {
          font-family: var(--font-mono); font-size: 10px; font-weight: 700;
          letter-spacing: .1em; text-transform: uppercase; color: var(--green); margin-bottom: 6px;
        }
        .impl-name { font-size: 15px; font-weight: 700; color: var(--navy); margin-bottom: 6px; }
        .impl-desc { font-size: 12px; line-height: 1.6; color: rgba(11,23,41,.55); margin-bottom: 14px; }
        .tier-options {
          display: flex; flex-direction: column; gap: 8px;
          border-top: 1px solid rgba(11,23,41,.07); padding-top: 12px;
        }
        .support-option {
          display: flex; align-items: flex-start; gap: 14px; padding: 14px 16px;
          border: 1.5px solid rgba(11,23,41,.1); border-radius: 10px;
          cursor: pointer; transition: border-color .15s, background .15s; background: #fff;
        }
        .support-option:hover { border-color: rgba(61,139,61,.4); background: rgba(61,139,61,.02); }
        .support-option.selected { border-color: var(--green); background: rgba(61,139,61,.05); }
        .support-option.selected .tier-radio { border-color: var(--green); }
        .support-option.selected .tier-radio::after {
          content: ''; position: absolute; inset: 3px; border-radius: 50%; background: var(--green);
        }
        .tier-row.recommended {
          border-color: rgba(61,139,61,.35); background: rgba(61,139,61,.03);
        }
        .recommended-badge {
          display: inline-block; font-size: 9px; font-weight: 700; letter-spacing: .08em;
          text-transform: uppercase; background: var(--green); color: #fff;
          padding: 2px 7px; border-radius: 4px; margin-left: 8px; vertical-align: middle;
        }
        .tier-row {
          display: flex; align-items: center; gap: 10px;
          cursor: pointer; padding: 8px 10px; border-radius: 7px;
          border: 1.5px solid rgba(11,23,41,.1); transition: border-color .15s, background .15s;
        }
        .tier-row:hover { border-color: rgba(61,139,61,.4); }
        .tier-row.selected { border-color: var(--green); background: rgba(61,139,61,.06); }
        .tier-radio {
          width: 15px; height: 15px; border-radius: 50%;
          border: 2px solid rgba(11,23,41,.2); flex-shrink: 0; position: relative;
          transition: border-color .15s;
        }
        .tier-row.selected .tier-radio { border-color: var(--green); }
        .tier-row.selected .tier-radio::after {
          content: ''; position: absolute;
          top: 2px; left: 2px; right: 2px; bottom: 2px;
          border-radius: 50%; background: var(--green);
        }
        .tier-info { flex: 1; }
        .tier-name { font-size: 13px; font-weight: 700; color: var(--navy); }
        .tier-detail { font-size: 11px; color: rgba(11,23,41,.45); font-family: var(--font-mono); }
        .tier-price { font-size: 13px; font-weight: 700; color: var(--green); font-family: var(--font-mono); }
        .custom-note {
          font-family: var(--font-mono); font-size: 11px; color: rgba(11,23,41,.4);
          margin-top: 12px; text-align: center;
        }
        .custom-note a { color: var(--green); }

        .hosting-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
        .hosting-card {
          border: 2px solid rgba(11,23,41,.1); border-radius: 10px; padding: 18px;
          cursor: pointer; transition: border-color .15s, background .15s;
          display: flex; flex-direction: column; background: #fff;
        }
        .hosting-card:hover { border-color: rgba(61,139,61,.4); }
        .hosting-card.selected { border-color: var(--green); background: rgba(61,139,61,.04); }
        .hosting-price {
          font-family: var(--font-mono); font-size: 20px; font-weight: 700;
          color: var(--green); margin-bottom: 4px;
        }
        .hosting-price-unit { font-size: 13px; font-weight: 500; color: rgba(11,23,41,.4); }
        .hosting-name { font-size: 14px; font-weight: 700; color: var(--navy); margin-bottom: 10px; }
        .hosting-features { list-style: none; display: flex; flex-direction: column; gap: 5px; }
        .hosting-features li {
          font-size: 12px; color: rgba(11,23,41,.6);
          display: flex; align-items: center; gap: 6px;
        }
        .hosting-features li.bold { color: var(--navy); font-weight: 700; }
        .hosting-features li::before {
          content: ''; width: 5px; height: 5px; border-radius: 50%;
          background: var(--green); flex-shrink: 0;
        }
        .hosting-note {
          font-size: 12px; line-height: 1.6; color: rgba(11,23,41,.5);
          margin-top: 14px; padding: 12px; background: rgba(11,23,41,.03);
          border-radius: 7px; font-family: var(--font-mono);
        }

        .included-list { display: flex; flex-direction: column; gap: 10px; }
        .included-item { display: flex; align-items: center; gap: 10px; font-size: 13px; color: rgba(11,23,41,.7); }
        .included-check {
          width: 18px; height: 18px; border-radius: 50%;
          background: rgba(61,139,61,.12); display: flex; align-items: center;
          justify-content: center; flex-shrink: 0; position: relative;
        }
        .included-check::after {
          content: '✓'; font-size: 10px; font-weight: 700; color: var(--green);
          position: absolute;
        }

        .order-summary {
          background: #fff; border: 1.5px solid rgba(11,23,41,.1); border-radius: 14px;
          padding: 24px; position: sticky; top: 90px;
        }
        .progress-dots { display: flex; gap: 6px; margin-bottom: 16px; }
        .dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(11,23,41,.1); transition: background .2s; }
        .dot.done { background: var(--green); }
        .order-title {
          font-size: 14px; font-weight: 700; color: var(--navy);
          margin-bottom: 20px; padding-bottom: 14px; border-bottom: 1px solid rgba(11,23,41,.07);
        }
        .order-row { display: flex; flex-direction: column; gap: 3px; margin-bottom: 14px; }
        .order-label {
          font-family: var(--font-mono); font-size: 10px; text-transform: uppercase;
          letter-spacing: .08em; color: rgba(11,23,41,.35);
        }
        .order-value { font-size: 13px; font-weight: 600; color: var(--navy); }
        .order-value.placeholder { color: rgba(11,23,41,.25); font-weight: 400; font-style: italic; }
        .order-divider { border: none; border-top: 1px solid rgba(11,23,41,.07); margin: 16px 0; }
        .order-total-label {
          font-family: var(--font-mono); font-size: 10px; text-transform: uppercase;
          letter-spacing: .08em; color: rgba(11,23,41,.35); margin-bottom: 4px;
        }
        .order-total { font-size: 20px; font-weight: 800; color: var(--navy); margin-bottom: 16px; }
        .order-total span { font-size: 13px; font-weight: 500; color: rgba(11,23,41,.45); }
        .order-cta { width: 100%; padding: 14px; font-size: 13px; }
        .order-secondary {
          width: 100%; margin-top: 10px; padding: 12px; font-size: 12px; font-weight: 700;
          letter-spacing: .08em; text-transform: uppercase; background: none;
          border: 1.5px solid rgba(11,23,41,.12); border-radius: 4px;
          color: rgba(11,23,41,.55); transition: border-color .15s, color .15s;
        }
        .order-secondary:hover { border-color: var(--navy); color: var(--navy); }

        @media (max-width: 1000px) {
          .hosting-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 900px) {
          .config-layout { grid-template-columns: 1fr; }
          .order-summary { position: static; }
        }
        @media (max-width: 640px) {
          .impl-grid { grid-template-columns: 1fr; }
          .hosting-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  );
}
