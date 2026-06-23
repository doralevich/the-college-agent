"use client";
import { useState, useRef } from "react";
import Nav from "../components/Nav";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 1 | 2;

interface FormData {
  // Step 1 — Identity
  firstName: string; lastName: string; schoolEmail: string; phone: string;
  school: string; schoolOther: string; year: string; major: string;
  agentName: string; timezone: string;

  // S1 — Academic Life
  currentClasses: string; professors: string; lmsType: string;
  classFormats: string[]; academicChallenges: string[]; gpaGoal: string;

  // S2 — How You Study
  studyStyle: string; studyMethods: string[]; studyTime: string;
  studyLocation: string; studySessionLength: string;

  // S3 — Schedule & Routine
  wakeTime: string; sleepTime: string; productiveTime: string;
  classDays: string[]; workStatus: string; weeklyCommitmentHours: string;

  // S4 — Social & Campus Life
  socialActivities: string[]; socialFrequency: string;
  greekLife: string; sportsTeams: string; friendGroupDesc: string;

  // S5 — Clubs, Organizations & Community Service
  clubTypes: string[]; specificClubs: string; leadershipRole: string;
  clubTimeCommitment: string; volunteering: string;
  causeAreas: string[]; volunteerOrgs: string; volunteerHoursPerMonth: string;

  // S6 — Mental Health & Wellbeing
  sleepQuality: string; stressLevel: string; burnoutSignals: string[];
  agentWellbeingFlag: string; wellbeingBoundaries: string;

  // S7 — Communication Style
  communicationStyle: string; preferredChannels: string[];
  responseStyle: string; emailResponseTime: string;

  // S8 — Tools You Use Daily
  apps: string[]; devices: string[]; browser: string;
  noteTaking: string[]; calendarApp: string; taskManager: string;

  // S9 — Goals This Semester
  academicGoal: string; careerGoal: string; personalGoal: string;
  stopDoing: string[]; startDoing: string[]; topPriority: string;

  // S10 — Career & Internships
  industryInterest: string; graduationYear: string; internshipStatus: string;
  resumeReady: string; jobSearchActivities: string[]; dreamCompany: string;

  // S11 — Stress & Pain Points
  biggestStressors: string[]; fallsThrough: string;
  agentHandleFirst: string; anythingElse: string;

  // S12 — Agent Personality
  agentTone: string; checkinFrequency: string;
  agentTopics: string[]; agentOffLimits: string;

  // Resume
  resumeFile: File | null;
}

const BLANK: FormData = {
  firstName: "", lastName: "", schoolEmail: "", phone: "",
  school: "", schoolOther: "", year: "", major: "",
  agentName: "", timezone: "",
  currentClasses: "", professors: "", lmsType: "", classFormats: [], academicChallenges: [], gpaGoal: "",
  studyStyle: "", studyMethods: [], studyTime: "", studyLocation: "", studySessionLength: "",
  wakeTime: "", sleepTime: "", productiveTime: "", classDays: [], workStatus: "", weeklyCommitmentHours: "",
  socialActivities: [], socialFrequency: "", greekLife: "", sportsTeams: "", friendGroupDesc: "",
  clubTypes: [], specificClubs: "", leadershipRole: "", clubTimeCommitment: "",
  volunteering: "", causeAreas: [], volunteerOrgs: "", volunteerHoursPerMonth: "",
  sleepQuality: "", stressLevel: "", burnoutSignals: [], agentWellbeingFlag: "", wellbeingBoundaries: "",
  communicationStyle: "", preferredChannels: [], responseStyle: "", emailResponseTime: "",
  apps: [], devices: [], browser: "", noteTaking: [], calendarApp: "", taskManager: "",
  academicGoal: "", careerGoal: "", personalGoal: "", stopDoing: [], startDoing: [], topPriority: "",
  industryInterest: "", graduationYear: "", internshipStatus: "", resumeReady: "", jobSearchActivities: [], dreamCompany: "",
  biggestStressors: [], fallsThrough: "", agentHandleFirst: "", anythingElse: "",
  agentTone: "", checkinFrequency: "", agentTopics: [], agentOffLimits: "",
  resumeFile: null,
};

// ─── Option lists ─────────────────────────────────────────────────────────────

