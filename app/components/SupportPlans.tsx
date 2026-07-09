const PLANS = [
  {
    name: "Maintenance",
    price: "$199",
    hours: "Token optimization only",
    featured: false,
    features: [
      { label: "Token optimization + drift correction", included: true },
      { label: "Async Q&A via Telegram", included: false },
      { label: "System health monitoring", included: false },
      { label: "Priority Telegram response", included: false },
      { label: "Hands-on workflow optimization", included: false },
      { label: "Agent updates + retraining", included: false },
      { label: "Monthly performance review", included: false },
    ],
  },
  {
    name: "Monitor",
    price: "$495",
    hours: "3 hours / month",
    featured: false,
    features: [
      { label: "Token optimization + drift correction", included: true },
      { label: "Async Q&A via Telegram", included: true },
      { label: "System health monitoring", included: true },
      { label: "Priority Telegram response", included: false },
      { label: "Hands-on workflow optimization", included: false },
      { label: "Agent updates + retraining", included: false },
      { label: "Monthly performance review", included: false },
    ],
  },
  {
    name: "Build",
    price: "$795",
    hours: "5 hours / month",
    featured: true,
    features: [
      { label: "Token optimization + drift correction", included: true },
      { label: "Async Q&A via Telegram", included: true },
      { label: "System health monitoring", included: true },
      { label: "Priority Telegram response", included: true },
      { label: "Hands-on workflow optimization", included: true },
      { label: "Agent updates + retraining", included: true },
      { label: "Monthly review (30-min strategy session)", included: true },
    ],
  },
  {
    name: "Command",
    price: "$1,195",
    hours: "8 hours / month",
    featured: false,
    features: [
      { label: "Token optimization + drift correction", included: true },
      { label: "Async Q&A via Telegram", included: true },
      { label: "System health monitoring", included: true },
      { label: "Priority Telegram response", included: true },
      { label: "Hands-on workflow optimization", included: true },
      { label: "Agent updates + retraining", included: true },
      { label: "Monthly review (60-min strategy session)", included: true },
      { label: "Active implementation support", included: true },
      { label: "Phase 2+ module builds", included: true },
    ],
  },
];

export default function SupportPlans() {
  return (
    <section id="support" style={{ background: "#fff", padding: "80px 0" }}>
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <span className="mono-label">Ongoing Support</span>
          <h2 className="section-title">After Co-Training, Your Call</h2>
        </div>
        <p
          style={{
            textAlign: "center",
            fontFamily: "var(--font-mono)",
            fontSize: 14,
            lineHeight: 1.75,
            color: "rgba(11,23,41,.55)",
            maxWidth: 600,
            margin: "0 auto 48px",
          }}
        >
          After your 30-day co-training, you can choose to continue with a support plan, or go
          independent. Your call.
        </p>
        <div className="support-grid">
          {PLANS.map((plan) => (
            <div key={plan.name} className={`support-card ${plan.featured ? "featured" : ""}`}>
              <div className="support-name">{plan.name}</div>
              <div className="support-price">
                {plan.price}
                <span className="support-price-unit">/mo</span>
              </div>
              <div className="support-hours">{plan.hours}</div>
              <ul className="support-features">
                {plan.features.map((f) => (
                  <li key={f.label}>
                    <span className={f.included ? "feat-check" : "feat-x"}>
                      {f.included ? "✓" : "✗"}
                    </span>
                    {f.label}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p
          style={{
            textAlign: "center",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "rgba(11,23,41,.35)",
            marginTop: 32,
            lineHeight: 1.7,
          }}
        >
          All plans require a 2-month minimum commitment. Unused hours do not roll over. Plans
          begin after the 30-day co-training period concludes.
        </p>
      </div>
      <style>{`
        .support-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        .support-card {
          background: var(--cream2); border: 1.5px solid rgba(11,23,41,.08);
          border-radius: 12px; padding: 24px; display: flex; flex-direction: column;
        }
        .support-card.featured { border-color: var(--green); background: rgba(61,139,61,.04); }
        .support-name { font-size: 14px; font-weight: 700; color: var(--navy); margin-bottom: 4px; }
        .support-price {
          font-family: var(--font-mono); font-size: 22px; font-weight: 700;
          color: var(--green); margin-bottom: 2px;
        }
        .support-price-unit { font-size: 13px; font-weight: 500; color: rgba(11,23,41,.4); }
        .support-hours {
          font-family: var(--font-mono); font-size: 10px; color: rgba(11,23,41,.35);
          margin-bottom: 16px; text-transform: uppercase; letter-spacing: .06em;
        }
        .support-features {
          list-style: none; display: flex; flex-direction: column; gap: 8px; flex: 1;
        }
        .support-features li {
          font-size: 12px; line-height: 1.4; display: flex; align-items: flex-start;
          gap: 7px; color: rgba(11,23,41,.6);
        }
        .feat-check { font-size: 11px; font-weight: 700; color: var(--green); flex-shrink: 0; margin-top: 1px; }
        .feat-x { font-size: 11px; font-weight: 700; color: rgba(11,23,41,.2); flex-shrink: 0; margin-top: 1px; }
        @media (max-width: 900px) { .support-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 560px) { .support-grid { grid-template-columns: 1fr; } }
      `}</style>
    </section>
  );
}
