"use client";

import { useState, useCallback } from "react";

const CALENDLY = "https://calendly.com/therealdaveo/apolloai";

type Framework = "hermes" | "openclaw";
type Tier = "starter" | "pro";
type HostingPlan = "basic" | "pro";
type SupportPlan = "none" | "semester" | "annual";
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
  maxIntegrations: number;
  onboarding: string;
  onboardingFee: number;
}

interface ConfigState {
  framework: Framework | null;
  tier: Tier | null;
  hosting: HostingPlan | null;
  support: SupportPlan | null;
  onboarding: Onboarding | null;
}

export const INTEGRATIONS: Record<string, string[]> = {
  "School & LMS": [
    "Canvas", "Blackboard", "Brightspace (D2L)", "Google Classroom", "Moodle", "Gradescope",
  ],
  "Notes & Knowledge": [
    "Notion", "Google Docs", "Obsidian", "Microsoft OneNote", "Apple Notes", "Roam Research",
  ],
  "Cloud Storage": [
    "Google Drive", "iCloud Drive", "Dropbox", "OneDrive",
  ],
  "Email & Calendar": [
    "Gmail", "Google Calendar", "Outlook / Microsoft 365", "Apple Mail", "Apple Calendar", "Calendly",
  ],
  "Messaging": [
    "iMessage", "WhatsApp", "Telegram", "Discord", "Slack", "GroupMe",
  ],
  "Tasks & Planning": [
    "Todoist", "Apple Reminders", "TickTick", "Things 3", "Google Tasks", "Structured",
  ],
  "Research & Writing": [
    "Zotero", "Grammarly", "Overleaf", "Google Scholar", "Perplexity AI", "ChatGPT",
  ],
  "Career & Internships": [
    "LinkedIn", "Handshake", "GitHub", "Indeed", "Glassdoor", "Canva",
  ],
  "Finance & Payments": [
    "Venmo", "Cash App", "Splitwise", "Zelle", "YNAB", "Robinhood",
  ],
  "Health & Wellness": [
    "Apple Health", "MyFitnessPal", "Headspace", "Calm", "Strava", "Nike Run Club",
  ],
  "Social": [
    "Instagram", "TikTok", "Snapchat", "Reddit", "X (Twitter)", "BeReal",
  ],
  "Entertainment": [
    "Spotify", "Apple Music", "YouTube", "Audible", "Pocket Casts",
  ],
};

const SUPPORT_PLANS: { id: SupportPlan; label: string; price: string; desc: string }[] = [
  { id: "none",     label: "No Support Plan",     price: "Free",        desc: "Go independent after co-training. You own the agent." },
  { id: "semester", label: "Semester Plan",        price: "$500/semester", desc: "Ongoing check-ins, integration updates, and priority support for one semester." },
  { id: "annual",   label: "Annual Plan",          price: "$900/yr",     desc: "Best value. Full year of support, updates, and access to new features as they ship." },
];

const TIER_PRICES: Record<Framework, Record<Tier, number>> = {
  hermes:   { starter: 999,  pro: 1499 },
  openclaw: { starter: 1499, pro: 1999 },
};
const TIER_MAX_INT: Record<Tier, number> = { starter: 3, pro: 5 };
const HOSTING_PRICES: Record<HostingPlan, number> = { basic: 89, pro: 159 };

