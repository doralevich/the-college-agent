"use client";

import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";

const GRAD_YEARS = ["2026", "2027", "2028", "2029", "2030", "2031+"];

const INVOLVEMENTS = [
  "Student Organization Leader",
  "Greek Life",
  "Athletics",
  "Club Member",
  "Resident Assistant",
  "Student Government",
  "Other",
];

const SOCIALS: { key: keyof Pick<AmbassadorFormState, "instagram" | "linkedin" | "facebook">;
  label: string; placeholder: string;
}[] = [
  { key: "instagram", label: "Instagram", placeholder: "@handle" },
  { key: "linkedin",  label: "LinkedIn",  placeholder: "linkedin.com/in/..." },
  { key: "facebook",  label: "Facebook",  placeholder: "facebook.com/..." },
];

type AmbassadorFormState = {
  // Personal Information
  fullName: string;
  university: string;
  graduationYear: string;
  otherInvolvement: string;
  major: string;
  email: string;
  mobile: string;

  // About You
  whyInterested: string;
  whyAI: string;
  whyGreat: string;

  // Your Network
  involvements: string[];

  // Social handles
  instagram: string;
  linkedin: string;
  facebook: string;

  // Tell us more
  anythingElse: string;

  // Agreements (all required)
  agreeIndependent: boolean;
  agreeCommissions: boolean;
  agreeProfessional: boolean;
};

const EMPTY_FORM: AmbassadorFormState = {
  fullName: "", university: "", graduationYear: "", major: "", email: "", mobile: "",
  whyInterested: "", whyAI: "", whyGreat: "",
  involvements: [],
  otherInvolvement: "",
  instagram: "", linkedin: "", facebook: "",
  anythingElse: "",
  agreeIndependent: false, agreeCommissions: false, agreeProfessional: false,
};

