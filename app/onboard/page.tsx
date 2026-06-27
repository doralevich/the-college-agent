"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import Nav from "../components/Nav";

const PRIORITIES = [
  "Academic performance",
  "Career / internship search",
  "Staying organized",
  "Time management",
  "Mental health and wellbeing",
  "Social life and balance",
  "Health and fitness",
  "Not sure yet",
];

const HANDLE_FIRST = [
  "Deadline tracking and reminders",
  "Weekly planning briefings",
  "Study scheduling",
  "Email drafting and follow-ups",
  "Internship / job search support",
  "Meeting and class prep",
  "General task management",
];

const RESPONSE_STYLES = [
  "Short and direct: bullet points, no fluff",
  "Detailed: full context and explanation",
  "Motivational: coach me through it",
  "Warm but focused",
  "Depends on the situation",
];

const CHECKIN_FREQ = [
  "Daily morning briefing",
  "Twice a week",
  "Weekly digest only",
  "Only when I ask",
  "Real-time, whenever something comes up",
];

const STEPS = [
  { num: 1, label: "Basics" },
  { num: 2, label: "Priorities" },
  { num: 3, label: "Agent Focus" },
  { num: 4, label: "Response Style" },
  { num: 5, label: "Check-ins" },
  { num: 6, label: "Final Details" },
];

type FD = Record<string, string | string[] | File | null>;

const BLANK: FD = {
  firstName: "",
  lastName: "",
  schoolEmail: "",
  personalEmail: "",
  phone: "",
  school: "",
  topPriority: [],
  agentHandleFirst: [],
  responseStyle: [],
  checkinFrequency: "",
  anythingElse: "",
  resumeFile: null,
};

