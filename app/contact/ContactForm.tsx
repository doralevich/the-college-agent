"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";

// The contact form card: name, email, who they are, message. Posts to /api/contact;
// success swaps the form for a thank-you with a Guy so the moment lands warm.

const WHO_OPTIONS = ["Student", "Parent", "Faculty / Administration", "Athletics", "Other"];

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [who, setWho] = useState(WHO_OPTIONS[0]);
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, who, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Couldn't send your message. Try again, or email hello@thecollegeagent.ai.");
      setState("sent");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Couldn't send your message. Try again.");
    }
  };

  if (state === "sent") {
    return (
      <div className="cf-card cf-sent">
        <img src="/avatars/guy-07.webp" alt="" style={{ width: 110, height: "auto" }} />
        <h3>Message sent!</h3>
        <p>
          Thanks, {name.split(" ")[0] || "friend"}. We read everything and reply fast, usually the
          same day. It&apos;ll come from hello@thecollegeagent.ai.
        </p>
        <style>{cardCss}</style>
      </div>
    );
  }

  return (
    <form className="cf-card" onSubmit={submit}>
      <label className="cf-label" htmlFor="cf-name">Your name</label>
      <input id="cf-name" className="cf-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jordan Rivera" required maxLength={120} />

      <label className="cf-label" htmlFor="cf-email">Email</label>
      <input id="cf-email" className="cf-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.edu" required />

      <label className="cf-label" htmlFor="cf-who">I&apos;m a&hellip;</label>
      <select id="cf-who" className="cf-input" value={who} onChange={(e) => setWho(e.target.value)}>
        {WHO_OPTIONS.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>

      <label className="cf-label" htmlFor="cf-msg">How can we help?</label>
      <textarea id="cf-msg" className="cf-input cf-textarea" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell us what's on your mind — questions, ideas, a rollout for your campus, anything." required maxLength={4000} rows={6} />

      {error && <p className="cf-error">{error}</p>}

      <button type="submit" className="cf-btn" disabled={state === "sending"}>
        {state === "sending" ? "Sending…" : "Send Message"}
      </button>
      <style>{cardCss}</style>
    </form>
  );
}

const cardCss = `
  .cf-card {
    background: #fff; border: 1px solid rgba(11,23,41,.08); border-radius: 20px;
    padding: 34px 32px; box-shadow: 0 18px 50px rgba(11,23,41,.08);
    display: flex; flex-direction: column;
  }
  .cf-sent { align-items: center; text-align: center; gap: 6px; padding: 48px 32px; }
  .cf-sent h3 { font-size: 22px; font-weight: 800; color: var(--navy); margin: 14px 0 6px; letter-spacing: -.02em; }
  .cf-sent p { font-size: 14.5px; line-height: 1.7; color: rgba(11,23,41,.65); margin: 0; max-width: 380px; }
  .cf-label {
    font-family: var(--font-mono); font-size: 11px; font-weight: 600;
    text-transform: uppercase; letter-spacing: .08em; color: rgba(11,23,41,.55);
    margin: 0 0 7px;
  }
  .cf-input {
    font: inherit; font-size: 14.5px; color: var(--navy);
    background: #fff; border: 1.5px solid rgba(11,23,41,.14); border-radius: 10px;
    padding: 12px 14px; margin-bottom: 20px; width: 100%;
    transition: border-color .15s, box-shadow .15s;
  }
  .cf-input:focus { outline: none; border-color: var(--green); box-shadow: 0 0 0 3px rgba(61,139,61,.15); }
  .cf-textarea { resize: vertical; min-height: 130px; }
  .cf-error { font-size: 13px; color: #b4232a; margin: -8px 0 14px; }
  .cf-btn {
    display: inline-flex; align-items: center; justify-content: center;
    background: var(--green); color: #fff; font-size: 13px; font-weight: 700;
    letter-spacing: .08em; text-transform: uppercase; padding: 15px 30px;
    border-radius: 4px; box-shadow: 0 8px 24px rgba(61,139,61,.3);
    transition: filter .15s; border: none; cursor: pointer;
  }
  .cf-btn:hover { filter: brightness(1.1); }
  .cf-btn:disabled { opacity: .6; cursor: default; }
`;