export default function AmbassadorForm() {
  const [form, setForm] = useState<AmbassadorFormState>(EMPTY_FORM);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  function setField<K extends keyof AmbassadorFormState>(key: K, value: AmbassadorFormState[K]) {
    setError("");
    setStatus("idle");
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleInvolvement(item: string) {
    const next = form.involvements.includes(item)
      ? form.involvements.filter((x) => x !== item)
      : [...form.involvements, item];
    setField("involvements", next);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.agreeIndependent || !form.agreeCommissions || !form.agreeProfessional) {
      setError("Please confirm all three agreements before submitting.");
      return;
    }

    setStatus("loading");
    setError("");

    try {
      const res = await fetch("/api/ambassador-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Submission failed");
      }

      (window as typeof window & { gtag?: (type: string, event: string, params: Record<string, string>) => void })
        .gtag?.("event", "ambassador_request_submit", {
        event_category: "lead",
        event_label: "affiliate_page",
      });

      setStatus("success");
      setForm(EMPTY_FORM);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="ambassador-success" role="status">
        <div className="success-mark">✓</div>
        <h2>Application received.</h2>
        <p>
          We will review your application and reach out with next steps if the Ambassador program is a match.
        </p>
      </div>
    );
  }

  return (
    <form className="ambassador-form" onSubmit={handleSubmit}>
      <SectionHeader>Personal Information</SectionHeader>

      <div className="form-grid two">
        <label>
          <span>Full Name *</span>
          <input
            required type="text" value={form.fullName}
            onChange={(e) => setField("fullName", e.target.value)}
            placeholder="Jane Smith"
          />
        </label>
        <label>
          <span>University *</span>
          <input
            required type="text" value={form.university}
            onChange={(e) => setField("university", e.target.value)}
            placeholder="Tulane University"
          />
        </label>
      </div>

      <div className="form-grid two">
        <label>
          <span>Graduation Year *</span>
          <select required value={form.graduationYear} onChange={(e) => setField("graduationYear", e.target.value)}>
            <option value="">Select year...</option>
            {GRAD_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
        <label>
          <span>Major *</span>
          <input
            required type="text" value={form.major}
            onChange={(e) => setField("major", e.target.value)}
            placeholder="e.g. Marketing, Pre-Med, Computer Science"
          />
        </label>
      </div>

      <div className="form-grid two">
        <label>
          <span>Email Address *</span>
          <input
            required type="email" value={form.email}
            onChange={(e) => setField("email", e.target.value)}
            placeholder="jane@school.edu"
          />
        </label>
        <label>
          <span>Mobile Number *</span>
          <input
            required type="tel" value={form.mobile}
            onChange={(e) => setField("mobile", e.target.value)}
            placeholder="(917) 555-0123"
          />
        </label>
      </div>

      <SectionHeader>About You</SectionHeader>

      <label>
        <span>Why are you interested in becoming a College Agent Ambassador? *</span>
        <textarea required rows={4} value={form.whyInterested}
          onChange={(e) => setField("whyInterested", e.target.value)}
          placeholder="Share what drew you to the program."
        />
      </label>

      <label>
        <span>What interests you most about AI and emerging technology? *</span>
        <textarea required rows={4} value={form.whyAI}
          onChange={(e) => setField("whyAI", e.target.value)}
          placeholder="Tell us where AI shows up in your life or what you'd build with it."
        />
      </label>

      <label>
        <span>Why would you be a great College Agent Ambassador? *</span>
        <textarea required rows={4} value={form.whyGreat}
          onChange={(e) => setField("whyGreat", e.target.value)}
          placeholder="Your network, your communication style, why students would trust your recommendation."
        />
      </label>

      <SectionHeader>Your Network</SectionHeader>

      <fieldset>
        <legend>What campus organizations, clubs, athletics, Greek life, or activities are you involved in?</legend>
        <div className="channel-grid">
          {INVOLVEMENTS.map((item) => (
            <label key={item} className="channel-option">
              <input
                type="checkbox"
                checked={form.involvements.includes(item)}
                onChange={() => toggleInvolvement(item)}
              />
              <span>{item}</span>
            </label>
          ))}
        </div>
        {form.involvements.includes("Other") && (
          <input
            type="text"
            value={form.otherInvolvement}
            onChange={(e) => setField("otherInvolvement", e.target.value)}
            placeholder="Please describe your involvement"
            style={{ marginTop: 10, width: "100%" }}
          />
        )}
      </fieldset>

      <fieldset>
        <legend>Social Media Platforms</legend>
        <div className="form-grid two">
          {SOCIALS.map(({ key, label, placeholder }) => (
            <label key={key}>
              <span>{label}</span>
              <input
                type="text" value={form[key]}
                onChange={(e) => setField(key, e.target.value)}
                placeholder={placeholder}
              />
            </label>
          ))}
        </div>
      </fieldset>

      <SectionHeader>Tell Us More</SectionHeader>

      <label>
        <span>Is there anything else you&apos;d like us to know? (optional)</span>
        <textarea rows={4} value={form.anythingElse}
          onChange={(e) => setField("anythingElse", e.target.value)}
          placeholder="Anything that didn't fit above."
        />
      </label>

      <SectionHeader>Agreement</SectionHeader>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: -4 }}>
        <AgreeCheckbox
          checked={form.agreeIndependent}
          onChange={(v) => setField("agreeIndependent", v)}
          label="I understand this is an independent ambassador opportunity."
        />
        <AgreeCheckbox
          checked={form.agreeCommissions}
          onChange={(v) => setField("agreeCommissions", v)}
          label="I understand commissions are earned for qualified purchases made through my personalized referral link."
        />
        <AgreeCheckbox
          checked={form.agreeProfessional}
          onChange={(v) => setField("agreeProfessional", v)}
          label="I agree to represent College Agent professionally."
        />
      </div>

      {error && <p className="form-error">{error}</p>}

      <button type="submit" className="btn-purple ambassador-submit" disabled={status === "loading"}>
        <Send size={16} strokeWidth={2.2} />
        {status === "loading" ? "Submitting..." : "Submit Application"}
      </button>
    </form>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{
      fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700,
      letterSpacing: ".12em", textTransform: "uppercase", color: "var(--green)",
      marginTop: 12, marginBottom: 4, paddingTop: 16,
      borderTop: "1px solid rgba(11,23,41,.1)",
    }}>
      {children}
    </h3>
  );
}

function AgreeCheckbox({ checked, onChange, label }: {
  checked: boolean; onChange: (v: boolean) => void; label: string;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 10, cursor: "pointer", padding: "6px 0" }}>
      <input
        type="checkbox" checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: 16, height: 16, minWidth: 16, accentColor: "var(--green)", flexShrink: 0, margin: 0, cursor: "pointer" }}
      />
      <span style={{ fontSize: 14, color: "var(--navy)", lineHeight: 1.5, fontFamily: "inherit", fontWeight: 400, letterSpacing: 0, textTransform: "none" }}>{label}</span>
    </label>
  );
}
