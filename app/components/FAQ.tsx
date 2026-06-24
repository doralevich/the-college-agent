"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "What is Hermes?",
    a: "Hermes is the proven student agent framework that powers all College Agent deployments. It is pre-configured with battle-tested student workflows and is designed to be fast to deploy, deeply personal, and built specifically for how students actually live and work.",
  },
  {
    q: "What plans are available?",
    a: "There are three tiers: The Undergraduate ($999), The Graduate ($1,499), and The Scholar ($1,999). All three are built on Hermes and include cloud hosting, web portal access, Telegram access, and Brave Search. The Graduate and Scholar include enhanced onboarding forms, a live onboarding call, and post-launch support.",
  },
  {
    q: "Do all plans come with the same hosting options?",
    a: "Yes. All deployments use Apollo Claw cloud hosting. Basic is $89/month, Pro is $159/month. Hosting is required for all College Agent deployments.",
  },
  {
    q: "What does the co-training period include?",
    a: "The co-training period is included in your setup fee. During this time, we work alongside you and your agent, refining how it responds, adjusting integrations, and making sure it fits the way you actually work and think. It is hands-on, not a tutorial.",
  },
  {
    q: "What happens after the co-training period?",
    a: "You can continue with an optional support plan (6 Months at $750 or Annual at $1,200) or go fully independent with your agent. There is no mandatory ongoing fee after co-training ends, other than your monthly hosting.",
  },
  {
    q: "Can I change my integrations after setup?",
    a: "Yes. Integration changes can be made during the co-training period at no additional charge. After co-training, integration updates are handled through your support plan.",
  },
  {
    q: 'What is a "named persona" and why does it matter?',
    a: "Your agent has a name you choose, and it is trained on your communication style, your tone, your priorities, and your context. It does not sound like a generic chatbot. Over time, it sounds like a version of you — which is the point.",
  },
  {
    q: "Is there a Mac Mini or hardware option?",
    a: "No. The College Agent is cloud-only. This keeps it accessible from anywhere — dorms, libraries, apartments — without requiring hardware you have to carry between locations.",
  },
  {
    q: "Who is this for?",
    a: "Undergrads, graduate students, and pre-professional students who want an AI personal agent that actually knows their life, their schedule, their goals, and their voice — not a generic tool that treats every user the same.",
  },
  {
    q: "Can someone purchase this as a gift?",
    a: "Absolutely. A parent, grandparent, friend, coach, or anyone can purchase a College Agent for their student. The configurator can be completed together or separately. The agent is built for the student.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  const col1 = FAQS.filter((_, i) => i % 2 === 0);
  const col2 = FAQS.filter((_, i) => i % 2 !== 0);

  return (
    <section id="faq" style={{ background: "var(--cream)", padding: "80px 0" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <span className="mono-label">FAQ</span>
          <h2 className="section-title">Frequently Asked Questions</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "start" }}>
          {[col1, col2].map((col, ci) => (
            <div key={ci} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {col.map((faq) => {
                const i = FAQS.indexOf(faq);
                return (
                  <div key={i} className="faq-item">
                    <button
                      className="faq-btn"
                      onClick={() => setOpen(open === i ? null : i)}
                      aria-expanded={open === i}
                    >
                      <span className="faq-q">{faq.q}</span>
                      <span className="faq-icon" style={{ transform: open === i ? "rotate(45deg)" : "none" }}>
                        +
                      </span>
                    </button>
                    {open === i && <div className="faq-answer">{faq.a}</div>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <style>{`
        .faq-item {
          background: #fff; border: 1px solid rgba(11,23,41,.08);
          border-radius: 12px; overflow: hidden;
        }
        .faq-btn {
          width: 100%; display: flex; align-items: center; justify-content: space-between;
          padding: 20px 24px; background: none; border: none; text-align: left; gap: 16px;
          cursor: pointer;
        }
        .faq-q { font-size: 14px; font-weight: 700; color: var(--navy); line-height: 1.4; }
        .faq-icon {
          font-size: 22px; color: var(--green); flex-shrink: 0; font-weight: 300;
          line-height: 1; transition: transform .2s;
        }
        .faq-answer {
          font-size: 13px; line-height: 1.75; color: rgba(11,23,41,.62);
          padding: 0 24px 20px;
        }
        @media (max-width: 768px) {
          .faq-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
