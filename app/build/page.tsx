"use client";
import { useState } from "react";
import BuildNav from "../components/BuildNav";
import Configurator, { ConfigSummary } from "../components/Configurator";
import StudentInfoForm, { StudentInfo } from "../components/StudentInfoForm";
import CheckoutPanel from "./CheckoutPanel";
import { dueToday, monthlyRecurring, formatUSD } from "@/lib/pricing";

export default function BuildPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [configSummary, setConfigSummary] = useState<ConfigSummary | null>(null);

  function handleInfoComplete(info: StudentInfo) {
    setStudentInfo(info);
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
    fetch("/api/lead-capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(info),
    }).catch(() => {});
  }

  function handleConfigComplete(summary: ConfigSummary) {
    setConfigSummary(summary);
    setStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
    // The order-summary email now fires from the Stripe webhook on successful payment
    // (lib/email/order-summary.ts), not here — so we only notify on real, paid orders.
  }

  const steps = [
    { n: 1, label: "About You" },
    { n: 2, label: "Build Your Agent" },
    { n: 3, label: "Checkout" },
  ];

  // Authoritative amounts come from lib/pricing via the selection keys (not the
  // Configurator's display strings) — the same source the server charges from.
  const selection = configSummary
    ? {
        plan: configSummary.planKey,
        hosting: configSummary.hostingKey,
        support: configSummary.supportKey,
        onboarding: configSummary.onboardingKey,
      }
    : null;
  const dueTodayCents = selection ? dueToday(selection) : 0;
  const monthlyCents = selection ? monthlyRecurring(selection) : 0;

  return (
    <>
      <BuildNav />

      <main style={{ paddingTop: 72 }}>

        {/* Step indicator */}
        <section style={{ background: "var(--cream2)", padding: "48px 24px 36px", textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: 28 }}>
            {steps.map((s, i) => (
              <div key={s.n} style={{ display: "flex", alignItems: "center" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                    background: step >= s.n ? "var(--green)" : "rgba(11,23,41,.1)",
                    color: step >= s.n ? "#fff" : "rgba(11,23,41,.35)",
                    fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700,
                    transition: "background .3s",
                  }}>
                    {step > s.n ? "✓" : s.n}
                  </div>
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 600,
                    textTransform: "uppercase", letterSpacing: ".08em",
                    color: step >= s.n ? "var(--green)" : "rgba(11,23,41,.3)",
                    whiteSpace: "nowrap",
                  }}>
                    {s.label}
                  </span>
                </div>
                {i < 2 && (
                  <div style={{
                    width: 80, height: 1, margin: "0 8px", marginBottom: 24,
                    background: step > s.n ? "var(--green)" : "rgba(11,23,41,.1)",
                    transition: "background .3s",
                  }} />
                )}
              </div>
            ))}
          </div>

          {step === 1 && <>
            <h1 style={{ fontSize: "clamp(26px, 3.5vw, 40px)", fontWeight: 800, letterSpacing: "-.02em", color: "var(--navy)", marginBottom: 12 }}>
              Tell us about yourself
            </h1>
            <p style={{ fontSize: 15, color: "rgba(11,23,41,.55)", maxWidth: 460, margin: "0 auto" }}>
              This helps us personalize your agent from day one.
            </p>
          </>}
          {step === 2 && <>
            <h1 style={{ fontSize: "clamp(26px, 3.5vw, 40px)", fontWeight: 800, letterSpacing: "-.02em", color: "var(--navy)", marginBottom: 12 }}>
              Build Your Agent
            </h1>
            <p style={{ fontSize: 15, color: "rgba(11,23,41,.55)", maxWidth: 460, margin: "0 auto" }}>
              Choose your framework, hosting, and support plan.
            </p>
          </>}
          {step === 3 && <>
            <h1 style={{ fontSize: "clamp(26px, 3.5vw, 40px)", fontWeight: 800, letterSpacing: "-.02em", color: "var(--navy)", marginBottom: 12 }}>
              Review &amp; Checkout
            </h1>
            <p style={{ fontSize: 15, color: "rgba(11,23,41,.55)", maxWidth: 460, margin: "0 auto" }}>
              Confirm your order and book your setup call.
            </p>
          </>}
        </section>

        {/* Step 1 */}
        {step === 1 && (
          <section style={{ background: "#fff", padding: "56px 24px 80px" }}>
            <div style={{ maxWidth: 620, margin: "0 auto" }}>
              <StudentInfoForm onComplete={handleInfoComplete} />
            </div>
          </section>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <>
            {studentInfo && (
              <div style={{
                background: "rgba(61,139,61,.06)", borderBottom: "1px solid rgba(61,139,61,.15)",
                padding: "12px 24px", textAlign: "center",
              }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--green)", letterSpacing: ".04em" }}>
                  Building for {studentInfo.firstName} {studentInfo.lastName} · {studentInfo.school} · {studentInfo.year}
                </span>
              </div>
            )}
            <Configurator onComplete={handleConfigComplete} />
          </>
        )}

        {/* Step 3 — Checkout */}
        {step === 3 && configSummary && studentInfo && (
          <section style={{ background: "#fff", padding: "60px 24px 100px" }}>
            <div style={{ maxWidth: 660, margin: "0 auto" }}>

              {/* Order Review Card */}
              <div style={{ border: "1.5px solid rgba(11,23,41,.1)", borderRadius: 14, overflow: "hidden", marginBottom: 40 }}>
                <div style={{ background: "var(--navy)", padding: "20px 28px" }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(255,255,255,.4)", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 4 }}>Order Summary</p>
                  <p style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>{studentInfo.firstName} {studentInfo.lastName}</p>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(255,255,255,.45)", marginTop: 2 }}>{studentInfo.school} · {studentInfo.year}</p>
                </div>

                <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 0 }}>
                  {[
                    { label: "Implementation", value: configSummary.impl },
                    { label: "Setup Fee", value: `$${configSummary.setupFee.toLocaleString()} (one-time)` },
                    { label: "Hosting", value: `${configSummary.hosting}: $${configSummary.hostingFee}/mo` },
                    { label: "Support Plan", value: `${configSummary.support} (${configSummary.supportPrice})` },
                    { label: "Co-Training", value: "30-day hands-on (included)" },
                    { label: "Deployment", value: "72 hours from signed agreement" },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "13px 0", borderBottom: "1px solid rgba(11,23,41,.06)", gap: 16 }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(11,23,41,.45)", textTransform: "uppercase", letterSpacing: ".06em", whiteSpace: "nowrap" }}>{label}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)", textAlign: "right" }}>{value}</span>
                    </div>
                  ))}
                </div>

                <div style={{ background: "var(--cream)", padding: "18px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: ".06em" }}>Total Due Today</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 800, color: "var(--green)" }}>{formatUSD(dueTodayCents)}</span>
                </div>
              </div>

              <CheckoutPanel
                studentInfo={studentInfo}
                configSummary={configSummary}
                dueTodayCents={dueTodayCents}
                monthlyCents={monthlyCents}
              />
            </div>
          </section>
        )}

      </main>

      <footer className="dark-section" style={{ borderTop: "1px solid rgba(255,255,255,.06)", padding: "32px 24px", textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(255,255,255,.25)", letterSpacing: ".04em" }}>
          &copy; 2025 The College Agent. All rights reserved. &nbsp;&middot;&nbsp; thecollegeagent.ai
        </p>
      </footer>
    </>
  );
}
