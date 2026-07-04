"use client";

import { useState } from "react";

// Org partner application: name, type, contact, payout handle. Lands as a pending
// orgs row; David activates it and sets the split.

export function OrgApplyForm() {
  const [name, setName] = useState("");
  const [type, setType] = useState("club");
  const [contactEmail, setContactEmail] = useState("");
  const [payoutHandle, setPayoutHandle] = useState("");
  const [notes, setNotes] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "sending") return;
    setError(null);
    setState("sending");
    try {
      const res = await fetch("/api/orgs-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type, contactEmail, payoutHandle, notes }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error?.message ?? "Couldn't submit.");
      setState("done");
    } catch (err) {
      setError((err as Error).message);
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <div style={{ background: "#fff", border: "1.5px solid var(--green)", borderRadius: 16, padding: "32px 28px", textAlign: "center" }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--navy)", marginBottom: 8 }}>Application received!</h2>
        <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "rgba(11,23,41,.65)", margin: 0 }}>
          We&apos;ll review it and reach out at the contact email with your org code and next steps.
          Meanwhile, have your members apply at{" "}
          <a href="/ambassador/apply" style={{ color: "var(--green)", textDecoration: "underline" }}>thecollegeagent.ai/ambassador/apply</a>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ background: "#fff", border: "1px solid rgba(11,23,41,.08)", borderRadius: 16, padding: "28px 26px", display: "flex", flexDirection: "column", gap: 14 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--navy)", margin: 0 }}>Bring your org on board</h2>
      <label className="org-field">
        <span>Organization name</span>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Delta Sigma Pi, Club Soccer, Local Food Bank..." required />
      </label>
      <label className="org-field">
        <span>Type</span>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="club">Club or student org</option>
          <option value="team">Team</option>
          <option value="greek">Greek chapter</option>
          <option value="charity">Charity / cause</option>
        </select>
      </label>
      <label className="org-field">
        <span>Contact email</span>
        <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="treasurer@yourorg.edu" required />
      </label>
      <label className="org-field">
        <span>PayPal for the org (optional, can add later)</span>
        <input type="text" value={payoutHandle} onChange={(e) => setPayoutHandle(e.target.value)} placeholder="org@paypal.com" />
      </label>
      <label className="org-field">
        <span>Anything we should know? (optional)</span>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="How many members, what you're raising for..." />
      </label>
      {error && <p style={{ color: "#B23636", background: "#FDECEC", borderRadius: 8, padding: "10px 12px", fontSize: 13, margin: 0 }}>{error}</p>}
      <button type="submit" disabled={state === "sending"} style={{ height: 50, border: "none", borderRadius: 12, background: "var(--green)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", opacity: state === "sending" ? 0.7 : 1 }}>
        {state === "sending" ? "Submitting..." : "Apply as an org partner"}
      </button>
      <style>{`
        .org-field { display: flex; flex-direction: column; gap: 6px; font-size: 13px; font-weight: 600; color: rgba(11,23,41,.65); }
        .org-field input, .org-field select, .org-field textarea {
          font-size: 15px; padding: 11px 13px; border: 1.5px solid rgba(11,23,41,.12);
          border-radius: 10px; outline: none; background: #fff; color: var(--navy); font-family: inherit;
        }
        .org-field input:focus, .org-field select:focus, .org-field textarea:focus { border-color: var(--green); }
      `}</style>
    </form>
  );
}
