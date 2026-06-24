"use client";
import { useState } from "react";

export interface StudentInfo {
  firstName: string;
  lastName: string;
  schoolEmail: string;
  personalEmail: string;
  mobile: string;
  school: string;
  year: string;
}

interface Props {
  onComplete: (info: StudentInfo) => void;
}

const YEARS = [
  "Freshman (1st Year)",
  "Sophomore (2nd Year)",
  "Junior (3rd Year)",
  "Senior (4th Year)",
  "5th Year / Super Senior",
  "Graduate Student",
  "MBA Student",
  "Law Student (1L)",
  "Law Student (2L)",
  "Law Student (3L)",
  "Medical Student (MS1)",
  "Medical Student (MS2)",
  "Medical Student (MS3)",
  "Medical Student (MS4)",
  "PhD Candidate",
  "Post-Doctoral Researcher",
];

const empty: StudentInfo = {
  firstName: "", lastName: "", schoolEmail: "", personalEmail: "",
  mobile: "", school: "", year: "",
};

export default function StudentInfoForm({ onComplete }: Props) {
  const [form, setForm] = useState<StudentInfo>(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof StudentInfo, string>>>({});

  function set(field: keyof StudentInfo, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: undefined }));
  }


  function validate() {
    const e: Partial<Record<keyof StudentInfo, string>> = {};
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.lastName.trim()) e.lastName = "Required";
    if (!form.schoolEmail.trim()) e.schoolEmail = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.schoolEmail)) e.schoolEmail = "Invalid email";
    if (!form.personalEmail.trim()) e.personalEmail = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.personalEmail)) e.personalEmail = "Invalid email";
    if (!form.mobile.trim()) e.mobile = "Required";
    if (!form.school) e.school = "Required";
    if (!form.year) e.year = "Required";
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onComplete(form);
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <style>{`
        .sif-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .sif-field { display: flex; flex-direction: column; gap: 6px; }
        .sif-field.full { grid-column: 1 / -1; }
        .sif-label {
          font-family: var(--font-mono); font-size: 10px; font-weight: 700;
          text-transform: uppercase; letter-spacing: .1em; color: rgba(11,23,41,.5);
        }
        .sif-input {
          font-family: inherit; font-size: 14px; padding: 11px 14px;
          border: 1.5px solid rgba(11,23,41,.14); border-radius: 8px;
          background: #fff; color: var(--navy); outline: none;
          transition: border-color .15s;
        }
        .sif-input:focus { border-color: var(--green); }
        .sif-input.error { border-color: var(--red); }
        .sif-select {
          font-family: inherit; font-size: 14px; padding: 11px 14px;
          border: 1.5px solid rgba(11,23,41,.14); border-radius: 8px;
          background: #fff; color: var(--navy); outline: none;
          cursor: pointer; appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%230b1729' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 14px center;
          padding-right: 36px; transition: border-color .15s;
        }
        .sif-select:focus { border-color: var(--green); }
        .sif-select.error { border-color: var(--red); }
        .sif-err { font-size: 11px; color: var(--red); font-family: var(--font-mono); }
        .ai-grid { display: flex; flex-direction: column; gap: 8px; }
        .ai-option {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 16px; border: 1.5px solid rgba(11,23,41,.1);
          border-radius: 8px; cursor: pointer; transition: border-color .15s, background .15s;
          background: #fff;
        }
        .ai-option:hover { border-color: rgba(61,139,61,.4); background: rgba(61,139,61,.03); }
        .ai-option.selected { border-color: var(--green); background: rgba(61,139,61,.05); }
        .ai-radio {
          width: 16px; height: 16px; border-radius: 50%;
          border: 2px solid rgba(11,23,41,.2); flex-shrink: 0;
          transition: border-color .15s; position: relative;
        }
        .ai-option.selected .ai-radio { border-color: var(--green); }
        .ai-option.selected .ai-radio::after {
          content: ''; position: absolute; inset: 3px;
          border-radius: 50%; background: var(--green);
        }
        .ai-label { font-size: 13px; color: var(--navy); font-weight: 500; }
        .sif-submit {
          width: 100%; padding: 16px; background: var(--green); color: #fff;
          font-family: var(--font-mono); font-size: 13px; font-weight: 700;
          letter-spacing: .08em; text-transform: uppercase;
          border: none; border-radius: 8px; cursor: pointer;
          box-shadow: 0 4px 16px rgba(61,139,61,.3);
          transition: filter .15s; margin-top: 8px;
        }
        .sif-submit:hover { filter: brightness(1.08); }
        @media (max-width: 600px) {
          .sif-grid { grid-template-columns: 1fr; }
          .sif-field.full { grid-column: 1; }
        }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Name */}
        <div className="sif-grid">
          <div className="sif-field">
            <label className="sif-label">First Name *</label>
            <input className={`sif-input${errors.firstName ? " error" : ""}`}
              value={form.firstName} onChange={e => set("firstName", e.target.value)}
              placeholder="Alex" />
            {errors.firstName && <span className="sif-err">{errors.firstName}</span>}
          </div>
          <div className="sif-field">
            <label className="sif-label">Last Name *</label>
            <input className={`sif-input${errors.lastName ? " error" : ""}`}
              value={form.lastName} onChange={e => set("lastName", e.target.value)}
              placeholder="Johnson" />
            {errors.lastName && <span className="sif-err">{errors.lastName}</span>}
          </div>
        </div>

        {/* Emails */}
        <div className="sif-grid">
          <div className="sif-field">
            <label className="sif-label">School Email *</label>
            <input className={`sif-input${errors.schoolEmail ? " error" : ""}`}
              type="email" value={form.schoolEmail}
              onChange={e => set("schoolEmail", e.target.value)}
              placeholder="alex@university.edu" />
            {errors.schoolEmail && <span className="sif-err">{errors.schoolEmail}</span>}
          </div>
          <div className="sif-field">
            <label className="sif-label">Personal Email *</label>
            <input className={`sif-input${errors.personalEmail ? " error" : ""}`}
              type="email" value={form.personalEmail}
              onChange={e => set("personalEmail", e.target.value)}
              placeholder="alex@gmail.com" />
            {errors.personalEmail && <span className="sif-err">{errors.personalEmail}</span>}
          </div>
        </div>

        {/* Mobile */}
        <div className="sif-field">
          <label className="sif-label">Mobile Number *</label>
          <input className={`sif-input${errors.mobile ? " error" : ""}`}
            type="tel" value={form.mobile}
            onChange={e => set("mobile", e.target.value)}
            placeholder="(555) 000-0000" />
          {errors.mobile && <span className="sif-err">{errors.mobile}</span>}
        </div>

        {/* School */}
        <div className="sif-field">
          <label className="sif-label">School / University *</label>
          <input
            className={`sif-input${errors.school ? " error" : ""}`}
            value={form.school}
            onChange={e => set("school", e.target.value)}
            placeholder="e.g. University of Michigan"
          />
          {errors.school && <span className="sif-err">{errors.school}</span>}
        </div>

        {/* Year */}
        <div className="sif-field">
          <label className="sif-label">Current Year *</label>
          <select className={`sif-select${errors.year ? " error" : ""}`}
            value={form.year} onChange={e => set("year", e.target.value)}>
            <option value="">Select your year...</option>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {errors.year && <span className="sif-err">{errors.year}</span>}
        </div>

        <button type="submit" className="sif-submit">
          Continue to Build Your Agent →
        </button>
      </div>
    </form>
  );
}
