"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "What is the difference between Hermes and OpenClaw?",
    a: "Hermes is a pre-configured student agent base, it is faster to deploy and uses a proven starting framework built specifically for student workflows. OpenClaw is a fully custom build from the ground up. Both result in a named, persona-driven agent. The main difference is depth of customization and how the agent is initially structured.",
  },
  {
    q: "Do both plans come with the same hosting options?",
    a: "Yes. Both Hermes and OpenClaw deployments use Apollo Cloud VPS hosting. Basic is $89/month, Pro is $159/month. Hosting is required for all Student Agent deployments.",
  },
  {
    q: "What does the 30-day co-training period include?",
    a: "It is included in your setup fee. During the 30 days, we work alongside you and your agent, refining how it responds, adjusting integrations, and making sure it actually fits how you work and think. It is hands-on, not a tutorial.",
  },
  {
    q: "Can I change my integrations after setup?",
    a: "Yes. Integration changes can be made during the co-training period at no additional charge. After co-training, integration updates are handled through your support plan.",
  },
  {
    q: 'What is a "named persona" and why does it matter?',
    a: "Your agent has a name you choose, and it is trained on your communication style, your tone, your priorities, and your context. It does not sound like a generic chatbot. Over time, it sounds like a version of you, which is the point.",
  },
  {
    q: "Is there a Mac Mini option for the Student Agent?",
    a: "No. The Student Agent is cloud-only. This keeps it accessible from anywhere, dorms, libraries, apartments, without requiring hardware you have to move between locations.",
  },
  {
    q: "What happens after the 30-day co-training period?",
    a: "You can continue with a support plan (Maintenance, Monitor, Build, or Command) or go fully independent with your agent. There is no mandatory ongoing fee after the co-training period ends, unless you choose a support plan.",
  },
  {
    q: "Who is this for?",
    a: "Undergrads, graduate students, and pre-professional students who want an AI personal agent that actually knows their life, their schedule, their goals, their voice, not a generic tool that treats every user the same.",
  },
  {
    q: "Can a parent purchase this for their student?",
    a: "Yes. Many of our clients are purchased as gifts. The student and parent go through the configurator together or separately. The agent is built for the student.",
  },
  {
    q: "What is a custom implementation?",
    a: "If your needs fall outside the standard Hermes or OpenClaw frameworks, unusual integrations, specialized workflows, or enterprise requirements, we can scope a custom build. Contact us to discuss.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" style={{ background: "var(--cream)", padding: "80px 0" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <span className="mono-label">FAQ</span>
          <h2 className="section-title">Frequently Asked Questions</h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 740, margin: "0 auto" }}>
          {FAQS.map((faq, i) => (
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
      `}</style>
    </section>
  );
}
