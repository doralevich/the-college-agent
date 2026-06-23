"use client";
import { useState } from "react";
import Nav from "../components/Nav";

const YEARS = ["Freshman (1st Year)", "Sophomore (2nd Year)", "Junior (3rd Year)", "Senior (4th Year)", "Graduate Student", "Other"];

const SCHOOL_SUGGESTIONS = [
  "University of Michigan", "Northwestern University", "Indiana University",
  "Ohio State University", "University of Georgia", "University of Maryland",
  "Tulane University", "UNC Chapel Hill", "University of Miami",
  "University of Florida", "Washington University in St. Louis",
  "Columbia University", "Syracuse University", "UCLA", "Harvard University",
  "Yale University", "Princeton University", "Stanford University",
  "University of Pennsylvania", "Duke University", "Georgetown University",
  "New York University", "Boston University", "Northeastern University",
  "University of Southern California", "University of Texas at Austin",
  "University of Virginia", "University of Wisconsin-Madison",
  "Penn State University", "Purdue University", "Michigan State University",
  "University of Illinois Urbana-Champaign", "University of Minnesota",
  "Arizona State University", "University of Arizona", "University of Colorado Boulder",
  "Florida State University", "University of North Carolina", "Wake Forest University",
  "Emory University", "Vanderbilt University", "Rice University",
  "Carnegie Mellon University", "Georgia Tech", "University of Notre Dame",
];

export default function OnboardPage() {
  const [form, setForm] = useState({
    firstName: "", lastName: "", schoolEmail: "", personalEmail: "",
    phone: "", school: "", schoolOther: "", year: "", major: "", agentName: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const isComplete =
    form.firstName && form.lastName && form.schoolEmail &&
    form.phone && form.school && form.year && form.major;


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isComplete) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/onboard-submit", {
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
          <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 24px", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(61,139,61,.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L19 7" stroke="#3d8b3d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--navy)", marginBottom: 12 }}>
              You&apos;re in the queue.
            </h1>
            <p style={{ fontSize: 16, color: "rgba(11,23,41,.6)", lineHeight: 1.7, marginBottom: 32 }}>
              We received your information. Next up: your full onboarding form, where we&apos;ll learn everything we need to build your agent. You&apos;ll receive a link within 24 hours.
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
        <div className="dark-section" style={{ padding: "60px 24px" }}>
          <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(255,255,255,.4)" }}>
              Get Started
            </span>
            <h1 style={{ fontSize: 36, fontWeight: 800, color: "#fff", marginTop: 12, marginBottom: 16, lineHeight: 1.2 }}>
              Let&apos;s Build Your Agent.
            </h1>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,.6)", lineHeight: 1.7 }}>
              Before we build your AI agent, we need to know who you are. Takes about 3 minutes. The more detail, the better your agent.
            </p>
          </div>
        </div>

        {/* Form */}
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "48px 24px 80px" }}>
          <div style={{ background: "#fff", border: "1px solid rgba(11,23,41,.08)", borderRadius: 16, padding: "40px 40px" }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(11,23,41,.35)", marginBottom: 32 }}>
              Start here — Tell us about yourself so we can personalize your experience.
            </p>

            <form onSubmit={handleSubmit}>
              {/* Name */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <Field label="First Name" required>
                  <input type="text" placeholder="Jane" value={form.firstName} onChange={e => set("firstName", e.target.value)} required />
                </Field>
                <Field label="Last Name" required>
                  <input type="text" placeholder="Smith" value={form.lastName} onChange={e => set("lastName", e.target.value)} required />
                </Field>
              </div>

              {/* Emails */}
              <Field label="School Email" required style={{ marginBottom: 16 }}>
                <input type="email" placeholder="jane@university.edu" value={form.schoolEmail} onChange={e => set("schoolEmail", e.target.value)} required />
              </Field>
              <Field label="Personal Email" style={{ marginBottom: 16 }}>
                <input type="email" placeholder="jane@gmail.com" value={form.personalEmail} onChange={e => set("personalEmail", e.target.value)} />
              </Field>

              {/* Phone */}
              <Field label="Phone Number" required style={{ marginBottom: 20 }}>
                <input type="tel" placeholder="+1 (___) ___-____" value={form.phone} onChange={e => set("phone", e.target.value)} required />
              </Field>

              {/* School */}
              <Field label="School" required style={{ marginBottom: 20 }}>
                <input
                  type="text"
                  list="school-suggestions"
                  placeholder="Start typing your school name..."
                  value={form.school}
                  onChange={e => set("school", e.target.value)}
                  required
                />
                <datalist id="school-suggestions">
                  {SCHOOL_SUGGESTIONS.map(s => <option key={s} value={s} />)}
                </datalist>
              </Field>

              {/* Year & Major */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <Field label="Year" required>
                  <select value={form.year} onChange={e => set("year", e.target.value)} required>
                    <option value="">Select year...</option>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </Field>
                <Field label="Major / Field of Study" required>
                  <input type="text" placeholder="e.g. Business, Pre-Med" value={form.major} onChange={e => set("major", e.target.value)} required />
                </Field>
              </div>

              {/* Agent Name */}
              <Field label="What would you like to name your agent?" style={{ marginBottom: 32 }}>
                <input type="text" placeholder="e.g. Nova, Atlas, Sage" value={form.agentName} onChange={e => set("agentName", e.target.value)} />
              </Field>

              {error && (
                <p style={{ color: "var(--red)", fontSize: 13, marginBottom: 16 }}>{error}</p>
              )}

              <button type="submit" className="btn-purple" style={{ width: "100%", fontSize: 14 }} disabled={!isComplete || loading}>
                {loading ? "Submitting..." : "Continue →"}
              </button>

              <p style={{ textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(11,23,41,.35)", marginTop: 20, letterSpacing: ".04em" }}>
                Your information is confidential. We do not sell or share your data.
              </p>
            </form>
          </div>
        </div>
      </main>

      <style>{`
        input, select, textarea {
          width: 100%; padding: 12px 14px;
          border: 1.5px solid rgba(11,23,41,.12);
          border-radius: 6px; font-size: 14px;
          font-family: inherit; color: var(--navy);
          background: #fff; outline: none;
          transition: border-color .15s;
          appearance: none; -webkit-appearance: none;
        }
        select { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%230b1220' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; padding-right: 36px; }
        input:focus, select:focus, textarea:focus { border-color: var(--green); }
        input::placeholder { color: rgba(11,23,41,.3); }
        button:disabled { opacity: .5; cursor: not-allowed; }
        @media (max-width: 560px) {
          .form-grid-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}

function Field({ label, required, children, style }: { label: string; required?: boolean; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={style}>
      <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(11,23,41,.5)", marginBottom: 6 }}>
        {label}{required && <span style={{ color: "var(--green)", marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}
