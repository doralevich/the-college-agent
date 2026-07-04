"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "What is The College Agent?",
    a: "Your own personal AI agent, built around your classes, your calendar, and your life. It is personalized from a short intake (your school, classes, goals, and how you like to work), runs 24/7 in the cloud, and is reachable from your dashboard and on Telegram.",
  },
  {
    q: "What does it cost?",
    a: "One plan, everything included: $249.99 one-time to build and configure your agent, plus cloud hosting at $25/month or $250/year (the annual price is ten months, so two months are free). Every new account starts with $20 of AI usage credits.",
  },
  {
    q: "Is there a refund policy?",
    a: "Yes. There is a 7-day money-back guarantee: if The College Agent is not for you, tell us within 7 days of purchase and we refund your platform fee and first hosting payment in full. The details are in our Terms & Conditions.",
  },
  {
    q: "How fast is my agent live?",
    a: "The intake takes about five minutes: name your agent, give it a face, add your classes. Once it is submitted, your agent is provisioned automatically and fully live within 30 minutes.",
  },
  {
    q: "What can it actually do?",
    a: "Turn syllabi into tracked deadlines, build study plans and quiz you before tests, draft emails to professors in your voice, watch your calendar and inbox, plan travel, remember birthdays, manage your budget, and run your internship pipeline. It takes action in the tools you already use.",
  },
  {
    q: "What tools does it connect to?",
    a: "Canvas, Blackbaud, Google Classroom, Gmail, Google Calendar, Outlook, Microsoft Teams, Google Drive, Dropbox, Notion, Todoist, LinkedIn, and thousands more through the Integrations tab in your dashboard.",
  },
  {
    q: "Do I need my own AI account?",
    a: "No. Your plan includes $20 of AI usage credits, and you can top up from your dashboard ($10, $25, or $50) with low-balance alerts and optional auto-recharge. Advanced users can bring their own Anthropic or OpenAI API key instead.",
  },
  {
    q: 'What is a "named persona" and why does it matter?',
    a: "Your agent has a name and face you choose, and it is trained on your communication style, your tone, your priorities, and your context. It does not sound like a generic chatbot. Over time, it sounds like a version of you, which is the point.",
  },
  {
    q: "Who is this for?",
    a: "High schoolers getting ready for college, undergrads, graduate students, and pre-professional students who want an AI agent that actually knows their life, their schedule, their goals, and their voice, not a generic tool that treats every user the same.",
  },
  {
    q: "Can someone purchase this as a gift?",
    a: "Absolutely. A parent, grandparent, friend, coach, or anyone can purchase a College Agent for their student. The student completes the intake themselves, so the agent is built for them.",
  },
  {
    q: "Can I pause hosting over the summer?",
    a: "Yes. Hosting can be canceled or paused any time from your dashboard, and your files stay yours: you can download everything whenever you want.",
  },
  {
    q: "Is there hardware to buy?",
    a: "No. The College Agent is cloud-only. It works from any device (dorm, library, phone) and can be added to your home screen like an app.",
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
        {/* className is what the mobile media rule below targets — the grid collapses to one
            column under 768px (the !important outranks this inline declaration). */}
        <div className="faq-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "start" }}>
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
