"use client";

import { useState, useRef, useEffect } from "react";

// The marketing site's "Ask us anything" widget: a real conversation backed by
// /api/ask (Claude with product knowledge), replacing the old fixed question
// script that ignored what visitors typed. A persistent Calendly link keeps the
// talk-to-a-human path one tap away.

const CALENDLY = "https://calendly.com/therealdaveo/the-college-agent-consult";

const GREETING =
  "Hi! Ask me anything about The College Agent: what it does, pricing, how it works, or whether it fits your student. I'll give you a straight answer.";

type Role = "bot" | "user";
interface Message {
  role: Role;
  text: string;
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Greet on first open.
  useEffect(() => {
    if (open && messages.length === 0) {
      setTimeout(() => {
        setMessages([{ role: "bot", text: GREETING }]);
      }, 300);
    }
  }, [open, messages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 400);
  }, [open, thinking]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || thinking) return;

    const nextMessages: Message[] = [...messages, { role: "user", text }];
    setMessages(nextMessages);
    setInput("");
    setThinking(true);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Greeting stays client-side; the API sees alternating user/assistant turns.
          messages: nextMessages
            .filter((m, i) => !(i === 0 && m.role === "bot"))
            .map((m) => ({ role: m.role === "bot" ? "assistant" : "user", content: m.text })),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.reply) {
        throw new Error(body?.error?.message ?? "hiccup");
      }
      setMessages((prev) => [...prev, { role: "bot", text: body.reply as string }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "Hmm, I hit a snag on that one. Try again in a moment, or book a call with David using the link below.",
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <>
      {/* BUBBLE */}
      <button
        className={`chat-bubble${open ? " is-open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-label="Chat with us"
      >
        {open ? (
          <span style={{ fontSize: 16, lineHeight: 1, fontWeight: 700 }}>✕</span>
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/thecollegeagent.png" alt="" className="chat-bubble-bot" />
            <span className="chat-bubble-label">Help Me</span>
          </>
        )}
      </button>

      {/* PANEL */}
      {open && (
        <div className="chat-panel">
          <div className="chat-header">
            <div>
              <div className="chat-header-title">The College Agent</div>
              <div className="chat-header-sub">Replies in seconds</div>
            </div>
            <button className="chat-close" onClick={() => setOpen(false)}>✕</button>
          </div>

          <div className="chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role}`}>
                {m.role === "bot" && <div className="chat-avatar">CA</div>}
                <div className="chat-bubble-msg">{m.text}</div>
              </div>
            ))}
            {thinking && (
              <div className="chat-msg bot">
                <div className="chat-avatar">CA</div>
                <div className="chat-bubble-msg chat-typing" aria-label="Typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="chat-input-area">
            <div className="chat-input-row">
              <input
                ref={inputRef}
                className="chat-input"
                type="text"
                placeholder="Type your question..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                disabled={thinking}
              />
              <button className="chat-send" onClick={handleSend} disabled={!input.trim() || thinking}>
                ↑
              </button>
            </div>
            <a
              href={CALENDLY}
              target="_blank"
              rel="noopener noreferrer"
              className="chat-human-link"
            >
              Prefer a human? Book a call with David
            </a>
          </div>
        </div>
      )}

      <style>{`
        .chat-bubble {
          position: fixed; bottom: 28px; right: 28px; z-index: 9999;
          background: var(--green); color: #fff;
          border: none; border-radius: 99px;
          display: flex; align-items: center; gap: 8px;
          padding: 10px 18px 10px 12px; cursor: pointer;
          box-shadow: 0 8px 28px rgba(61,139,61,.35);
          font-family: var(--font-inter, Inter, sans-serif);
          transition: transform .15s, box-shadow .15s;
        }
        .chat-bubble:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(61,139,61,.4); }
        .chat-bubble-label { font-size: 13px; font-weight: 700; letter-spacing: .02em; }
        .chat-bubble-bot { width: 26px; height: 26px; object-fit: contain; display: block; }
        .chat-bubble.is-open { padding: 14px 16px; }

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
          min-height: 220px;
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
          border-radius: 16px; white-space: pre-wrap;
        }
        .chat-msg.bot .chat-bubble-msg {
          background: var(--cream2); color: var(--navy);
          border-bottom-left-radius: 4px;
        }
        .chat-msg.user .chat-bubble-msg {
          background: var(--green); color: #fff;
          border-bottom-right-radius: 4px;
        }

        .chat-typing { display: flex; gap: 4px; align-items: center; }
        .chat-typing span {
          width: 6px; height: 6px; border-radius: 50%; background: rgba(11,23,41,.4);
          animation: chat-dot 1.2s infinite ease-in-out;
        }
        .chat-typing span:nth-child(2) { animation-delay: .15s; }
        .chat-typing span:nth-child(3) { animation-delay: .3s; }
        @keyframes chat-dot { 0%, 60%, 100% { transform: translateY(0); opacity: .5; } 30% { transform: translateY(-4px); opacity: 1; } }

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
        .chat-input:disabled { opacity: .6; }
        .chat-send {
          width: 38px; height: 38px; border-radius: 8px;
          background: var(--green); color: #fff; border: none;
          font-size: 18px; display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: filter .15s; flex-shrink: 0;
        }
        .chat-send:hover:not(:disabled) { filter: brightness(1.1); }
        .chat-send:disabled { opacity: .4; cursor: not-allowed; }
        .chat-human-link {
          display: block; text-align: center; margin-top: 8px;
          font-size: 11px; color: rgba(11,23,41,.45); text-decoration: underline;
          font-family: var(--font-mono); letter-spacing: .02em;
        }
        .chat-human-link:hover { color: var(--green); }

        @media (max-width: 480px) {
          .chat-panel { width: calc(100vw - 32px); right: 16px; bottom: 90px; }
          .chat-bubble { right: 16px; bottom: 20px; }
        }
      `}</style>
    </>
  );
}
