"use client";

import { useState } from "react";

// Footer newsletter form. Matches the dark footer's mono/quiet styling; swaps to a
// one-line confirmation after a successful signup.
export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "sending") return;
    setState("sending");
    setMessage("");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error?.message ?? "Something went wrong. Try again.");
      setState("done");
    } catch (err) {
      setState("error");
      setMessage((err as Error).message);
    }
  }

  if (state === "done") {
    return (
      <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--green)", margin: 0 }}>
        You're in. Watch your inbox.
      </p>
    );
  }

  return (
    <form onSubmit={submit} style={{ margin: 0 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          aria-label="Email address"
          style={{
            flex: "1 1 180px",
            minWidth: 0,
            fontFamily: "var(--font-mono)",
            fontSize: 16,
            color: "#fff",
            background: "rgba(255,255,255,.06)",
            border: "1px solid rgba(255,255,255,.14)",
            borderRadius: 8,
            padding: "9px 12px",
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={state === "sending"}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: ".04em",
            color: "#0B1729",
            background: "var(--green)",
            border: "none",
            borderRadius: 8,
            padding: "9px 16px",
            cursor: state === "sending" ? "progress" : "pointer",
            opacity: state === "sending" ? 0.7 : 1,
          }}
        >
          {state === "sending" ? "Joining..." : "Join"}
        </button>
      </div>
      {state === "error" && (
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#FCA5A5", margin: "8px 0 0" }}>
          {message}
        </p>
      )}
    </form>
  );
}
