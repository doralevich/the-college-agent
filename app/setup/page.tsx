"use client";
import { useState } from "react";
import Nav from "../components/Nav";

interface CredForm {
  telegramToken: string;
  telegramUserId: string;
  anthropicKey: string;
  openaiKey: string;
}

export default function SetupPage() {
  const [form, setForm] = useState<CredForm>({ telegramToken: "", telegramUserId: "", anthropicKey: "", openaiKey: "" });
  const [openSection, setOpenSection] = useState<string | null>("telegram");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof CredForm, v: string) => setForm(f => ({ ...f, [k]: v }));
  const toggle = (key: string) => setOpenSection(o => o === key ? null : key);

  // Everything here is optional (BYO-key): the agent runs on a model included with the plan
  // by default, so a student can connect Telegram, add their own keys, both, or neither.

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--navy)", marginBottom: 12 }}>Setup saved.</h1>
            <p style={{ fontSize: 16, color: "rgba(11,23,41,.6)", lineHeight: 1.7, marginBottom: 32 }}>
              Your technical setup is saved. Head back to your dashboard — once you&apos;ve finished
              onboarding, you can create your agent.
            </p>
            <a href="/dashboard" className="btn-purple">Back to Dashboard</a>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Nav />
      <main style={{ paddingTop: 100, minHeight: "100vh", background: "var(--cream2)" }}>
        <div className="dark-section" style={{ padding: "52px 24px" }}>
          <div style={{ maxWidth: 660, margin: "0 auto" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(255,255,255,.4)" }}>Technical Setup</span>
            <h1 style={{ fontSize: 30, fontWeight: 800, color: "#fff", marginTop: 10, marginBottom: 10 }}>Connect your agent</h1>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,.55)", lineHeight: 1.7 }}>
              Everything here is optional. Your agent runs on a model included with your plan, so you can
              skip it all. Connect Telegram to chat with your agent, and add your own Anthropic or OpenAI
              API key if you&apos;d like to use it.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ maxWidth: 660, margin: "0 auto", padding: "40px 24px 80px" }}>

          {/* 01 — Telegram */}
          <CredBlock num="01" label="Telegram Bot">
            <Instructions
              label="How to create your Telegram bot"
              isOpen={openSection === "telegram"}
              onToggle={() => toggle("telegram")}
            >
              <Step>Open Telegram and search for <strong>@BotFather</strong> — the official blue-check bot.</Step>
              <Step>Start a chat and send the command <Code>/newbot</Code>.</Step>
              <Step>BotFather asks for a <strong>display name</strong> (e.g. <Code>Nova Assistant</Code>) — this is what you see.</Step>
              <Step>Then it asks for a <strong>username</strong> — must end in <Code>bot</Code> (e.g. <Code>NovaAssistant_bot</Code>).</Step>
              <Step>BotFather gives you a <strong>Token</strong> — a long string like <Code>123456789:ABCdef...</Code> — copy it below.</Step>
            </Instructions>
            <CredField label="Telegram Bot Token" hint="Format: 123456789:ABCdef..." optional>
              <input type="password" placeholder="123456789:ABCdef..." value={form.telegramToken} onChange={e => set("telegramToken", e.target.value)} autoComplete="off" />
            </CredField>
          </CredBlock>

          {/* 02 — Telegram user id */}
          <CredBlock num="02" label="Your Telegram User ID">
            <Instructions
              label="How to find your numeric Telegram user id"
              isOpen={openSection === "userid"}
              onToggle={() => toggle("userid")}
            >
              <Step>Open Telegram and search for <strong>@userinfobot</strong>.</Step>
              <Step>Start a chat and press <strong>Start</strong> (or send any message).</Step>
              <Step>It replies with your account info — copy the numeric <strong>Id</strong> (e.g. <Code>123456789</Code>).</Step>
              <Step>This is how Hermes knows it&apos;s really you when you message your bot.</Step>
            </Instructions>
            <CredField label="Telegram User ID" hint="Numbers only, e.g. 123456789" optional>
              <input type="text" inputMode="numeric" placeholder="123456789" value={form.telegramUserId} onChange={e => set("telegramUserId", e.target.value.replace(/[^0-9]/g, ""))} autoComplete="off" />
            </CredField>
          </CredBlock>

          {/* 03 — Anthropic key (optional) */}
          <CredBlock num="03" label="Anthropic API Key">
            <Instructions
              label="How to get an Anthropic API key"
              isOpen={openSection === "anthropic"}
              onToggle={() => toggle("anthropic")}
            >
              <Step>Go to <strong>console.anthropic.com</strong> and sign in (or create an account).</Step>
              <Step>Open <strong>Settings → API Keys</strong> and click <strong>Create Key</strong>.</Step>
              <Step>Copy the key — it starts with <Code>sk-ant-</Code> — and paste it below.</Step>
            </Instructions>
            <CredField label="Anthropic API Key" hint="Optional — starts with sk-ant-" optional>
              <input type="password" placeholder="sk-ant-..." value={form.anthropicKey} onChange={e => set("anthropicKey", e.target.value)} autoComplete="off" />
            </CredField>
          </CredBlock>

          {/* 04 — OpenAI key (optional) */}
          <CredBlock num="04" label="OpenAI API Key">
            <Instructions
              label="How to get an OpenAI API key"
              isOpen={openSection === "openai"}
              onToggle={() => toggle("openai")}
            >
              <Step>Go to <strong>platform.openai.com</strong> and sign in (or create an account).</Step>
              <Step>Open <strong>API keys</strong> and click <strong>Create new secret key</strong>.</Step>
              <Step>Copy the key — it starts with <Code>sk-</Code> — and paste it below.</Step>
            </Instructions>
            <CredField label="OpenAI API Key" hint="Optional — starts with sk-" optional>
              <input type="password" placeholder="sk-..." value={form.openaiKey} onChange={e => set("openaiKey", e.target.value)} autoComplete="off" />
            </CredField>
          </CredBlock>

          {/* Security note */}
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "16px 20px", background: "rgba(61,139,61,.05)", border: "1px solid rgba(61,139,61,.15)", borderRadius: 8, marginBottom: 28 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 2 }}><path d="M8 1.5L2 4v4c0 3.3 2.5 6.4 6 7 3.5-.6 6-3.7 6-7V4L8 1.5z" stroke="#3d8b3d" strokeWidth="1.5" strokeLinejoin="round"/><path d="M5.5 8l2 2 3-3" stroke="#3d8b3d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <p style={{ fontSize: 13, color: "rgba(11,23,41,.55)", lineHeight: 1.6, margin: 0 }}>
              Your credentials are transmitted securely over HTTPS and used solely to configure your agent.
              They are never shared or sold. Questions? <a href="mailto:hello@thecollegeagent.ai" style={{ color: "var(--green)" }}>hello@thecollegeagent.ai</a>
            </p>
          </div>

          {error && <p style={{ color: "var(--red)", fontSize: 13, marginBottom: 16 }}>{error}</p>}

          <button type="submit" className="btn-purple" style={{ width: "100%", fontSize: 14, padding: "16px" }} disabled={loading}>
            {loading ? "Submitting..." : "Save & Continue →"}
          </button>
        </form>
      </main>

      <style>{`
        input[type="text"], input[type="password"], input[type="email"] {
          width: 100%; padding: 12px 14px;
          border: 1.5px solid rgba(11,23,41,.12); border-radius: 6px;
          font-size: 14px; font-family: var(--font-mono); color: var(--navy);
          background: #fff; outline: none; transition: border-color .15s;
        }
        input:focus { border-color: var(--green); box-shadow: 0 0 0 3px rgba(61,139,61,.08); }
        input::placeholder { color: rgba(11,23,41,.3); }
        button:disabled { opacity: .5; cursor: not-allowed; }
      `}</style>
    </>
  );
}

