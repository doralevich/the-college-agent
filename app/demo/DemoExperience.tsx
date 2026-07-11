"use client";

import { useEffect, useRef, useState } from "react";
import { pickMascot } from "@/lib/mascots";
import { trackMetaCustom } from "@/app/components/MetaPixel";

// Entry gate + capped demo chat. The form is framed as "set up your agent," not "give
// us your info." Two consent boxes, neither pre-checked: email and SMS are separate
// (TCPA). When the message cap runs out, the chat ends with the sign-up nudge.

type Msg = { role: "user" | "assistant"; content: string };
type School = { id: number; name: string; city: string; state: string };

const YEARS = Array.from({ length: 9 }, (_, i) => new Date().getFullYear() + i - 1);

// School typeahead — same /api/schools (College Scorecard) proxy the onboarding uses.
// Selecting a result stores its name; a school we don't return can still be typed free-hand.
function DemoSchoolField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [results, setResults] = useState<School[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/schools?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (!cancelled) setResults(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [value]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={boxRef} style={{ position: "relative" }}>
      <input
        type="text"
        value={value}
        placeholder="Start typing your school..."
        required
        autoComplete="off"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {open && value.trim().length >= 2 && (results.length > 0 || loading) && (
        <div className="demo-school-menu">
          {loading && results.length === 0 ? (
            <div className="demo-school-loading">Searching…</div>
          ) : (
            results.map((r) => (
              <button
                key={r.id}
                type="button"
                className="demo-school-opt"
                onClick={() => {
                  onChange(r.name);
                  setOpen(false);
                }}
              >
                <span style={{ fontWeight: 600 }}>{r.name}</span>
                {(r.city || r.state) && (
                  <span className="demo-school-loc"> · {[r.city, r.state].filter(Boolean).join(", ")}</span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function DemoExperience({ refSlug }: { refSlug: string }) {
  const [step, setStep] = useState<"form" | "chat">("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [school, setSchool] = useState("");
  const [gradYear, setGradYear] = useState<string>("");
  const [emailOptIn, setEmailOptIn] = useState(false);
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number>(10);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  // The chat transcript's own scroll container — new messages scroll THIS, never the page.
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Fire a Meta "Demo" event once when the demo opens. Every Demo button (nav, footer,
  // homepage, ad links) routes here, so this one spot captures them all. No-op until the
  // Pixel ID is set, so it ships safely and only starts counting once Meta is live.
  useEffect(() => {
    trackMetaCustom("Demo");
  }, []);

  // Land at the top of the page whenever the demo opens (some entry points scroll-restore
  // to wherever the visitor last was).
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    // Keep the newest message in view by scrolling the transcript box itself.
    // scrollIntoView would scroll every ancestor including the page, which made the
    // whole page jump to the bottom on each reply.
    if (messages.length === 0) return;
    const el = scrollerRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  // "David Chen" -> "David"; used to personalize the greeting.
  const firstName = name.trim().split(/\s+/)[0] || "";
  const agentTitle = name.trim() ? `${name.trim()}'s College Agent` : "Your College Agent";

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
          name: name.trim(),
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
          content: `Hey${firstName ? ` ${firstName}` : ""}! I'm a demo of what YOUR College Agent would be like at ${school.trim()}.\n\nAsk me to plan your week, break down a syllabus, quiz you before a test, or draft an email to a professor. What's on your plate?`,
        },
      ]);
      setStep("chat");
      window.scrollTo(0, 0);
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
      <>
        {/* Hero: header text left, agent right, same navy treatment as every other page. */}
        <section className="demo-hero">
          <div className="demo-hero-inner">
            <div className="demo-hero-text">
              <span className="demo-eyebrow">Live Demo</span>
              <h1>Let&apos;s set up your agent.</h1>
              <p>
                Tell us a few things and meet a demo agent that already feels like yours. No
                account, no card, about two minutes.
              </p>
            </div>
            <div className="demo-hero-bot">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pickMascot("demo")} alt="The College Agent" />
            </div>
          </div>
        </section>

        <section className="demo-form-wrap">
          <form onSubmit={start} className="demo-form">
            <label className="demo-field">
              <span>Your name</span>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="David Chen" autoComplete="name" required />
            </label>
            <label className="demo-field">
              <span>School</span>
              <DemoSchoolField value={school} onChange={setSchool} />
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
              <span>Your school email</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.edu" autoComplete="email" required />
            </label>
            <label className="demo-field">
              <span>Cell number</span>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" autoComplete="tel" required />
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

            {error && <p className="demo-error">{error}</p>}

            <button type="submit" disabled={starting} className="demo-submit">
              {starting ? "Setting up..." : "Meet Your Agent!"}
            </button>
            <p className="demo-fineprint">
              Demo sessions are temporary and capped. The real thing remembers everything.
            </p>
          </form>
        </section>

        <style>{`
          .demo-hero { background: var(--navy, #0b1729); }
          .demo-hero-inner {
            max-width: 1000px; margin: 0 auto; padding: 40px 24px 44px;
            display: flex; align-items: center; justify-content: space-between; gap: 20px;
          }
          .demo-hero-text { flex: 1 1 460px; min-width: 0; }
          .demo-eyebrow {
            display: block; font-family: var(--font-mono); font-size: 11px; font-weight: 700;
            letter-spacing: .14em; text-transform: uppercase; color: var(--green); margin-bottom: 12px;
          }
          .demo-hero-text h1 {
            font-size: clamp(28px, 4vw, 44px); font-weight: 800; line-height: 1.05;
            letter-spacing: -.025em; color: #fff; margin: 0 0 14px;
          }
          .demo-hero-text p {
            font-size: 16px; line-height: 1.7; color: rgba(255,255,255,.65); margin: 0; max-width: 480px;
          }
          .demo-hero-bot { flex: 0 0 180px; display: flex; justify-content: flex-start; }
          .demo-hero-bot img {
            width: 100%; max-width: 200px; height: auto;
            filter: drop-shadow(0 18px 36px rgba(0,0,0,.35));
          }
          @media (max-width: 640px) {
            .demo-hero-inner { flex-direction: column-reverse; text-align: center; gap: 18px; padding: 28px 24px 32px; }
            .demo-hero-text p { margin-left: auto; margin-right: auto; }
            .demo-hero-bot { flex-basis: auto; }
            .demo-hero-bot img { max-width: 128px; }
          }

          .demo-form-wrap { max-width: 560px; margin: 0 auto; padding: 40px 24px 90px; }
          .demo-form {
            background: #fff; border: 1px solid rgba(11,23,41,.08); border-radius: 16px;
            padding: 28px 26px; display: flex; flex-direction: column; gap: 14px;
          }
          .demo-field { display: flex; flex-direction: column; gap: 6px; font-size: 13px; font-weight: 600; color: rgba(11,23,41,.65); }
          .demo-field input, .demo-field select {
            width: 100%; font-size: 16px; padding: 12px 14px; border: 1.5px solid rgba(11,23,41,.12);
            border-radius: 10px; outline: none; background: #fff; color: var(--navy); font-family: inherit;
          }
          .demo-field input:focus, .demo-field select:focus { border-color: var(--green); }
          .demo-school-menu {
            position: absolute; top: calc(100% + 6px); left: 0; right: 0; z-index: 20;
            background: #fff; border: 1.5px solid rgba(11,23,41,.12); border-radius: 10px;
            box-shadow: 0 12px 30px -12px rgba(11,23,41,.25); max-height: 260px; overflow-y: auto;
          }
          .demo-school-loading { padding: 12px 14px; font-size: 14px; color: rgba(11,23,41,.5); }
          .demo-school-opt {
            display: block; width: 100%; text-align: left; border: none; background: transparent;
            padding: 11px 14px; cursor: pointer; font-size: 15px; color: var(--navy);
            border-bottom: 1px solid rgba(11,23,41,.05); font-family: inherit;
          }
          .demo-school-opt:hover { background: rgba(61,139,61,.08); }
          .demo-school-loc { color: rgba(11,23,41,.5); font-size: 13px; }
          .demo-consent { display: flex; align-items: flex-start; gap: 10px; font-size: 12.5px; line-height: 1.55; color: rgba(11,23,41,.6); cursor: pointer; }
          .demo-consent input { width: 16px; height: 16px; margin-top: 2px; accent-color: var(--green); flex: 0 0 auto; }
          .demo-error { color: #B23636; background: #FDECEC; border-radius: 8px; padding: 10px 12px; font-size: 13px; margin: 0; }
          .demo-submit {
            height: 52px; border: none; border-radius: 12px; background: var(--green); color: #fff;
            font-size: 15.5px; font-weight: 700; cursor: pointer;
          }
          .demo-submit:disabled { opacity: .7; cursor: progress; }
          .demo-fineprint { font-family: var(--font-mono); font-size: 11px; color: rgba(11,23,41,.45); text-align: center; margin: 0; }
        `}</style>
      </>
    );
  }

  const capReached = remaining <= 0;

  return (
    <section style={{ maxWidth: 720, margin: "0 auto", padding: "36px 24px 90px" }}>
      <div style={{ background: "#fff", border: "1px solid rgba(11,23,41,.08)", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column", height: "min(72vh, 680px)" }}>
        <div style={{ background: "var(--green)", color: "#fff", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{agentTitle}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(255,255,255,.75)" }}>{school}</div>
          </div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: remaining <= 5 ? "#FCD34D" : "rgba(255,255,255,.75)" }}>
            {remaining} message{remaining === 1 ? "" : "s"} left
          </span>
        </div>

        <div ref={scrollerRef} style={{ flex: 1, overflowY: "auto", padding: "20px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
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
