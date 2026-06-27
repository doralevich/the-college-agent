"use client";

import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";

const YEAR_OPTIONS = [
  "Freshman",
  "Sophomore",
  "Junior",
  "Senior",
  "Graduate student",
  "Parent",
  "Other",
];

const CHANNEL_OPTIONS = [
  "TikTok",
  "Instagram",
  "LinkedIn",
  "Campus clubs",
  "Greek life",
  "Athletics",
  "Residence life",
  "Parent network",
  "Other",
];

type AmbassadorFormState = {
  fullName: string;
  email: string;
  phone: string;
  school: string;
  year: string;
  channels: string[];
  audienceSize: string;
  why: string;
  referralPlan: string;
};

const EMPTY_FORM: AmbassadorFormState = {
  fullName: "",
  email: "",
  phone: "",
  school: "",
  year: "",
  channels: [],
  audienceSize: "",
  why: "",
  referralPlan: "",
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

  function toggleChannel(channel: string) {
    const next = form.channels.includes(channel)
      ? form.channels.filter((item) => item !== channel)
      : [...form.channels, channel];
    setField("channels", next);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
        <h2>Request received.</h2>
        <p>
          We will review your campus fit and reach out with next steps if the Ambassador program is a match.
        </p>
      </div>
    );
  }

  return (
    <form className="ambassador-form" onSubmit={handleSubmit}>
      <div className="form-grid two">
        <label>
          <span>Full name *</span>
          <input
            required
            type="text"
            value={form.fullName}
            onChange={(event) => setField("fullName", event.target.value)}
            placeholder="Jane Smith"
          />
        </label>
        <label>
          <span>Email *</span>
          <input
            required
            type="email"
            value={form.email}
            onChange={(event) => setField("email", event.target.value)}
            placeholder="jane@school.edu"
          />
        </label>
      </div>

      <div className="form-grid two">
        <label>
          <span>Phone</span>
          <input
            type="tel"
            value={form.phone}
            onChange={(event) => setField("phone", event.target.value)}
            placeholder="(917) 555-0123"
          />
        </label>
        <label>
          <span>School or network *</span>
          <input
            required
            type="text"
            value={form.school}
            onChange={(event) => setField("school", event.target.value)}
            placeholder="Tulane University"
          />
        </label>
      </div>

      <div className="form-grid two">
        <label>
          <span>Year or role *</span>
          <select required value={form.year} onChange={(event) => setField("year", event.target.value)}>
            <option value="">Select one...</option>
            {YEAR_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Audience size</span>
          <input
            type="text"
            value={form.audienceSize}
            onChange={(event) => setField("audienceSize", event.target.value)}
            placeholder="Followers, club size, email list, etc."
          />
        </label>
      </div>

      <fieldset>
        <legend>Where can you introduce College Agent?</legend>
        <div className="channel-grid">
          {CHANNEL_OPTIONS.map((channel) => (
            <label key={channel} className="channel-option">
              <input
                type="checkbox"
                checked={form.channels.includes(channel)}
                onChange={() => toggleChannel(channel)}
              />
              <span>{channel}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label>
        <span>Why would you be a strong Ambassador? *</span>
        <textarea
          required
          rows={4}
          value={form.why}
          onChange={(event) => setField("why", event.target.value)}
          placeholder="Tell us about your campus, your network, and why students would trust your recommendation."
        />
      </label>

      <label>
        <span>How would you share it?</span>
        <textarea
          rows={4}
          value={form.referralPlan}
          onChange={(event) => setField("referralPlan", event.target.value)}
          placeholder="Social posts, dorm demos, parent groups, club presentations, newsletter mentions, or another path."
        />
      </label>

      {error && <p className="form-error">{error}</p>}

      <button type="submit" className="btn-purple ambassador-submit" disabled={status === "loading"}>
        <Send size={16} strokeWidth={2.2} />
        {status === "loading" ? "Submitting..." : "Submit Ambassador Request"}
      </button>
    </form>
  );
}