function CredBlock({ num, label, children }: { num: string; label: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: "1px solid rgba(11,23,41,.08)", borderRadius: 12, marginBottom: 16, padding: "28px 28px 28px" }}>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--green)", marginBottom: 20 }}>
        {num} — {label}
      </p>
      {children}
    </div>
  );
}

function Instructions({ label, isOpen, onToggle, children }: { label: string; isOpen: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div style={{ borderRadius: 8, border: "1px solid rgba(11,23,41,.08)", overflow: "hidden", marginBottom: 20 }}>
      <button type="button" onClick={onToggle} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "rgba(11,23,41,.02)", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "rgba(11,23,41,.4)" }}>{isOpen ? "▼" : "▶"}</span>
          {label}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: ".08em", color: "var(--green)", textTransform: "uppercase" }}>{isOpen ? "Hide" : "Show"}</span>
      </button>
      {isOpen && (
        <div style={{ padding: "16px 16px 20px", borderTop: "1px solid rgba(11,23,41,.06)", display: "flex", flexDirection: "column", gap: 8 }}>
          {children}
        </div>
      )}
    </div>
  );
}

function Step({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 13, color: "rgba(11,23,41,.65)", lineHeight: 1.65 }}>{children}</p>;
}

function CredField({ label, hint, required, optional, children }: { label: string; hint?: string; required?: boolean; optional?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(11,23,41,.5)", marginBottom: 4 }}>
        {label}
        {required && <span style={{ color: "var(--green)", marginLeft: 3 }}>*</span>}
        {optional && <span style={{ color: "rgba(11,23,41,.3)", marginLeft: 6, fontWeight: 600 }}>(optional)</span>}
      </label>
      {hint && <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(11,23,41,.35)", marginBottom: 8 }}>{hint}</p>}
      {children}
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return <code style={{ background: "rgba(11,23,41,.06)", padding: "2px 6px", borderRadius: 4, fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--navy)" }}>{children}</code>;
}