export default function Configurator({ onComplete }: { onComplete?: (s: ConfigSummary) => void } = {}) {
  const [annual, setAnnual] = useState(false);
  const [config, setConfig] = useState<ConfigState>({
    framework: null, tier: null, hosting: null, support: null, onboarding: null,
  });

  const selectTier = useCallback((framework: Framework, tier: Tier) => {
    setConfig((prev) => ({ ...prev, framework, tier }));
  }, []);

  const selectHosting = useCallback((plan: HostingPlan) => {
    setConfig((prev) => ({ ...prev, hosting: plan }));
  }, []);

  const isComplete = config.framework && config.tier && config.hosting && config.support && config.onboarding;

  const handleCTA = () => {
    const wg = config.onboarding === "whiteglove";
    const summary: ConfigSummary = {
      impl: config.framework === "hermes" ? "The Undergraduate" : config.tier === "starter" ? "The Graduate" : "The Scholar",
      tier: config.tier ?? "",
      setupFee: config.tier && config.framework ? TIER_PRICES[config.framework][config.tier] : 0,
      hosting: config.hosting === "basic" ? "Basic" : "Pro",
      hostingFee: config.hosting ? HOSTING_PRICES[config.hosting] : 0,
      hostingAnnual: annual,
      support: SUPPORT_PLANS.find(p => p.id === config.support)?.label ?? "None",
      supportPrice: SUPPORT_PLANS.find(p => p.id === config.support)?.price ?? "Free",
      maxIntegrations: config.tier ? TIER_MAX_INT[config.tier] : 0,
      onboarding: wg ? "White Glove" : "Standard",
      onboardingFee: wg ? 650 : 0,
    };
    if (onComplete) { onComplete(summary); return; }
    window.open(CALENDLY, "_blank");
  };

  const setupFee = config.tier && config.framework ? TIER_PRICES[config.framework][config.tier] : null;
  const hostingFee = config.hosting ? HOSTING_PRICES[config.hosting] : null;
  const supportLabel = config.support ? SUPPORT_PLANS.find(p => p.id === config.support)?.price ?? null : null;
  const maxInt = config.tier ? TIER_MAX_INT[config.tier] : null;

  const implLabel =
    config.framework && config.tier
      ? config.framework === "hermes"
        ? "The Undergraduate"
        : config.tier === "starter" ? "The Graduate" : "The Scholar"
      : null;

  return (
    <section id="configurator" style={{ background: "var(--cream)", padding: "90px 0" }}>
      <div style={{ textAlign: "center", padding: "0 24px", marginBottom: 48 }}>
        <span className="mono-label">Configure Yours</span>
        <h2 className="section-title">Build Your Agent</h2>
        <p className="section-sub" style={{ maxWidth: 520, margin: "12px auto 0" }}>
          Four steps. Under five minutes. Complete all steps to unlock your agent.
        </p>
      </div>

      <div className="config-layout">
        {/* LEFT COLUMN */}
        <div className="config-main">
          {/* STEP 1 */}
          <div className="config-step">
            <div className="step-header">
              <div className="step-num">1</div>
              <span className="step-title">Choose Your Implementation</span>
            </div>
            <div className="impl-grid">
              {(
                [
                  {
                    id: "hermes" as Framework,
                    badge: "Most Popular",
                    name: "The Undergraduate",
                    desc: "Pre-configured student agent. Battle-tested workflows, fast setup, ready within 24–48 hours of your onboarding form.",
                  },
                  {
                    id: "openclaw" as Framework,
                    badge: "Advanced",
                    name: "The Graduate / The Scholar",
                    desc: "Deeper configuration, expanded skill set, and more personalization. Ready within 7 days.",
                  },
                ] as const
              ).map((card) => (
                <div
                  key={card.id}
                  className={`impl-card ${config.framework === card.id ? "selected" : ""}`}
                >
                  <div className="impl-badge">{card.badge}</div>
                  <div className="impl-name">{card.name}</div>
                  <div className="impl-desc">{card.desc}</div>
                  <div className="tier-options">
                    {(["starter", "pro"] as Tier[]).map((tier) => (
                      <div
                        key={tier}
                        className={`tier-row ${tier === "pro" && card.id === "hermes" ? "recommended" : ""} ${
                          config.framework === card.id && config.tier === tier ? "selected" : ""
                        }`}
                        onClick={() => selectTier(card.id, tier)}
                      >
                        <div className="tier-radio" />
                        <div className="tier-info">
                          <div className="tier-name">
                            {tier.charAt(0).toUpperCase() + tier.slice(1)}
                            {tier === "pro" && card.id === "hermes" && (
                              <span className="recommended-badge">Recommended</span>
                            )}
                          </div>
                          <div className="tier-detail">
                            {TIER_MAX_INT[tier]} integrations
                          </div>
                        </div>
                        <div className="tier-price">
                          ${TIER_PRICES[card.id][tier].toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="custom-note">
              Need more than 5 integrations or something not on the list?{" "}
              <a href={CALENDLY} target="_blank" rel="noopener noreferrer">
                Custom integrations available as needed.
              </a>
            </p>
          </div>

          {/* STEP 2 */}
          <div className="config-step">
            <div className="step-header">
              <div className="step-num">2</div>
              <span className="step-title">Choose Your Hosting Plan</span>
            </div>
            {/* Billing toggle */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: annual ? "rgba(11,23,41,.35)" : "var(--navy)" }}>Monthly</span>
              <div
                onClick={() => setAnnual(a => !a)}
                style={{
                  width: 40, height: 22, borderRadius: 11, cursor: "pointer",
                  background: annual ? "var(--green)" : "rgba(11,23,41,.15)",
                  position: "relative", transition: "background .2s",
                }}
              >
                <div style={{
                  position: "absolute", top: 3, left: annual ? 21 : 3,
                  width: 16, height: 16, borderRadius: "50%", background: "#fff",
                  transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)",
                }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: annual ? "var(--green)" : "rgba(11,23,41,.35)" }}>
                Annual <span style={{ fontSize: 10, background: "rgba(61,139,61,.12)", color: "var(--green)", padding: "2px 6px", borderRadius: 4, marginLeft: 4 }}>2 months free</span>
              </span>
            </div>
            <div className="hosting-grid">
              {(
                [
                  {
                    id: "basic" as HostingPlan,
                    price: 89,
                    name: "Basic",
                    features: ["Standard VPS instance", "Single agent slot", "99.9% uptime SLA", "Access via Telegram"],
                  },
                  {
                    id: "pro" as HostingPlan,
                    price: 159,
                    name: "Pro",
                    features: ["Performance VPS instance", "Priority queue", "Faster response times", "Access via Telegram + web"],
                  },
                ] as const
              ).map((plan) => (
                <div
                  key={plan.id}
                  className={`hosting-card ${config.hosting === plan.id ? "selected" : ""}`}
                  onClick={() => selectHosting(plan.id)}
                >
                  <div className="hosting-price">
                    ${annual ? (plan.price * 10).toLocaleString()
                      : plan.price}
                    <span className="hosting-price-unit">{annual ? "/yr" : "/mo"}</span>
                  </div>
                  {annual && (
                    <div style={{ fontSize: 10, color: "var(--green)", fontFamily: "var(--font-mono)", fontWeight: 600, marginBottom: 6 }}>
                      Save ${(plan.price * 2).toLocaleString()}/yr
                    </div>
                  )}
                  <div className="hosting-name">{plan.name}</div>
                  <ul className="hosting-features">
                    {plan.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="hosting-note">
              Apollo Cloud hosting is required for all College Agent deployments. Your agent lives
              in the cloud, accessible from anywhere, on any device.
            </p>
          </div>

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
                  time: "Agent ready in 24–48 hrs (Undergraduate) or 7 days (Graduate/Scholar)",
                  desc: "Complete your onboarding form after checkout. We build your agent and you're live fast.",
                },
                {
                  id: "whiteglove" as Onboarding,
                  label: "White Glove Onboarding",
                  price: "+$650",
                  priceColor: "var(--green)",
                  time: "Agent ready in 14 days",
                  desc: "A dedicated 60-minute deep-dive call with your builder. Advanced skills, custom workflows, and deep personalization — we learn how you think before we build.",
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
                "Tavily Web Search, real-time research built in",
                "PDF reader, upload, summarize, and query any document",
                "Communication via Telegram, accessible anywhere",
                "LinkedIn integration included",
                "Google Workspace or Office 365 (appropriate access required)",
                "Cloud hosted, access from any device",
                "30-day hands-on co-training period included",
                "Agent ready in 24–48 hrs (Undergraduate) or 7 days (Graduate/Scholar)",
                "Support plan options available after co-training",
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
                ? `${config.hosting === "basic" ? "Basic" : "Pro"} ($${annual ? (hostingFee! * 10).toLocaleString() + "/yr" : hostingFee + "/mo"})`
                : "Not selected"}
            </div>
          </div>
          <div className="order-row">
            <div className="order-label">Support Plan</div>
            <div className={`order-value ${config.support ? "" : "placeholder"}`}>
              {config.support
                ? SUPPORT_PLANS.find(p => p.id === config.support)?.price ?? "Not selected"
                : "Not selected"}
            </div>
          </div>
          <div className="order-row">
            <div className="order-label">Integrations</div>
            <div className={`order-value ${maxInt ? "" : "placeholder"}`}>
              {maxInt ? `Up to ${maxInt} — chosen at checkout` : "Select plan first"}
            </div>
          </div>
          <div className="order-row">
            <div className="order-label">Onboarding</div>
            <div className={`order-value ${config.onboarding ? "" : "placeholder"}`}>
              {config.onboarding === "whiteglove" ? "White Glove (+$650)" : config.onboarding === "standard" ? "Standard (Included)" : "Not selected"}
            </div>
          </div>
          <div className="order-row">
            <div className="order-label">30-Day Co-Training</div>
            <div className="order-value" style={{ color: "#27ae60" }}>Included</div>
          </div>
          <div className="order-row">
            <div className="order-label">Agent Ready</div>
            <div className="order-value">
              {config.onboarding === "whiteglove" ? "14 days" : config.framework === "hermes" ? "24–48 hrs" : config.framework === "openclaw" ? "7 days" : "--"}
            </div>
          </div>

          <hr className="order-divider" />

          <div className="order-total-label">Total</div>
          <div className="order-total">
            {setupFee ? (
              <>
                ${setupFee.toLocaleString()}
                {hostingFee && (
                  <span> + ${annual ? (hostingFee * 10).toLocaleString() + "/yr" : hostingFee + "/mo"}</span>
                )}
                {supportLabel && supportLabel !== "Free" && (
                  <span> + {supportLabel}</span>
                )}
              </>
            ) : (
              <>-- <span>+ --/{annual ? "yr" : "mo"}</span></>
            )}
          </div>

          <button
            className={`btn-purple order-cta ${isComplete ? "" : "btn-disabled"}`}
            onClick={isComplete ? handleCTA : undefined}
          >
            Build My Agent &rarr;
          </button>
          <button
            className="order-secondary"
            onClick={() => window.open(CALENDLY, "_blank")}
          >
            Ask a Question
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

        .hosting-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .hosting-card {
          border: 2px solid rgba(11,23,41,.1); border-radius: 10px; padding: 18px;
          cursor: pointer; transition: border-color .15s, background .15s;
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
        .hosting-features li::before {
          content: ''; width: 5px; height: 5px; border-radius: 50%;
          background: var(--green); flex-shrink: 0;
        }
        .hosting-note {
          font-size: 12px; line-height: 1.6; color: rgba(11,23,41,.5);
          margin-top: 14px; padding: 12px; background: rgba(11,23,41,.03);
          border-radius: 7px; font-family: var(--font-mono);
        }

        .int-counter-row {
          display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;
        }
        .int-counter-text {
          font-family: var(--font-mono); font-size: 12px; font-weight: 700; color: var(--green);
        }
        .clear-btn {
          font-size: 11px; color: rgba(11,23,41,.4); background: none; border: none;
          cursor: pointer; font-family: var(--font-mono); text-decoration: underline;
        }
        .clear-btn:hover { color: var(--green); }
        .int-checkbox-grid {
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 0 32px;
        }
        .int-category { margin-bottom: 20px; }
        .int-cat-label {
          font-family: var(--font-mono); font-size: 10px; font-weight: 700;
          text-transform: uppercase; letter-spacing: .1em; color: rgba(11,23,41,.35);
          margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid rgba(11,23,41,.06);
        }
        .int-checkbox-list { display: flex; flex-direction: column; gap: 2px; }
        .int-checkbox-row {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 10px; border-radius: 7px; cursor: pointer;
          transition: background .12s; user-select: none;
        }
        .int-checkbox-row:hover:not(.disabled) { background: rgba(61,139,61,.05); }
        .int-checkbox-row.disabled { opacity: .35; cursor: not-allowed; }
        .int-checkbox-input {
          width: 16px; height: 16px; border-radius: 4px; flex-shrink: 0;
          accent-color: var(--green); cursor: pointer;
        }
        .int-checkbox-row.disabled .int-checkbox-input { cursor: not-allowed; }
        .int-checkbox-label { font-size: 13px; color: rgba(11,23,41,.75); line-height: 1.3; }
        .int-checkbox-row:not(.disabled):hover .int-checkbox-label { color: var(--navy); }
        @media (max-width: 600px) { .int-checkbox-grid { grid-template-columns: 1fr; } }

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