const YEARS = ["Freshman (1st Year)", "Sophomore (2nd Year)", "Junior (3rd Year)", "Senior (4th Year)", "Graduate Student", "Other"];
const TIMEZONES = ["Eastern Time (ET)", "Central Time (CT)", "Mountain Time (MT)", "Pacific Time (PT)", "Alaska Time (AKT)", "Hawaii Time (HST)", "London (GMT/BST)", "Central Europe (CET)", "India (IST)", "Other"];
const LMS_TYPES = ["Canvas", "Blackboard", "Moodle", "D2L/Brightspace", "Google Classroom", "Other / None"];
const CLASS_FORMATS = ["In-person lecture", "Online synchronous", "Online asynchronous", "Lab / Studio", "Hybrid", "Seminar"];
const ACADEMIC_CHALLENGES = ["Time management", "Procrastination", "Test anxiety", "Writing papers", "Math / quantitative", "Staying organized", "Participating in class", "Group projects", "Reading load", "Balancing work and school"];
const GPA_GOALS = ["3.8 – 4.0", "3.5 – 3.7", "3.0 – 3.4", "2.5 – 2.9", "Pass / No fail", "Not focused on GPA right now"];
const STUDY_STYLES = ["Alone", "In groups", "Both — depends on the subject"];
const STUDY_METHODS = ["Flashcards", "Rewriting notes", "Practice tests", "YouTube / videos", "Tutoring", "Study guides", "Reading textbook", "Pomodoro technique", "Mind maps", "Working out problems"];
const STUDY_TIMES = ["Early morning (before 8am)", "Morning (8am–12pm)", "Afternoon (12–5pm)", "Evening (5–9pm)", "Late night (9pm+)", "Varies"];
const STUDY_LOCATIONS = ["Dorm / bedroom", "Library", "Coffee shop", "Campus study lounge", "Home", "Outdoors", "Varies"];
const SESSION_LENGTHS = ["Under 30 minutes", "30–60 minutes", "1–2 hours", "2–3 hours", "3+ hours", "Varies"];
const TIMES_OF_DAY = ["5–7am", "7–9am", "9–11am", "11am–1pm", "1–3pm", "3–5pm", "5–7pm", "7–9pm", "9–11pm", "11pm–1am", "After 1am"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const WORK_STATUSES = ["Not working", "Part-time job (on campus)", "Part-time job (off campus)", "Full-time job", "Internship", "Freelance / self-employed", "Multiple jobs"];
const SOCIAL_ACTIVITIES = ["Parties / social events", "Bars / nightlife", "Dining out", "Concerts / shows", "Gaming", "Intramural sports", "Outdoor / recreation", "Dating apps / dating", "Social media heavy", "Movie nights", "Road trips / travel"];
const SOCIAL_FREQ = ["Very active — something every day", "A few times a week", "Weekends only", "Occasional — mostly focused on school", "Rarely — I keep to myself"];
const GREEK = ["Yes — fraternity", "Yes — sorority", "No", "Interested / rushing"];
const CLUB_TYPES = ["Academic / honor society", "Greek life", "Cultural / international", "Sports / athletics", "Arts / performance", "Pre-professional (law, med, business)", "Political / advocacy", "Religious / spiritual", "Community service / volunteering", "Media / journalism", "STEM / research", "Entrepreneurship"];
const LEADERSHIP = ["President / Chair", "VP / Officer", "Committee lead", "General member", "Not currently in a club"];
const TIME_COMMITMENTS = ["Under 2 hours/week", "2–5 hours/week", "5–10 hours/week", "10+ hours/week"];
const CAUSE_AREAS = ["Education / tutoring", "Environmental", "Hunger / homelessness", "Healthcare / mental health", "Animal welfare", "Social justice", "Political / civic", "Faith-based", "International / global"];
const SLEEP_QUALITY = ["Great — I wake up rested", "OK — some nights are rough", "Poor — I rarely feel rested", "Inconsistent"];
const STRESS_LEVELS = ["1 — Very low", "2", "3", "4", "5 — Moderate", "6", "7", "8", "9", "10 — Extremely high"];
const BURNOUT_SIGNALS = ["Skipping class", "Procrastinating more than usual", "Withdrawing from friends", "Trouble sleeping", "Loss of motivation", "Emotional exhaustion", "Overeating or undereating", "Irritability / mood swings"];
const WELLBEING_FLAGS = ["Yes — flag me when my schedule looks overloaded", "Yes — check in if I haven&apos;t responded in a while", "No — I&apos;ll manage it myself"];
const COMM_STYLES = ["Formal — I like professional, structured writing", "Casual — conversational and relaxed", "Depends on who I&apos;m writing to"];
const CHANNELS = ["Email", "Text / SMS", "Telegram", "Discord", "Slack", "WhatsApp", "Instagram DM", "Phone call"];
const RESPONSE_STYLES = ["Short and direct — bullet points, no fluff", "Detailed — full context and explanation", "Depends on the situation"];
const EMAIL_RESPONSE_TIMES = ["Same day", "Within 24 hours", "Within 48 hours", "A few days is fine", "I often let emails sit"];
const APPS_LIST = ["Notion", "Google Docs", "Microsoft Word", "Obsidian", "Roam Research", "Evernote", "OneNote", "Trello", "Asana", "Todoist", "Things 3", "Slack", "Discord", "Telegram", "WhatsApp", "LinkedIn", "Handshake", "Zoom", "Teams", "Gmail", "Outlook", "Spotify", "ChatGPT", "Copilot"];
const DEVICES_LIST = ["MacBook", "Windows laptop", "iPad", "iPhone", "Android", "Desktop PC", "Chromebook"];
const BROWSERS = ["Chrome", "Safari", "Firefox", "Edge", "Arc", "Brave", "Other"];
const NOTE_TOOLS = ["Handwritten notes", "Notion", "Google Docs", "Word", "Obsidian", "Roam", "Evernote", "OneNote", "Apple Notes", "Typed in class", "I don&apos;t take notes"];
const CALENDAR_APPS = ["Google Calendar", "Apple Calendar", "Outlook Calendar", "Notion calendar", "Paper planner", "I don&apos;t use a calendar"];
const TASK_MANAGERS = ["Todoist", "Trello", "Asana", "Notion", "Things 3", "Apple Reminders", "Google Tasks", "Sticky notes", "None"];
const STOP_DOING = ["Procrastinating on assignments", "Checking my phone in class", "Pulling all-nighters", "Missing deadlines", "Ignoring emails", "Saying yes to everything", "Skipping meals"];
const START_DOING = ["Building a weekly schedule", "Reading emails daily", "Networking more", "Working out consistently", "Sleeping 7+ hours", "Meal prepping", "Journaling"];
const PRIORITIES = ["Academic performance", "Career / internship search", "Mental health & wellbeing", "Social life & relationships", "Health & fitness", "Financial stability", "Personal growth"];
const INDUSTRIES = ["Finance / Banking", "Consulting", "Technology / Software", "Healthcare / Medicine", "Law", "Marketing / PR", "Media / Entertainment", "Non-profit / Social impact", "Government / Policy", "Real estate", "Entrepreneurship / Startups", "Education", "Engineering", "Research / Academia", "Not sure yet"];
const GRAD_YEARS = ["2025", "2026", "2027", "2028", "2029", "2030+"];
const INTERNSHIP_STATUSES = ["Currently in an internship", "Actively searching", "Have offers, deciding", "Plan to search next semester", "Not focused on internships right now"];
const JOB_SEARCH = ["Updating resume", "Reaching out on LinkedIn", "Attending career fairs", "Applying on Handshake / LinkedIn", "Cold emailing", "Practicing interviews", "Building portfolio / projects", "Working with career center"];
const STRESSORS = ["Deadlines and workload", "Grades / GPA", "Social pressure", "Financial stress", "Family expectations", "Career uncertainty", "Relationship issues", "Health concerns", "Time management", "FOMO"];
const FALLS_THROUGH = ["Emails from professors", "Assignment deadlines", "Internship / job applications", "Advisor meetings", "Club obligations", "Friend plans", "Personal health appointments", "Financial aid tasks"];
const HANDLE_FIRST = ["Email drafting", "Deadline tracking", "Internship search", "Study scheduling", "Weekly briefings", "Meeting prep", "General task management"];
const TONES = ["Professional and polished", "Friendly and conversational", "Motivational / coaching", "Direct and efficient", "Warm but focused"];
const CHECKIN_FREQ = ["Daily morning briefing", "Twice a week", "Weekly digest", "Only when I ask", "Real-time — whenever relevant"];
const AGENT_TOPICS = ["Upcoming deadlines", "Internship / job opportunities", "Unanswered emails", "Schedule conflicts", "Study reminders", "Weekly goal check-ins", "Mental health check-ins", "Campus events", "Networking suggestions"];

// ─── Component ────────────────────────────────────────────────────────────────

export default function SetupPage() {
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormData>(BLANK);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof FormData, v: string) => setForm(f => ({ ...f, [k]: v }));

  function toggle(k: keyof FormData, val: string) {
    setForm(f => {
      const arr = (f[k] as string[]) || [];
      return { ...f, [k]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] };
    });
  }

  const step1Complete =
    form.firstName && form.lastName && form.schoolEmail &&
    form.phone && form.school && form.year && form.major && form.timezone;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const body = new FormData();
      const { resumeFile, ...rest } = form;
      body.append("data", JSON.stringify(rest));
      if (resumeFile) body.append("resume", resumeFile);
      const res = await fetch("/api/setup-submit", { method: "POST", body });
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
              Your agent build has started.
            </h1>
            <p style={{ fontSize: 16, color: "rgba(11,23,41,.6)", lineHeight: 1.7, marginBottom: 32 }}>
              We have everything we need. Your team will reach out within 24 hours with your agent&apos;s status. In the meantime, check your email for a confirmation.
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
          <div style={{ maxWidth: 700, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              {[1, 2].map(n => (
                <div key={n} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                    background: step >= n ? "var(--green)" : "rgba(255,255,255,.1)",
                    color: step >= n ? "#fff" : "rgba(255,255,255,.4)",
                    fontSize: 12, fontWeight: 700, fontFamily: "var(--font-mono)",
                  }}>{n}</div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, letterSpacing: ".08em", color: step >= n ? "rgba(255,255,255,.8)" : "rgba(255,255,255,.3)", textTransform: "uppercase" }}>
                    {n === 1 ? "Your Setup" : "Your Agent"}
                  </span>
                  {n < 2 && <span style={{ color: "rgba(255,255,255,.2)", marginLeft: 4 }}>→</span>}
                </div>
              ))}
            </div>
            <h1 style={{ fontSize: 30, fontWeight: 800, color: "#fff", marginBottom: 8 }}>
              {step === 1 ? "Step 1 — The Basics" : "Step 2 — Build Your Agent"}
            </h1>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,.55)" }}>
              {step === 1
                ? "Who you are, how you work, what you want. Takes about 15 minutes."
                : "The detailed profile that powers your personalized agent."}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ maxWidth: 700, margin: "0 auto", padding: "40px 24px 80px" }}>
          {step === 1 ? (
            <Step1 form={form} set={set} toggle={toggle} onNext={() => setStep(2)} isComplete={!!step1Complete} />
          ) : (
            <Step2
              form={form} set={set} toggle={toggle} fileRef={fileRef}
              onBack={() => setStep(1)} loading={loading} error={error}
              onFileChange={f => setForm(p => ({ ...p, resumeFile: f }))}
            />
          )}
        </form>
      </main>

      <style>{`
        input[type="text"], input[type="email"], input[type="tel"], select, textarea {
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
        input::placeholder, textarea::placeholder { color: rgba(11,23,41,.3); }
        button:disabled { opacity: .5; cursor: not-allowed; }
        .section-block { background: #fff; border: 1px solid rgba(11,23,41,.08); border-radius: 14px; padding: 32px; margin-bottom: 24px; }
        .section-label { font-family: var(--font-mono); font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--green); margin-bottom: 4px; }
        .section-title { font-size: 18px; font-weight: 800; color: var(--navy); margin-bottom: 24px; }
        .field-label { display: block; font-family: var(--font-mono); font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: rgba(11,23,41,.5); margin-bottom: 6px; }
        .field-wrap { margin-bottom: 18px; }
        .checkbox-grid { display: flex; flex-wrap: wrap; gap: 8px; }
        .check-chip { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 99px; border: 1.5px solid rgba(11,23,41,.12); font-size: 13px; cursor: pointer; transition: all .15s; background: #fff; color: var(--navy); user-select: none; }
        .check-chip.active { border-color: var(--green); background: rgba(61,139,61,.07); color: var(--green); font-weight: 600; }
        .radio-stack { display: flex; flex-direction: column; gap: 8px; }
        .radio-chip { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-radius: 8px; border: 1.5px solid rgba(11,23,41,.1); cursor: pointer; transition: all .15s; background: #fff; }
        .radio-chip.active { border-color: var(--green); background: rgba(61,139,61,.05); }
        .radio-dot { width: 16px; height: 16px; border-radius: 50%; border: 2px solid rgba(11,23,41,.2); flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
        .radio-chip.active .radio-dot { border-color: var(--green); }
        .radio-chip.active .radio-dot::after { content: ''; display: block; width: 8px; height: 8px; border-radius: 50%; background: var(--green); }
      `}</style>
    </>
  );
}

