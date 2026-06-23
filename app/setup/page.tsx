"use client";
import { useState } from "react";
import Nav from "../components/Nav";

interface CredForm {
  anthropicKey: string;
  openaiKey: string;
  telegramToken: string;
  telegramUsername: string;
}

type OpenSection = string | null;

export default function SetupPage() {
  const [form, setForm] = useState<CredForm>({
    anthropicKey: "", openaiKey: "", telegramToken: "", telegramUsername: "",
  });
  const [open, setOpen] = useState<OpenSection>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof CredForm, v: string) => setForm(f => ({ ...f, [k]: v }));
  const toggle = (key: string) => setOpen(o => o === key ? null : key);

  const isComplete = form.anthropicKey && form.openaiKey && form.telegramToken && form.telegramUsername;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isComplete) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/setup-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Submission failed");
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <>
        <Nav />
        <main style={{ paddingTop: 120, minHeight: "100vh", background: "var(--cream2)" }}>
          <div style={{ maxWidth: 520, margin: "0 auto", padding: "0 24px", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(61,139,61,.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L19 7" stroke="#3d8b3d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--navy)", marginBottom: 12 }}>Setup complete.</h1>
            <p style={{ fontSize: 16, color: "rgba(11,23,41,.6)", lineHeight: 1.7, marginBottom: 32 }}>
              Your credentials have been received. Your agent will be deployed within 24 hours. Check your email for a confirmation.
            </p>
            <a href="/" className="btn-purple">Back to Home</a>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Nav />
      <main style={{ paddingTop: 100, minHeight: "100vh", background: "var(--cream2)" }}>
        {/* Header */}
        <div className="dark-section" style={{ padding: "52px 24px" }}>
          <div style={{ maxWidth: 660, margin: "0 auto" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(255,255,255,.4)" }}>
              Technical Setup
            </span>
            <h1 style={{ fontSize: 30, fontWeight: 800, color: "#fff", marginTop: 10, marginBottom: 10 }}>
              Your API Credentials
            </h1>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,.55)", lineHeight: 1.7 }}>
              These keys connect your AI agent to the services it needs. Each section below walks you through exactly where to find them.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ maxWidth: 660, margin: "0 auto", padding: "40px 24px 80px" }}>

          {/* 01 — Anthropic */}
          <CredBlock
            num="01"
            label="Anthropic API Key"
            required
            isOpen={open === "anthropic"}
            onToggle={() => toggle("anthropic")}
            instructions={
              <>
                <p>Go to <strong>console.anthropic.com</strong> and sign in (or create an account).</p>
                <p>Click your name in the top right → <strong>API Keys</strong>.</p>
                <p>Click <strong>Create Key</strong>, give it a name (e.g. <Code>My AI Assistant</Code>), and copy the key immediately — it won&apos;t be shown again.</p>
                <p>The key starts with <Code>sk-ant-api03-...</Code> — paste it below.</p>
                <p>You&apos;ll need to add a payment method and purchase credits. We recommend starting with $20–$50.</p>
              </>
            }
          >
            <CredField label="Anthropic API Key" hint="Starts with sk-ant-..." required>
              <input
                type="password"
                placeholder="sk-ant-api03-..."
                value={form.anthropicKey}
                onChange={e => set("anthropicKey", e.target.value)}
                required
                autoComplete="off"
              />
            </CredField>
          </CredBlock>

          {/* 02 — OpenAI */}
          <CredBlock
            num="02"
            label="OpenAI API Key"
            required
            isOpen={open === "openai"}
            onToggle={() => toggle("openai")}
            instructions={
              <>
                <p>Go to <strong>platform.openai.com</strong> and sign in (or create an account).</p>
                <p>Click your name in the top right → <strong>API Keys</strong>.</p>
                <p>Click <strong>Create new secret key</strong>, give it a name (e.g. <Code>My Agent</Code>), and copy it immediately — it won&apos;t be shown again.</p>
                <p>The key starts with <Code>sk-proj-...</Code> or <Code>sk-...</Code> — paste it below.</p>
                <p>You&apos;ll need to add a payment method. We recommend starting with $10–$20 in credits.</p>
              </>
            }
          >
            <CredField label="OpenAI API Key" hint="Starts with sk-proj-... or sk-..." required>
              <input
                type="password"
                placeholder="sk-proj-..."
                value={form.openaiKey}
                onChange={e => set("openaiKey", e.target.value)}
                required
                autoComplete="off"
              />
            </CredField>
          </CredBlock>

          {/* 03 — Telegram */}
          <CredBlock
            num="03"
            label="Telegram Bot"
            required
            isOpen={open === "telegram"}
            onToggle={() => toggle("telegram")}
            instructions={
              <>
                <p>Open Telegram and search for <strong>@BotFather</strong> — the official blue-check bot.</p>
                <p>Start a chat and send the command <Code>/newbot</Code>.</p>
                <p>BotFather asks for a <strong>display name</strong> (e.g. <Code>Nova Assistant</Code>) — this is what you see.</p>
                <p>Then it asks for a <strong>username</strong> — must end in <Code>bot</Code> (e.g. <Code>NovaAssistant_bot</Code>).</p>
                <p>BotFather gives you a <strong>Token</strong> — a long string like <Code>123456789:ABCdef...</Code> — copy it.</p>
                <p>Paste both the Token and the Username (@) into the fields below.</p>
              </>
            }
          >
            <CredField label="Telegram Bot Token" hint="Format: 123456789:ABCdef..." required>
              <input
                type="password"
                placeholder="123456789:ABCdef..."
                value={form.telegramToken}
                onChange={e => set("telegramToken", e.target.value)}
                required
                autoComplete="off"
              />
            </CredField>
            <CredField label="Telegram Bot Username" hint="Starts with @ and ends in bot (e.g. @NovaAssistant_bot)" required>
              <input
                type="text"
                placeholder="@YourBotName_bot"
                value={form.telegramUsername}
                onChange={e => set("telegramUsername", e.target.value)}
                required
                autoComplete="off"
              />
            </CredField>
          </CredBlock>

          {/* Security note */}
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "16px 20px", background: "rgba(61,139,61,.05)", border: "1px solid rgba(61,139,61,.15)", borderRadius: 8, marginBottom: 28 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 2 }}><path d="M8 1.5L2 4v4c0 3.3 2.5 6.4 6 7 3.5-.6 6-3.7 6-7V4L8 1.5z" stroke="#3d8b3d" strokeWidth="1.5" strokeLinejoin="round"/><path d="M5.5 8l2 2 3-3" stroke="#3d8b3d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <p style={{ fontSize: 13, color: "rgba(11,23,41,.55)", lineHeight: 1.6, margin: 0 }}>
              Your credentials are transmitted securely over HTTPS and used solely to configure your deployment. They are never shared, sold, or stored beyond setup. Questions? <a href="mailto:hello@thecollegeagent.ai" style={{ color: "var(--green)" }}>hello@thecollegeagent.ai</a>
            </p>
          </div>

          {error && <p style={{ color: "var(--red)", fontSize: 13, marginBottom: 16 }}>{error}</p>}

          <button
            type="submit"
            className="btn-purple"
            style={{ width: "100%", fontSize: 14, padding: "16px" }}
            disabled={!isComplete || loading}
          >
            {loading ? "Submitting..." : "Complete My Setup →"}
          </button>
        </form>
      </main>

      <style>{`
        input[type="text"], input[type="password"], input[type="email"] {
          width: 100%; padding: 12px 14px;
          border: 1.5px solid rgba(11,23,41,.12);
          border-radius: 6px; font-size: 14px;
          font-family: var(--font-mono); color: var(--navy);
          background: #fff; outline: none;
          transition: border-color .15s;
        }
        input:focus { border-color: var(--green); box-shadow: 0 0 0 3px rgba(61,139,61,.08); }
        input::placeholder { color: rgba(11,23,41,.3); font-family: var(--font-mono); }
        button:disabled { opacity: .5; cursor: not-allowed; }
      `}</style>
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CredBlock({ num, label, required, isOpen, onToggle, instructions, children }: {
  num: string; label: string; required?: boolean;
  isOpen: boolean; onToggle: () => void;
  instructions: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div style={{ background: "#fff", border: "1px solid rgba(11,23,41,.08)", borderRadius: 12, marginBottom: 16, overflow: "hidden" }}>
      <div style={{ padding: "24px 28px 0" }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--green)", marginBottom: 6 }}>
          {num} — {label}{required && <span style={{ color: "rgba(11,23,41,.3)", marginLeft: 6 }}>Required</span>}
        </p>
      </div>

      {/* Expandable instructions */}
      <div style={{ margin: "12px 28px 0", borderRadius: 8, border: "1px solid rgba(11,23,41,.08)", overflow: "hidden" }}>
        <button
          type="button"
          onClick={onToggle}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 16px", background: "rgba(11,23,41,.02)", border: "none",
            cursor: "pointer", fontFamily: "inherit",
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "rgba(11,23,41,.4)" }}>{isOpen ? "▼" : "▶"}</span>
            How to get your {label}
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: ".08em", color: "var(--green)", textTransform: "uppercase" }}>
            {isOpen ? "Hide" : "Show"}
          </span>
        </button>
        {isOpen && (
          <div style={{ padding: "16px 16px 20px", borderTop: "1px solid rgba(11,23,41,.06)", display: "flex", flexDirection: "column", gap: 10 }}>
            {instructions}
          </div>
        )}
      </div>

      <div style={{ padding: "20px 28px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
        {children}
      </div>
    </div>
  );
}

function CredField({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(11,23,41,.5)", marginBottom: 4 }}>
        {label}{required && <span style={{ color: "var(--green)", marginLeft: 3 }}>*</span>}
      </label>
      {hint && <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(11,23,41,.35)", marginBottom: 8 }}>{hint}</p>}
      {children}
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code style={{ background: "rgba(11,23,41,.06)", padding: "2px 6px", borderRadius: 4, fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--navy)" }}>
      {children}
    </code>
  );
}
