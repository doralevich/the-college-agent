"use client";

import { useEffect, useRef, useState } from "react";

// Entry gate + capped demo chat. The form is framed as "set up your agent," not "give
// us your info." Two consent boxes, neither pre-checked: email and SMS are separate
// (TCPA). When the message cap runs out, the chat ends with the sign-up nudge.

type Msg = { role: "user" | "assistant"; content: string };

const YEARS = Array.from({ length: 9 }, (_, i) => new Date().getFullYear() + i - 1);

export function DemoExperience({ refSlug }: { refSlug: string }) {
  const [step, setStep] = useState<"form" | "chat">("form");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [school, setSchool] = useState("");
  const [gradYear, setGradYear] = useState<string>("");
  const [emailOptIn, setEmailOptIn] = useState(false);
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number>(20);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  async function start(e: React.FormEvent) {
    e.preventDefault();
    if (starting) return;
    setError(null);
    setStarting(true);
    try {
      const res = await fetch("/api/demo/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          phone,
          school,
          gradYear,
          emailOptIn,
          smsOptIn,
          ...(refSlug ? { ref: refSlug } : {}),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error?.message ?? "Couldn't start the demo.");
      setSessionId(body.sessionId as string);
      setRemaining(body.cap as number);
      setMessages([
        {
          role: "assistant",
          content: `Hey! I'm a demo of what YOUR College Agent would be like at ${school.trim()}. Ask me to plan your week, break down a syllabus, quiz you before a test, or draft an email to a professor. What's on your plate?`,
        },
      ]);
      setStep("chat");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setStarting(false);
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || thinking || !sessionId || remaining <= 0) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setThinking(true);
    try {
      const res = await fetch("/api/demo/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, messages: next.slice(1) }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error?.message ?? "Hiccup. Try again?");
      setMessages((prev) => [...prev, { role: "assistant", content: body.reply as string }]);
      setRemaining(body.remaining as number);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: (err as Error).message }]);
    } finally {
      setThinking(false);
    }
  }

  if (step === "form") {
    return (
      <section style={{ maxWidth: 560, margin: "0 auto", padding: "56px 24px 90px" }}>
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/thecollegeagent.png" alt="" style={{ width: 96, height: "auto", marginBottom: 14 }} />
          <span style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--green)", marginBottom: 10 }}>
            Live Demo
          </span>
          <h1 style={{ fontSize: "clamp(26px, 4vw, 36px)", fontWeight: 800, color: "var(--navy)", letterSpacing: "-.02em", marginBottom: 10 }}>
            Let&apos;s set up your agent.
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "rgba(11,23,41,.65)" }}>
            Tell us two things and meet a demo agent that already feels like yours. No account,
            no card, about two minutes.
          </p>
        </div>

        <form onSubmit={start} style={{ background: "#fff", border: "1px solid rgba(11,23,41,.08)", borderRadius: 16, padding: "28px 26px", display: "flex", flexDirection: "column", gap: 14 }}>
          <label className="demo-field">
            <span>School</span>
            <input type="text" value={school} onChange={(e) => setSchool(e.target.value)} placeholder="University of Miami" required />
          </label>
          <label className="demo-field">
            <span>Expected graduation year</span>
            <select value={gradYear} onChange={(e) => setGradYear(e.target.value)} required>
              <option value="">Select...</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </label>
          <label className="demo-field">
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.edu" required />
          </label>
          <label className="demo-field">
            <span>Cell number</span>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" required />
          </label>

          <label className="demo-consent">
            <input type="checkbox" checked={emailOptIn} onChange={(e) => setEmailOptIn(e.target.checked)} />
            <span>Email me tips and updates from The College Agent.</span>
          </label>
          <label className="demo-consent">
            <input type="checkbox" checked={smsOptIn} onChange={(e) => setSmsOptIn(e.target.checked)} />
            <span>
              I agree to receive text messages from The College Agent. Msg &amp; data rates may
              apply. Reply STOP to opt out.
            </span>
          </label>

          {error && <p style={{ color: "#B23636", background: "#FDECEC", borderRadius: 8, padding: "10px 12px", fontSize: 13, margin: 0 }}>{error}</p>}

          <button type="submit" disabled={starting} style={{ height: 52, border: "none", borderRadius: 12, background: "var(--green)", color: "#fff", fontSize: 15.5, fontWeight: 700, cursor: "pointer", opacity: starting ? 0.7 : 1 }}>
            {starting ? "Setting up..." : "Meet my agent"}
          </button>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(11,23,41,.45)", textAlign: "center", margin: 0 }}>
            Demo sessions are temporary and capped. The real thing remembers everything.
          </p>
        </form>

        <style>{`
          .demo-field { display: flex; flex-direction: column; gap: 6px; font-size: 13px; font-weight: 600; color: rgba(11,23,41,.65); }
          .demo-field input, .demo-field select {
            font-size: 16px; padding: 12px 14px; border: 1.5px solid rgba(11,23,41,.12);
            border-radius: 10px; outline: none; background: #fff; color: var(--navy);
          }
          .demo-field input:focus, .demo-field select:focus { border-color: var(--green); }
          .demo-consent { display: flex; align-items: flex-start; gap: 10px; font-size: 12.5px; line-height: 1.55; color: rgba(11,23,41,.6); cursor: pointer; }
          .demo-consent input { width: 16px; height: 16px; margin-top: 2px; accent-color: var(--green); flex: 0 0 auto; }
        `}</style>
      </section>
    );
  }

  const capReached = remaining <= 0;

  return (
    <section style={{ maxWidth: 720, margin: "0 auto", padding: "36px 24px 90px" }}>
      <div style={{ background: "#fff", border: "1px solid rgba(11,23,41,.08)", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column", height: "min(72vh, 680px)" }}>
        <div style={{ background: "var(--navy)", color: "#fff", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Your demo College Agent</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(255,255,255,.55)" }}>{school}</div>
          </div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: remaining <= 5 ? "#FCD34D" : "rgba(255,255,255,.55)" }}>
            {remaining} message{remaining === 1 ? "" : "s"} left
          </span>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div
                style={{
                  maxWidth: "82%", fontSize: 14, lineHeight: 1.6, padding: "10px 14px", borderRadius: 14, whiteSpace: "pre-wrap",
                  background: m.role === "user" ? "var(--green)" : "rgba(11,23,41,.05)",
                  color: m.role === "user" ? "#fff" : "var(--navy)",
                }}
              >
                {m.content}
              </div>
            </div>
          ))}
          {thinking && <div style={{ fontSize: 13, color: "rgba(11,23,41,.45)" }}>Thinking…</div>}
          {capReached && (
            <div style={{ background: "rgba(61,139,61,.08)", border: "1.5px solid var(--green)", borderRadius: 14, padding: "18px 20px", textAlign: "center", marginTop: 6 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: "var(--navy)", marginBottom: 6 }}>
                That&apos;s the end of the demo, and your real agent is just getting started.
              </p>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "rgba(11,23,41,.65)", marginBottom: 14 }}>
                The real one remembers everything, connects to Canvas, Gmail, and your calendar,
                and works for you 24/7. Live within 30 minutes, with a 7-day money-back guarantee.
              </p>
              <a href="/build" style={{ display: "inline-flex", background: "var(--green)", color: "#fff", fontSize: 13, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", padding: "12px 26px", borderRadius: 8, textDecoration: "none" }}>
                Build my real agent
              </a>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div style={{ borderTop: "1px solid rgba(11,23,41,.08)", padding: "12px 14px", display: "flex", gap: 8 }}>
          <input
            type="text"
            value={input}
            disabled={thinking || capReached}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
            placeholder={capReached ? "Demo complete" : "Ask your agent anything..."}
            style={{ flex: 1, fontSize: 16, padding: "12px 14px", border: "1.5px solid rgba(11,23,41,.12)", borderRadius: 10, outline: "none" }}
          />
          <button
            type="button"
            onClick={send}
            disabled={thinking || capReached || !input.trim()}
            style={{ width: 52, border: "none", borderRadius: 10, background: "var(--green)", color: "#fff", fontSize: 18, cursor: "pointer", opacity: thinking || capReached || !input.trim() ? 0.5 : 1 }}
          >
            ↑
          </button>
        </div>
      </div>
    </section>
  );
}