// ─── Step 1 ───────────────────────────────────────────────────────────────────

function Step1({ form, set, toggle, onNext, isComplete }: {
  form: FormData; set: (k: keyof FormData, v: string) => void;
  toggle: (k: keyof FormData, v: string) => void;
  onNext: () => void; isComplete: boolean;
}) {
  return (
    <div>
      {/* 01 — Your Info */}
      <div className="section-block">
        <p className="section-label">01</p>
        <p className="section-title">Your Info</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <FieldWrap label="First Name" required><input type="text" placeholder="Jane" value={form.firstName} onChange={e => set("firstName", e.target.value)} required /></FieldWrap>
          <FieldWrap label="Last Name" required><input type="text" placeholder="Smith" value={form.lastName} onChange={e => set("lastName", e.target.value)} required /></FieldWrap>
        </div>
        <FieldWrap label="School Email" required><input type="email" placeholder="jane@university.edu" value={form.schoolEmail} onChange={e => set("schoolEmail", e.target.value)} required /></FieldWrap>
        <FieldWrap label="Phone Number" required><input type="tel" placeholder="+1 (___) ___-____" value={form.phone} onChange={e => set("phone", e.target.value)} required /></FieldWrap>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <FieldWrap label="School" required>
            <select value={form.school} onChange={e => set("school", e.target.value)} required>
              <option value="">Select school...</option>
              {["University of Michigan","Northwestern University","Indiana University","Ohio State University","University of Georgia","University of Maryland","Tulane University","UNC Chapel Hill","University of Miami","University of Florida","Washington University in St. Louis","Columbia University","Syracuse University","UCLA","Other"].map(s => <option key={s}>{s}</option>)}
            </select>
          </FieldWrap>
          <FieldWrap label="Year" required>
            <select value={form.year} onChange={e => set("year", e.target.value)} required>
              <option value="">Select year...</option>
              {YEARS.map(y => <option key={y}>{y}</option>)}
            </select>
          </FieldWrap>
        </div>
        {form.school === "Other" && (
          <FieldWrap label="School Name" required><input type="text" placeholder="Enter your school name" value={form.schoolOther} onChange={e => set("schoolOther", e.target.value)} /></FieldWrap>
        )}
        <FieldWrap label="Major / Field of Study" required><input type="text" placeholder="e.g. Business, Pre-Med, Computer Science" value={form.major} onChange={e => set("major", e.target.value)} required /></FieldWrap>
      </div>

      {/* 02 — Your Agent */}
      <div className="section-block">
        <p className="section-label">02</p>
        <p className="section-title">Your Agent</p>
        <FieldWrap label="What would you like to name your agent?">
          <input type="text" placeholder="e.g. Nova, Atlas, Sage, Donna" value={form.agentName} onChange={e => set("agentName", e.target.value)} />
        </FieldWrap>
        <FieldWrap label="Timezone" required>
          <select value={form.timezone} onChange={e => set("timezone", e.target.value)} required>
            <option value="">Select timezone...</option>
            {TIMEZONES.map(t => <option key={t}>{t}</option>)}
          </select>
        </FieldWrap>
      </div>

      <button type="button" className="btn-purple" style={{ width: "100%", fontSize: 14 }} disabled={!isComplete} onClick={onNext}>
        Continue to Step 2 →
      </button>
    </div>
  );
}

