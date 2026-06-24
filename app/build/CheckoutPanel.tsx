"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MIN_PASSWORD } from "@/config/auth";
import { apiFetch } from "@/lib/api";
import { formatUSD } from "@/lib/pricing";
import type { ConfigSummary } from "../components/Configurator";
import type { StudentInfo } from "../components/StudentInfoForm";

// Step-3 gate: account-before-checkout. Auth is email+password with confirmation disabled,
// so signUp returns a session instantly (no inbox round-trip) and we stay on /build with
// the wizard state intact. Once signed in, "Pay" creates a Stripe Checkout Session
// server-side (which persists the order) and redirects to Stripe.
export default function CheckoutPanel({
  studentInfo,
  configSummary,
  integrations,
  dueTodayCents,
  monthlyCents,
}: {
  studentInfo: StudentInfo;
  configSummary: ConfigSummary;
  integrations: string[];
  dueTodayCents: number;
  monthlyCents: number;
}) {
  const [authed, setAuthed] = useState<boolean | null>(null); // null = checking session
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [email, setEmail] = useState(studentInfo.personalEmail || "");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setAuthed(!!data.user))
      .catch(() => setAuthed(false));
  }, []);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const mail = email.trim();
    if (!mail || !password) return;
    const supabase = createClient();
    setBusy(true);

    if (mode === "signup") {
      if (password.length < MIN_PASSWORD) {
        setError(`Password must be at least ${MIN_PASSWORD} characters.`);
        setBusy(false);
        return;
      }
      const { data, error } = await supabase.auth.signUp({ email: mail, password });
      if (error) {
        if (error.code === "user_already_exists") {
          setMode("signin");
          setError("That email already has an account — enter your password to sign in.");
        } else {
          setError(error.message);
        }
        setBusy(false);
        return;
      }
      if (data.session) {
        setAuthed(true);
        setBusy(false);
        return;
      }
      setError("Check your email to confirm your account, then return to finish.");
      setBusy(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email: mail, password });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    setAuthed(true);
    setBusy(false);
  }

  async function startCheckout() {
    setBusy(true);
    setError(null);
    try {
      const { url } = await apiFetch<{ url: string }>("/api/build/checkout", {
        method: "POST",
        body: JSON.stringify({
          selection: {
            plan: configSummary.planKey,
            hosting: configSummary.hostingKey,
            support: configSummary.supportKey,
            onboarding: configSummary.onboardingKey,
          },
          integrations,
          studentInfo,
        }),
      });
      window.location.href = url;
    } catch (e) {
      setError((e as Error).message || "Could not start checkout. Please try again.");
      setBusy(false);
    }
  }

  const totalLine = (
    <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "rgba(11,23,41,.55)", textAlign: "center", marginBottom: 20 }}>
      <strong style={{ color: "var(--navy)" }}>{formatUSD(dueTodayCents)}</strong> due today, then{" "}
      <strong style={{ color: "var(--navy)" }}>{formatUSD(monthlyCents)}/mo</strong> for hosting.
    </p>
  );

  if (authed === null) {
    return (
      <div style={{ textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 12, color: "rgba(11,23,41,.4)" }}>
        Loading checkout…
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 420, margin: "0 auto" }}>
      <style>{`
        .cp-input {
          width: 100%; font-family: inherit; font-size: 14px; padding: 12px 14px;
          border: 1.5px solid rgba(11,23,41,.14); border-radius: 8px; background: #fff;
          color: var(--navy); outline: none; transition: border-color .15s;
        }
        .cp-input:focus { border-color: var(--green); }
        .cp-label {
          font-family: var(--font-mono); font-size: 10px; font-weight: 700;
          text-transform: uppercase; letter-spacing: .1em; color: rgba(11,23,41,.5);
          display: block; margin-bottom: 6px;
        }
        .cp-err { font-size: 12px; color: var(--red, #c0392b); text-align: center; margin-top: 4px; }
      `}</style>

      {totalLine}

      {authed ? (
        <div style={{ textAlign: "center" }}>
          <button
            className="btn-purple"
            onClick={startCheckout}
            disabled={busy}
            style={{ fontSize: 14, padding: "16px 48px", borderRadius: 8, width: "100%", opacity: busy ? 0.6 : 1 }}
          >
            {busy ? "Redirecting to secure checkout…" : "Pay & Activate →"}
          </button>
          <p style={{ marginTop: 14, fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(11,23,41,.35)", letterSpacing: ".04em" }}>
            Secure payment by Stripe. Your agent ships once onboarding is complete.
          </p>
          {error && <p className="cp-err">{error}</p>}
        </div>
      ) : (
        <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(11,23,41,.5)", textAlign: "center", lineHeight: 1.7 }}>
            {mode === "signup" ? "Create your account to continue to payment." : "Sign in to continue to payment."}
          </p>
          <div>
            <label className="cp-label">Email</label>
            <input className="cp-input" type="email" autoComplete="email" value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div>
            <label className="cp-label">Password</label>
            <input className="cp-input" type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "signup" ? `At least ${MIN_PASSWORD} characters` : "Your password"}
              minLength={mode === "signup" ? MIN_PASSWORD : undefined} required />
          </div>
          <button type="submit" className="btn-purple" disabled={busy}
            style={{ fontSize: 14, padding: "15px", borderRadius: 8, width: "100%", opacity: busy ? 0.6 : 1 }}>
            {busy ? "Please wait…" : mode === "signup" ? "Create account & continue →" : "Sign in & continue →"}
          </button>
          {error && <p className="cp-err">{error}</p>}
          <button type="button" onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setError(null); }}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "rgba(11,23,41,.5)", textAlign: "center" }}>
            {mode === "signup" ? "Already have an account? Sign in" : "Need an account? Create one"}
          </button>
        </form>
      )}
    </div>
  );
}
