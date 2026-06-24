"use client";

import { useState, useRef, useEffect } from "react";

const CALENDLY = "https://calendly.com/therealdaveo/apolloai";

type Role = "bot" | "user";
interface Message { role: Role; text: string; }

type Step =
  | "who"
  | "school"
  | "challenge"
  | "email"
  | "done";

const BOT_FLOW: Record<Step, string> = {
  who:       "Hi! Are you a student looking for an edge, or a parent investing in your student's future?",
  school:    "Great! What school do you or your student attend?",
  challenge: "What's the biggest thing you're trying to solve: staying on top of coursework, landing internships, managing everything at once?",
  email:     "Got it. What's the best email to reach you? David will personally follow up within 24 hours.",
  done:      "You're all set. David will be in touch soon. Or if you'd rather talk now, book a call below.",
};

const STEP_ORDER: Step[] = ["who", "school", "challenge", "email", "done"];

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [step, setStep] = useState<Step>("who");
  const [input, setInput] = useState("");
  const [lead, setLead] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Start conversation when first opened
  useEffect(() => {
    if (open && messages.length === 0) {
      setTimeout(() => {
        setMessages([{ role: "bot", text: BOT_FLOW.who }]);
      }, 300);
    }
  }, [open, messages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 400);
  }, [open, step]);

  const sendLead = async (data: Record<string, string>) => {
    // POST to Formspree — replace FORM_ID with your actual Formspree endpoint
    try {
      await fetch("https://formspree.io/f/FORM_ID", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          who: data.who,
          school: data.school,
          challenge: data.challenge,
          email: data.email,
          source: "College Agent Chatbot",
        }),
      });
    } catch (_) {
      // silently fail — lead still shows confirmation
    }
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: Message = { role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    const currentStep = step;
    const newLead = { ...lead, [currentStep]: text };
    setLead(newLead);

    const nextIndex = STEP_ORDER.indexOf(currentStep) + 1;
    const nextStep = STEP_ORDER[nextIndex];

    setTimeout(() => {
      if (nextStep === "done") {
        setMessages((prev) => [...prev, { role: "bot", text: BOT_FLOW.done }]);
        setStep("done");
        setSubmitted(true);
        sendLead(newLead);
      } else {
        setMessages((prev) => [...prev, { role: "bot", text: BOT_FLOW[nextStep] }]);
        setStep(nextStep);
      }
    }, 480);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <>
      {/* BUBBLE */}
      <button
        className="chat-bubble"
        onClick={() => setOpen((o) => !o)}
        aria-label="Chat with us"
      >
        {open ? (
          <span style={{ fontSize: 16, lineHeight: 1, fontWeight: 700 }}>✕</span>
        ) : (
          <span className="chat-bubble-label">Ask us anything</span>
        )}
      </button>

      {/* PANEL */}
      {open && (
        <div className="chat-panel">
          <div className="chat-header">
            <div>
              <div className="chat-header-title">The College Agent</div>
              <div className="chat-header-sub">Typically replies in minutes</div>
            </div>
            <button className="chat-close" onClick={() => setOpen(false)}>✕</button>
          </div>

          <div className="chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role}`}>
                {m.role === "bot" && (
                  <div className="chat-avatar">CA</div>
                )}
                <div className="chat-bubble-msg">{m.text}</div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="chat-input-area">
            {step === "done" ? (
              <a
                href={CALENDLY}
                target="_blank"
                rel="noopener noreferrer"
                className="chat-calendly-btn"
              >
                Book a call with David →
              </a>
            ) : (
              <div className="chat-input-row">
                <input
                  ref={inputRef}
                  className="chat-input"
                  type={step === "email" ? "email" : "text"}
                  placeholder={
                    step === "who" ? "Student or Parent..." :
                    step === "school" ? "Your school..." :
                    step === "challenge" ? "Tell us more..." :
                    "your@email.com"
                  }
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                />
                <button className="chat-send" onClick={handleSend} disabled={!input.trim()}>
                  ↑
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .chat-bubble {
          position: fixed; bottom: 28px; right: 28px; z-index: 9999;
          background: var(--green); color: #fff;
          border: none; border-radius: 99px;
          display: flex; align-items: center; gap: 8px;
          padding: 14px 20px; cursor: pointer;
          box-shadow: 0 8px 28px rgba(61,139,61,.35);
          font-family: var(--font-inter, Inter, sans-serif);
          transition: transform .15s, box-shadow .15s;
        }
        .chat-bubble:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(61,139,61,.4); }
        .chat-bubble-label { font-size: 13px; font-weight: 700; letter-spacing: .02em; }

        .chat-panel {
          position: fixed; bottom: 100px; right: 28px; z-index: 9998;
          width: 360px; max-height: 520px;
          background: #fff; border-radius: 16px;
          box-shadow: 0 20px 60px rgba(11,23,41,.18);
          display: flex; flex-direction: column;
          overflow: hidden; border: 1px solid rgba(11,23,41,.08);
          animation: chat-in .2s ease;
        }
        @keyframes chat-in { from { opacity:0; transform: translateY(12px) scale(.97); } to { opacity:1; transform: none; } }

        .chat-header {
          background: var(--navy); color: #fff;
          padding: 18px 20px; display: flex; align-items: center; justify-content: space-between;
          flex-shrink: 0;
        }
        .chat-header-title { font-size: 14px; font-weight: 700; }
        .chat-header-sub { font-size: 11px; color: rgba(255,255,255,.5); margin-top: 2px; font-family: var(--font-mono); }
        .chat-close { background: none; border: none; color: rgba(255,255,255,.5); font-size: 16px; cursor: pointer; padding: 4px; }
        .chat-close:hover { color: #fff; }

        .chat-messages {
          flex: 1; overflow-y: auto; padding: 20px 16px;
          display: flex; flex-direction: column; gap: 12px;
        }
        .chat-msg { display: flex; align-items: flex-end; gap: 8px; }
        .chat-msg.user { flex-direction: row-reverse; }
        .chat-avatar {
          width: 28px; height: 28px; border-radius: 50%; background: var(--green);
          color: #fff; font-size: 10px; font-weight: 700; display: flex;
          align-items: center; justify-content: center; flex-shrink: 0;
          font-family: var(--font-mono);
        }
        .chat-bubble-msg {
          max-width: 78%; font-size: 13px; line-height: 1.55; padding: 10px 14px;
          border-radius: 16px;
        }
        .chat-msg.bot .chat-bubble-msg {
          background: var(--cream2); color: var(--navy);
          border-bottom-left-radius: 4px;
        }
        .chat-msg.user .chat-bubble-msg {
          background: var(--green); color: #fff;
          border-bottom-right-radius: 4px;
        }

        .chat-input-area {
          padding: 12px 16px; border-top: 1px solid rgba(11,23,41,.07); flex-shrink: 0;
        }
        .chat-input-row { display: flex; gap: 8px; }
        .chat-input {
          flex: 1; border: 1.5px solid rgba(11,23,41,.12); border-radius: 8px;
          padding: 10px 12px; font-size: 13px; font-family: inherit;
          outline: none; transition: border-color .15s;
        }
        .chat-input:focus { border-color: var(--green); }
        .chat-send {
          width: 38px; height: 38px; border-radius: 8px;
          background: var(--green); color: #fff; border: none;
          font-size: 18px; display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: filter .15s; flex-shrink: 0;
        }
        .chat-send:hover:not(:disabled) { filter: brightness(1.1); }
        .chat-send:disabled { opacity: .4; cursor: not-allowed; }
        .chat-calendly-btn {
          display: block; width: 100%; text-align: center;
          background: var(--green); color: #fff; font-size: 13px; font-weight: 700;
          padding: 13px; border-radius: 8px; letter-spacing: .04em;
          transition: filter .15s;
        }
        .chat-calendly-btn:hover { filter: brightness(1.1); }

        @media (max-width: 480px) {
          .chat-panel { width: calc(100vw - 32px); right: 16px; bottom: 90px; }
          .chat-bubble { right: 16px; bottom: 20px; }
        }
      `}</style>
    </>
  );
}