// ─── Step 2 ───────────────────────────────────────────────────────────────────

function Step2({ form, set, toggle, fileRef, onBack, loading, error, onFileChange }: {
  form: FormData; set: (k: keyof FormData, v: string) => void;
  toggle: (k: keyof FormData, v: string) => void;
  fileRef: React.RefObject<HTMLInputElement | null>;
  onBack: () => void; loading: boolean; error: string;
  onFileChange: (f: File) => void;
}) {
  return (
    <div>
      {/* S1 — Academic Life */}
      <SectionBlock num="S1" title="Academic Life">
        <FieldWrap label="What classes are you currently taking?">
          <textarea rows={3} placeholder="e.g. Intro to Finance, Marketing 301, Statistics II..." value={form.currentClasses} onChange={e => set("currentClasses", e.target.value)} />
        </FieldWrap>
        <FieldWrap label="Professor names (optional)">
          <textarea rows={2} placeholder="e.g. Prof. Johnson, Dr. Smith..." value={form.professors} onChange={e => set("professors", e.target.value)} />
        </FieldWrap>
        <FieldWrap label="Learning Management System (LMS)">
          <select value={form.lmsType} onChange={e => set("lmsType", e.target.value)}>
            <option value="">Select LMS...</option>
            {LMS_TYPES.map(l => <option key={l}>{l}</option>)}
          </select>
        </FieldWrap>
        <FieldWrap label="Class formats (select all that apply)">
          <CheckGrid options={CLASS_FORMATS} selected={form.classFormats} onToggle={v => toggle("classFormats", v)} />
        </FieldWrap>
        <FieldWrap label="Biggest academic challenges (select all that apply)">
          <CheckGrid options={ACADEMIC_CHALLENGES} selected={form.academicChallenges} onToggle={v => toggle("academicChallenges", v)} />
        </FieldWrap>
        <FieldWrap label="GPA goal this semester">
          <RadioStack options={GPA_GOALS} selected={form.gpaGoal} onSelect={v => set("gpaGoal", v)} />
        </FieldWrap>
      </SectionBlock>

      {/* S2 — How You Study */}
      <SectionBlock num="S2" title="How You Study">
        <FieldWrap label="Do you prefer to study alone or in groups?">
          <RadioStack options={STUDY_STYLES} selected={form.studyStyle} onSelect={v => set("studyStyle", v)} />
        </FieldWrap>
        <FieldWrap label="Study methods you use (select all that apply)">
          <CheckGrid options={STUDY_METHODS} selected={form.studyMethods} onToggle={v => toggle("studyMethods", v)} />
        </FieldWrap>
        <FieldWrap label="Best time to study">
          <RadioStack options={STUDY_TIMES} selected={form.studyTime} onSelect={v => set("studyTime", v)} />
        </FieldWrap>
        <FieldWrap label="Favorite study location">
          <RadioStack options={STUDY_LOCATIONS} selected={form.studyLocation} onSelect={v => set("studyLocation", v)} />
        </FieldWrap>
        <FieldWrap label="Typical study session length">
          <RadioStack options={SESSION_LENGTHS} selected={form.studySessionLength} onSelect={v => set("studySessionLength", v)} />
        </FieldWrap>
      </SectionBlock>

      {/* S3 — Schedule & Routine */}
      <SectionBlock num="S3" title="Schedule & Routine">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          <FieldWrap label="Wake time">
            <select value={form.wakeTime} onChange={e => set("wakeTime", e.target.value)}>
              <option value="">Select...</option>
              {TIMES_OF_DAY.map(t => <option key={t}>{t}</option>)}
            </select>
          </FieldWrap>
          <FieldWrap label="Sleep time">
            <select value={form.sleepTime} onChange={e => set("sleepTime", e.target.value)}>
              <option value="">Select...</option>
              {TIMES_OF_DAY.map(t => <option key={t}>{t}</option>)}
            </select>
          </FieldWrap>
          <FieldWrap label="Most productive time">
            <select value={form.productiveTime} onChange={e => set("productiveTime", e.target.value)}>
              <option value="">Select...</option>
              {TIMES_OF_DAY.map(t => <option key={t}>{t}</option>)}
            </select>
          </FieldWrap>
        </div>
        <FieldWrap label="Days you have class (select all that apply)">
          <CheckGrid options={DAYS} selected={form.classDays} onToggle={v => toggle("classDays", v)} />
        </FieldWrap>
        <FieldWrap label="Work / employment status">
          <RadioStack options={WORK_STATUSES} selected={form.workStatus} onSelect={v => set("workStatus", v)} />
        </FieldWrap>
        <FieldWrap label="Roughly how many hours per week are committed (classes + work + commitments)?">
          <input type="text" placeholder="e.g. 40–50 hours" value={form.weeklyCommitmentHours} onChange={e => set("weeklyCommitmentHours", e.target.value)} />
        </FieldWrap>
      </SectionBlock>

      {/* S4 — Social & Campus Life */}
      <SectionBlock num="S4" title="Social & Campus Life">
        <FieldWrap label="Social activities you participate in (select all that apply)">
          <CheckGrid options={SOCIAL_ACTIVITIES} selected={form.socialActivities} onToggle={v => toggle("socialActivities", v)} />
        </FieldWrap>
        <FieldWrap label="How socially active are you?">
          <RadioStack options={SOCIAL_FREQ} selected={form.socialFrequency} onSelect={v => set("socialFrequency", v)} />
        </FieldWrap>
        <FieldWrap label="Greek life?">
          <RadioStack options={GREEK} selected={form.greekLife} onSelect={v => set("greekLife", v)} />
        </FieldWrap>
        <FieldWrap label="Sports teams (varsity, club, intramural)?">
          <input type="text" placeholder="e.g. Club soccer, intramural basketball" value={form.sportsTeams} onChange={e => set("sportsTeams", e.target.value)} />
        </FieldWrap>
        <FieldWrap label="Describe your friend group in a sentence">
          <input type="text" placeholder="e.g. A tight group of 5, mostly from my major" value={form.friendGroupDesc} onChange={e => set("friendGroupDesc", e.target.value)} />
        </FieldWrap>
      </SectionBlock>

      {/* S5 — Clubs, Organizations & Community Service */}
      <SectionBlock num="S5" title="Clubs, Organizations & Community Service">
        <FieldWrap label="Types of clubs / organizations you&apos;re involved in">
          <CheckGrid options={CLUB_TYPES} selected={form.clubTypes} onToggle={v => toggle("clubTypes", v)} />
        </FieldWrap>
        <FieldWrap label="Specific clubs or organizations (list them)">
          <textarea rows={2} placeholder="e.g. Finance Club, Delta Gamma, Model UN..." value={form.specificClubs} onChange={e => set("specificClubs", e.target.value)} />
        </FieldWrap>
        <FieldWrap label="Leadership role?">
          <RadioStack options={LEADERSHIP} selected={form.leadershipRole} onSelect={v => set("leadershipRole", v)} />
        </FieldWrap>
        <FieldWrap label="Total club time commitment per week">
          <RadioStack options={TIME_COMMITMENTS} selected={form.clubTimeCommitment} onSelect={v => set("clubTimeCommitment", v)} />
        </FieldWrap>
        <FieldWrap label="Are you currently volunteering or doing community service?">
          <RadioStack options={["Yes, regularly", "Occasionally", "Not right now, but interested", "No"]} selected={form.volunteering} onSelect={v => set("volunteering", v)} />
        </FieldWrap>
        {(form.volunteering === "Yes, regularly" || form.volunteering === "Occasionally") && (
          <>
            <FieldWrap label="Cause areas (select all that apply)">
              <CheckGrid options={CAUSE_AREAS} selected={form.causeAreas} onToggle={v => toggle("causeAreas", v)} />
            </FieldWrap>
            <FieldWrap label="Organizations you volunteer with">
              <input type="text" placeholder="e.g. Habitat for Humanity, local food bank" value={form.volunteerOrgs} onChange={e => set("volunteerOrgs", e.target.value)} />
            </FieldWrap>
            <FieldWrap label="Hours per month">
              <RadioStack options={["Under 5 hours", "5–10 hours", "10–20 hours", "20+ hours"]} selected={form.volunteerHoursPerMonth} onSelect={v => set("volunteerHoursPerMonth", v)} />
            </FieldWrap>
          </>
        )}
      </SectionBlock>

      {/* S6 — Mental Health & Wellbeing */}
      <SectionBlock num="S6" title="Mental Health & Wellbeing">
        <FieldWrap label="How would you rate your sleep quality?">
          <RadioStack options={SLEEP_QUALITY} selected={form.sleepQuality} onSelect={v => set("sleepQuality", v)} />
        </FieldWrap>
        <FieldWrap label="Current stress level (1 = very low, 10 = extremely high)">
          <RadioStack options={STRESS_LEVELS} selected={form.stressLevel} onSelect={v => set("stressLevel", v)} horizontal />
        </FieldWrap>
        <FieldWrap label="Signs that you&apos;re burning out (select any that apply)">
          <CheckGrid options={BURNOUT_SIGNALS} selected={form.burnoutSignals} onToggle={v => toggle("burnoutSignals", v)} />
        </FieldWrap>
        <FieldWrap label="Should your agent flag you when it looks like you&apos;re overloaded?">
          <RadioStack options={["Yes — flag me when my schedule looks overloaded", "Yes — check in if I haven't responded in a while", "No — I'll manage it myself"]} selected={form.agentWellbeingFlag} onSelect={v => set("agentWellbeingFlag", v)} />
        </FieldWrap>
        <FieldWrap label="Anything that&apos;s off-limits for your agent? (mental health topics you prefer not to discuss)">
          <textarea rows={2} placeholder="e.g. Please don't ask about my family situation" value={form.wellbeingBoundaries} onChange={e => set("wellbeingBoundaries", e.target.value)} />
        </FieldWrap>
      </SectionBlock>

      {/* S7 — Communication Style */}
      <SectionBlock num="S7" title="Communication Style">
        <FieldWrap label="How do you naturally write?">
          <RadioStack options={COMM_STYLES} selected={form.communicationStyle} onSelect={v => set("communicationStyle", v)} />
        </FieldWrap>
        <FieldWrap label="Channels you use most (select all that apply)">
          <CheckGrid options={CHANNELS} selected={form.preferredChannels} onToggle={v => toggle("preferredChannels", v)} />
        </FieldWrap>
        <FieldWrap label="How do you want your agent to respond?">
          <RadioStack options={RESPONSE_STYLES} selected={form.responseStyle} onSelect={v => set("responseStyle", v)} />
        </FieldWrap>
        <FieldWrap label="Your typical email response time">
          <RadioStack options={EMAIL_RESPONSE_TIMES} selected={form.emailResponseTime} onSelect={v => set("emailResponseTime", v)} />
        </FieldWrap>
      </SectionBlock>

      {/* S8 — Tools You Use Daily */}
      <SectionBlock num="S8" title="Tools You Use Daily">
        <FieldWrap label="Apps you use regularly (select all that apply)">
          <CheckGrid options={APPS_LIST} selected={form.apps} onToggle={v => toggle("apps", v)} />
        </FieldWrap>
        <FieldWrap label="Devices you use">
          <CheckGrid options={DEVICES_LIST} selected={form.devices} onToggle={v => toggle("devices", v)} />
        </FieldWrap>
        <FieldWrap label="Primary browser">
          <RadioStack options={BROWSERS} selected={form.browser} onSelect={v => set("browser", v)} horizontal />
        </FieldWrap>
        <FieldWrap label="Note-taking method(s)">
          <CheckGrid options={NOTE_TOOLS} selected={form.noteTaking} onToggle={v => toggle("noteTaking", v)} />
        </FieldWrap>
        <FieldWrap label="Calendar app">
          <RadioStack options={CALENDAR_APPS} selected={form.calendarApp} onSelect={v => set("calendarApp", v)} />
        </FieldWrap>
        <FieldWrap label="Task manager">
          <RadioStack options={TASK_MANAGERS} selected={form.taskManager} onSelect={v => set("taskManager", v)} />
        </FieldWrap>
      </SectionBlock>

      {/* S9 — Goals This Semester */}
      <SectionBlock num="S9" title="Goals This Semester">
        <FieldWrap label="Academic goal">
          <input type="text" placeholder="e.g. Raise my GPA from 3.2 to 3.5" value={form.academicGoal} onChange={e => set("academicGoal", e.target.value)} />
        </FieldWrap>
        <FieldWrap label="Career goal">
          <input type="text" placeholder="e.g. Land a summer internship at a finance firm" value={form.careerGoal} onChange={e => set("careerGoal", e.target.value)} />
        </FieldWrap>
        <FieldWrap label="Personal goal">
          <input type="text" placeholder="e.g. Work out 4x a week, stop all-nighters" value={form.personalGoal} onChange={e => set("personalGoal", e.target.value)} />
        </FieldWrap>
        <FieldWrap label="Things you want to stop doing (select all that apply)">
          <CheckGrid options={STOP_DOING} selected={form.stopDoing} onToggle={v => toggle("stopDoing", v)} />
        </FieldWrap>
        <FieldWrap label="Things you want to start doing (select all that apply)">
          <CheckGrid options={START_DOING} selected={form.startDoing} onToggle={v => toggle("startDoing", v)} />
        </FieldWrap>
        <FieldWrap label="Your #1 priority this semester">
          <RadioStack options={PRIORITIES} selected={form.topPriority} onSelect={v => set("topPriority", v)} />
        </FieldWrap>
      </SectionBlock>

      {/* S10 — Career & Internships */}
      <SectionBlock num="S10" title="Career & Internships">
        <FieldWrap label="Industry you&apos;re most interested in">
          <select value={form.industryInterest} onChange={e => set("industryInterest", e.target.value)}>
            <option value="">Select industry...</option>
            {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
          </select>
        </FieldWrap>
        <FieldWrap label="Expected graduation year">
          <select value={form.graduationYear} onChange={e => set("graduationYear", e.target.value)}>
            <option value="">Select year...</option>
            {GRAD_YEARS.map(y => <option key={y}>{y}</option>)}
          </select>
        </FieldWrap>
        <FieldWrap label="Internship / job search status">
          <RadioStack options={INTERNSHIP_STATUSES} selected={form.internshipStatus} onSelect={v => set("internshipStatus", v)} />
        </FieldWrap>
        <FieldWrap label="Is your resume ready to send?">
          <RadioStack options={["Yes, updated and ready", "Needs updating", "I don't have one yet"]} selected={form.resumeReady} onSelect={v => set("resumeReady", v)} />
        </FieldWrap>
        <FieldWrap label="Job search activities you&apos;re doing (select all that apply)">
          <CheckGrid options={JOB_SEARCH} selected={form.jobSearchActivities} onToggle={v => toggle("jobSearchActivities", v)} />
        </FieldWrap>
        <FieldWrap label="Dream company or organization">
          <input type="text" placeholder="e.g. Goldman Sachs, Google, Deloitte, NIH" value={form.dreamCompany} onChange={e => set("dreamCompany", e.target.value)} />
        </FieldWrap>

        {/* Resume Upload */}
        <FieldWrap label="Upload your resume (optional — PDF preferred)">
          <div
            onClick={() => fileRef.current?.click()}
            style={{ border: "2px dashed rgba(11,23,41,.15)", borderRadius: 8, padding: "24px", textAlign: "center", cursor: "pointer", transition: "border-color .15s" }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--green)")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(11,23,41,.15)")}
          >
            {form.resumeFile ? (
              <p style={{ fontSize: 14, color: "var(--green)", fontWeight: 600 }}>{form.resumeFile.name}</p>
            ) : (
              <>
                <p style={{ fontSize: 14, color: "rgba(11,23,41,.5)", marginBottom: 4 }}>Click to upload your resume</p>
                <p style={{ fontSize: 12, color: "rgba(11,23,41,.3)", fontFamily: "var(--font-mono)" }}>PDF, DOC, or DOCX — max 5MB</p>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) onFileChange(e.target.files[0]); }} />
        </FieldWrap>
      </SectionBlock>

      {/* S11 — Stress & Pain Points */}
      <SectionBlock num="S11" title="Stress & Pain Points">
        <FieldWrap label="Biggest stressors right now (select all that apply)">
          <CheckGrid options={STRESSORS} selected={form.biggestStressors} onToggle={v => toggle("biggestStressors", v)} />
        </FieldWrap>
        <FieldWrap label="What falls through the cracks most often?">
          <RadioStack options={FALLS_THROUGH} selected={form.fallsThrough} onSelect={v => set("fallsThrough", v)} />
        </FieldWrap>
        <FieldWrap label="What do you want your agent to handle first?">
          <RadioStack options={HANDLE_FIRST} selected={form.agentHandleFirst} onSelect={v => set("agentHandleFirst", v)} />
        </FieldWrap>
      </SectionBlock>

      {/* S12 — Agent Personality */}
      <SectionBlock num="S12" title="Your Agent&apos;s Personality">
        <FieldWrap label="How should your agent talk to you?">
          <RadioStack options={TONES} selected={form.agentTone} onSelect={v => set("agentTone", v)} />
        </FieldWrap>
        <FieldWrap label="How often do you want proactive check-ins?">
          <RadioStack options={CHECKIN_FREQ} selected={form.checkinFrequency} onSelect={v => set("checkinFrequency", v)} />
        </FieldWrap>
        <FieldWrap label="What should your agent proactively surface? (select all that apply)">
          <CheckGrid options={AGENT_TOPICS} selected={form.agentTopics} onToggle={v => toggle("agentTopics", v)} />
        </FieldWrap>
        <FieldWrap label="Any topics that are off-limits for your agent?">
          <textarea rows={2} placeholder="e.g. Don't bring up my relationship status, financial situation" value={form.agentOffLimits} onChange={e => set("agentOffLimits", e.target.value)} />
        </FieldWrap>
      </SectionBlock>

      {/* Open field */}
      <SectionBlock num="S13" title="Anything Else?">
        <FieldWrap label="What else should your agent always know about you?">
          <textarea rows={4} placeholder="Anything that didn't fit above — habits, preferences, context, quirks. The more you share, the better your agent." value={form.anythingElse} onChange={e => set("anythingElse", e.target.value)} />
        </FieldWrap>
      </SectionBlock>

      {error && <p style={{ color: "var(--red)", fontSize: 13, marginBottom: 16 }}>{error}</p>}

      <div style={{ display: "flex", gap: 12 }}>
        <button type="button" onClick={onBack} style={{ flex: "0 0 auto", padding: "14px 24px", borderRadius: 4, border: "1.5px solid rgba(11,23,41,.15)", background: "transparent", fontSize: 13, fontWeight: 700, fontFamily: "var(--font-mono)", letterSpacing: ".06em", color: "rgba(11,23,41,.6)", cursor: "pointer" }}>
          ← Back
        </button>
        <button type="submit" className="btn-purple" style={{ flex: 1, fontSize: 14 }} disabled={loading}>
          {loading ? "Submitting..." : "Submit & Start My Build →"}
        </button>
      </div>

      <p style={{ textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(11,23,41,.35)", marginTop: 20, letterSpacing: ".04em" }}>
        Your information is confidential. We do not sell or share your data.
      </p>
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function SectionBlock({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <div className="section-block">
      <p className="section-label">{num}</p>
      <p className="section-title" dangerouslySetInnerHTML={{ __html: title }} />
      {children}
    </div>
  );
}

function FieldWrap({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="field-wrap">
      <label className="field-label" dangerouslySetInnerHTML={{ __html: label + (required ? '<span style="color:var(--green);margin-left:2px">*</span>' : "") }} />
      {children}
    </div>
  );
}

function CheckGrid({ options, selected, onToggle }: { options: string[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="checkbox-grid">
      {options.map(o => (
        <span key={o} className={`check-chip${selected.includes(o) ? " active" : ""}`} onClick={() => onToggle(o)}>
          {selected.includes(o) && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>}
          <span dangerouslySetInnerHTML={{ __html: o }} />
        </span>
      ))}
    </div>
  );
}

function RadioStack({ options, selected, onSelect, horizontal }: { options: string[]; selected: string; onSelect: (v: string) => void; horizontal?: boolean }) {
  if (horizontal) {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {options.map(o => (
          <span key={o} className={`check-chip${selected === o ? " active" : ""}`} onClick={() => onSelect(o)}>
            <span dangerouslySetInnerHTML={{ __html: o }} />
          </span>
        ))}
      </div>
    );
  }
  return (
    <div className="radio-stack">
      {options.map(o => (
        <div key={o} className={`radio-chip${selected === o ? " active" : ""}`} onClick={() => onSelect(o)}>
          <div className="radio-dot" />
          <span style={{ fontSize: 14, color: "var(--navy)" }} dangerouslySetInnerHTML={{ __html: o }} />
        </div>
      ))}
    </div>
  );
}