export default function OnboardPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FD>(BLANK);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: string, v: string) => {
    setError("");
    setForm((f) => ({ ...f, [k]: v }));
  };

  function toggle(k: string, v: string, max?: number) {
    setError("");
    setForm((f) => {
      const arr = (f[k] as string[]) || [];
      if (arr.includes(v)) return { ...f, [k]: arr.filter((x) => x !== v) };
      if (max !== undefined && arr.length >= max) return f;
      return { ...f, [k]: [...arr, v] };
    });
  }

  function isFilled(k: string) {
    const v = form[k];
    if (Array.isArray(v)) return v.length > 0;
    return !!String(v || "").trim();
  }

  function validateStep(currentStep = step) {
    const requiredByStep: Record<number, string[]> = {
      1: ["firstName", "lastName", "schoolEmail", "phone", "school"],
      2: ["topPriority"],
      3: ["agentHandleFirst"],
      4: ["responseStyle"],
      5: ["checkinFrequency"],
    };
    if ((requiredByStep[currentStep] || []).some((k) => !isFilled(k))) {
      setError("Please complete the required fields before continuing.");
      return false;
    }
    setError("");
    return true;
  }

  function next() {
    if (!validateStep()) return;
    setStep((s) => Math.min(s + 1, STEPS.length));
    window.scrollTo(0, 0);
  }
  function back() {
    setError("");
    setStep((s) => Math.max(s - 1, 1));
    window.scrollTo(0, 0);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (![1, 2, 3, 4, 5].every((n) => validateStep(n))) return;
    setLoading(true);
    setError("");
    try {
      const body = new FormData();
      const { resumeFile, ...rest } = form;
      body.append("data", JSON.stringify(rest));
      if (resumeFile instanceof File) body.append("resume", resumeFile);
      const res = await fetch("/api/onboard-submit", { method: "POST", body });
      if (!res.ok) throw new Error();
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
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L19 7" stroke="#3d8b3d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--navy)", marginBottom: 12 }}>You&apos;re all set.</h1>
            <p style={{ fontSize: 16, color: "rgba(11,23,41,.6)", lineHeight: 1.7, marginBottom: 32 }}>
              We have enough to build your first version. Your agent can learn the rest as you use it.
            </p>
            <Link href="/dashboard" className="btn-purple">Back to Dashboard</Link>
          </div>
        </main>
      </>
    );
  }

  const progress = (step / STEPS.length) * 100;
  const s = STEPS[step - 1];

  return (
    <>
      <Nav />
      <main style={{ paddingTop: 80, minHeight: "100vh", background: "var(--cream2)" }}>
        <div style={{ position: "fixed", top: 72, left: 0, right: 0, zIndex: 99, background: "#fff", borderBottom: "1px solid rgba(11,23,41,.07)", padding: "14px 24px" }}>
          <div style={{ maxWidth: 680, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: ".08em", color: "var(--green)", textTransform: "uppercase" }}>
                Step {step} of {STEPS.length}: {s.label}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(11,23,41,.35)" }}>{Math.round(progress)}% complete</span>
            </div>
            <div style={{ height: 4, background: "rgba(11,23,41,.08)", borderRadius: 4 }}>
              <div style={{ height: "100%", width: `${progress}%`, background: "var(--green)", borderRadius: 4, transition: "width .4s ease" }} />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ maxWidth: 680, margin: "0 auto", padding: "60px 24px 80px" }}>
          {step === 1 && (
            <Section title="Let&apos;s start with the basics." sub="Just enough to identify you and set the right context for your agent.">
              <TwoCol>
                <Field label="First Name" required>
                  <input type="text" placeholder="Jane" value={form.firstName as string} onChange={(e) => set("firstName", e.target.value)} required />
                </Field>
                <Field label="Last Name" required>
                  <input type="text" placeholder="Smith" value={form.lastName as string} onChange={(e) => set("lastName", e.target.value)} required />
                </Field>
              </TwoCol>
              <TwoCol>
                <Field label="School Email" required>
                  <input type="email" placeholder="jane@university.edu" value={form.schoolEmail as string} onChange={(e) => set("schoolEmail", e.target.value)} required />
                </Field>
                <Field label="Personal Email">
                  <input type="email" placeholder="jane@gmail.com" value={form.personalEmail as string} onChange={(e) => set("personalEmail", e.target.value)} />
                </Field>
              </TwoCol>
              <Field label="Phone Number" required>
                <input type="tel" placeholder="+1 (___) ___-____" value={form.phone as string} onChange={(e) => set("phone", e.target.value)} required />
              </Field>
              <Field label="School" required>
                <input type="text" placeholder="Enter your school name" value={form.school as string} onChange={(e) => set("school", e.target.value)} required />
              </Field>
            </Section>
          )}

          {step === 2 && (
            <Section title="Your priorities this semester." sub="Pick up to 3 — these set the tone for everything your agent does for you.">
              <Field label="Your priorities this semester (pick up to 3)" required>
                <CheckGrid options={PRIORITIES} selected={form.topPriority as string[]} onToggle={(v) => toggle("topPriority", v, 3)} cols={2} max={3} />
              </Field>
            </Section>
          )}

          {step === 3 && (
            <Section title="What should your agent handle first?" sub="Pick up to 3 — your agent can take on more once it knows you better.">
              <Field label="Where your agent should jump in first (pick up to 3)" required>
                <CheckGrid options={HANDLE_FIRST} selected={form.agentHandleFirst as string[]} onToggle={(v) => toggle("agentHandleFirst", v, 3)} cols={2} max={3} />
              </Field>
            </Section>
          )}

          {step === 4 && (
            <Section title="How do you want your agent to respond?" sub="Pick up to 3 styles — it will mix and match based on context.">
              <Field label="Preferred response styles (pick up to 3)" required>
                <CheckGrid options={RESPONSE_STYLES} selected={form.responseStyle as string[]} onToggle={(v) => toggle("responseStyle", v, 3)} cols={1} max={3} />
              </Field>
            </Section>
          )}

          {step === 5 && (
            <Section title="How often do you want check-ins?" sub="One cadence to start with — you can change it later from your dashboard.">
              <Field label="Check-in cadence" required>
                <RadioGrid options={CHECKIN_FREQ} name="checkinFrequency" selected={form.checkinFrequency as string} onSelect={(v) => set("checkinFrequency", v)} cols={1} />
              </Field>
            </Section>
          )}

          {step === 6 && (
            <Section title="Anything else before we build it?" sub="Optional, but useful if you want the first version to feel more personal.">
              <Field label="Upload your resume (optional, PDF preferred)">
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{ border: "2px dashed rgba(11,23,41,.15)", borderRadius: 8, padding: "24px", textAlign: "center", cursor: "pointer", background: "#fff", transition: "border-color .15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--green)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(11,23,41,.15)")}
                >
                  {form.resumeFile instanceof File ? (
                    <p style={{ fontSize: 14, color: "var(--green)", fontWeight: 600 }}>{form.resumeFile.name}</p>
                  ) : (
                    <>
                      <p style={{ fontSize: 14, color: "rgba(11,23,41,.5)", marginBottom: 4 }}>Click to upload your resume</p>
                      <p style={{ fontSize: 12, color: "rgba(11,23,41,.3)", fontFamily: "var(--font-mono)" }}>PDF, DOC, or DOCX, max 5MB</p>
                    </>
                  )}
                </div>
                <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" style={{ display: "none" }} onChange={(e) => { if (e.target.files?.[0]) setForm((f) => ({ ...f, resumeFile: e.target.files![0] })); }} />
              </Field>
              <Field label="Anything else your agent should know?">
                <textarea rows={4} placeholder="Classes, goals, habits, pressure points, or anything you want your agent to remember from day one." value={form.anythingElse as string} onChange={(e) => set("anythingElse", e.target.value)} />
              </Field>
            </Section>
          )}

          {error && <p style={{ color: "var(--red)", fontSize: 13, marginBottom: 16 }}>{error}</p>}
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            {step > 1 && (
              <button type="button" onClick={back} style={{ flexShrink: 0, padding: "14px 24px", borderRadius: 4, border: "1.5px solid rgba(11,23,41,.15)", background: "transparent", fontSize: 13, fontWeight: 700, fontFamily: "var(--font-mono)", letterSpacing: ".06em", color: "rgba(11,23,41,.6)", cursor: "pointer" }}>
                Back
              </button>
            )}
            {step < STEPS.length ? (
              <button type="button" className="btn-purple" style={{ flex: 1, fontSize: 14 }} onClick={next}>Continue</button>
            ) : (
              <button type="submit" className="btn-purple" style={{ flex: 1, fontSize: 14 }} disabled={loading}>
                {loading ? "Submitting..." : "Submit and Start My Build"}
              </button>
            )}
          </div>
          <p style={{ textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(11,23,41,.35)", marginTop: 20, letterSpacing: ".04em" }}>
            Your information is confidential. We do not sell or share your data.
          </p>
        </form>
      </main>

      <style>{`
        input[type="text"], input[type="email"], input[type="tel"], select, textarea {
          width: 100%; padding: 12px 14px;
          border: 1.5px solid rgba(11,23,41,.12); border-radius: 6px;
          font-size: 15px; font-family: inherit; color: var(--navy);
          background: #fff; outline: none; transition: border-color .15s;
          appearance: none; -webkit-appearance: none;
        }
        select { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%230b1220' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; padding-right: 36px; }
        input:focus, select:focus, textarea:focus { border-color: var(--green); box-shadow: 0 0 0 3px rgba(61,139,61,.08); }
        input::placeholder, textarea::placeholder { color: rgba(11,23,41,.3); }
        textarea { resize: vertical; }
        button:disabled { opacity: .5; cursor: not-allowed; }
        @media (max-width: 640px) {
          .onboard-two-col, .onboard-radio-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}

function Section({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  return (
    <div>
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--navy)", marginBottom: 8, lineHeight: 1.25 }}>{title}</h1>
        <p style={{ fontSize: 15, color: "rgba(11,23,41,.5)", lineHeight: 1.6 }}>{sub}</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>{children}</div>
    </div>
  );
}

function TwoCol({ children }: { children: ReactNode }) {
  return <div className="onboard-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>{children}</div>;
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(11,23,41,.45)", marginBottom: 10 }}>
        {label}{required && <span style={{ color: "var(--green)", marginLeft: 3 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function RadioGrid({ options, name, selected, onSelect, cols = 2 }: {
  options: string[]; name: string; selected: string;
  onSelect: (v: string) => void; cols?: number;
}) {
  return (
    <div className="onboard-radio-grid" style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: "8px 16px" }}>
      {options.map((o) => (
        <label key={o} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "4px 0" }}>
          <input
            type="radio" name={name} value={o} checked={selected === o}
            onChange={() => onSelect(o)} required={!selected}
            style={{ width: 16, height: 16, accentColor: "var(--green)", flexShrink: 0, cursor: "pointer" }}
          />
          <span style={{ fontSize: 14, color: "var(--navy)", lineHeight: 1.4 }}>{o}</span>
        </label>
      ))}
    </div>
  );
}

function CheckGrid({ options, selected, onToggle, cols = 2, max }: {
  options: string[]; selected: string[];
  onToggle: (v: string) => void; cols?: number; max?: number;
}) {
  return (
    <div className="onboard-radio-grid" style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: "8px 16px" }}>
      {options.map((o) => {
        const isChecked = selected.includes(o);
        const atLimit = max !== undefined && selected.length >= max && !isChecked;
        return (
          <label key={o} style={{ display: "flex", alignItems: "center", gap: 10, cursor: atLimit ? "not-allowed" : "pointer", padding: "4px 0", opacity: atLimit ? 0.4 : 1 }}>
            <input
              type="checkbox" checked={isChecked} disabled={atLimit}
              onChange={() => onToggle(o)}
              style={{ width: 16, height: 16, accentColor: "var(--green)", flexShrink: 0, cursor: atLimit ? "not-allowed" : "pointer" }}
            />
            <span style={{ fontSize: 14, color: "var(--navy)", lineHeight: 1.4 }}>{o}</span>
          </label>
        );
      })}
    </div>
  );
}
