"use client";
import { useState, useRef } from "react";
import Nav from "../components/Nav";

// ─── Option lists ─────────────────────────────────────────────────────────────

const SCHOOL_SUGGESTIONS = [
  "University of Michigan","Northwestern University","Indiana University",
  "Ohio State University","University of Georgia","University of Maryland",
  "Tulane University","UNC Chapel Hill","University of Miami","University of Florida",
  "Washington University in St. Louis","Columbia University","Syracuse University","UCLA",
  "Harvard University","Yale University","Princeton University","Stanford University",
  "University of Pennsylvania","Duke University","Georgetown University","NYU",
  "Boston University","Northeastern University","USC","University of Texas at Austin",
  "University of Virginia","University of Wisconsin-Madison","Penn State University",
  "Purdue University","Michigan State University","University of Illinois Urbana-Champaign",
  "Arizona State University","Florida State University","Wake Forest University",
  "Emory University","Vanderbilt University","Rice University","Carnegie Mellon University",
  "Georgia Tech","University of Notre Dame",
];

const YEARS = ["Freshman (1st Year)","Sophomore (2nd Year)","Junior (3rd Year)","Senior (4th Year)","Graduate Student","Other"];
const TIMEZONES = ["Eastern Time (ET)","Central Time (CT)","Mountain Time (MT)","Pacific Time (PT)","Alaska Time (AKT)","Hawaii Time (HST)","London (GMT/BST)","Central Europe (CET)","India (IST)","Other"];

const STUDY_METHODS = ["Flashcards","Rewriting notes","Practice tests","YouTube / videos","Tutoring","Study guides","Pomodoro technique","Working out problems"];
const STUDY_TIMES = ["Early morning (before 8am)","Morning (8–12pm)","Afternoon (12–5pm)","Evening (5–9pm)","Late night (9pm+)","Varies"];
const STUDY_LOCATIONS = ["Dorm / bedroom","Library","Coffee shop","Campus study lounge","Home","Varies"];
const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const WORK_STATUSES = ["Not working","Part-time (on campus)","Part-time (off campus)","Full-time","Internship","Freelance"];
const SOCIAL_ACTIVITIES = ["Parties / social events","Bars / nightlife","Concerts / shows","Gaming","Intramural sports","Outdoor / recreation","Dating apps","Social media heavy","Road trips / travel"];
const GREEK = ["Yes — fraternity","Yes — sorority","No","Interested / rushing"];
const CLUB_TYPES = ["Academic / honor society","Greek life","Cultural / international","Sports / athletics","Arts / performance","Pre-professional","Political / advocacy","Religious / spiritual","Community service","Media / journalism","STEM / research","Entrepreneurship"];
const CAUSE_AREAS = ["Education / tutoring","Environmental","Hunger / homelessness","Healthcare / mental health","Animal welfare","Social justice","Faith-based","International / global"];
const BURNOUT_SIGNALS = ["Skipping class","Procrastinating more than usual","Withdrawing from friends","Trouble sleeping","Loss of motivation","Emotional exhaustion","Irritability / mood swings"];
const CHANNELS = ["Email","Text / SMS","Telegram","Discord","Slack","WhatsApp","Phone call"];
const APPS_LIST = ["Notion","Google Docs","Microsoft Word","Obsidian","Evernote","OneNote","Trello","Asana","Todoist","Slack","Discord","Telegram","LinkedIn","Handshake","Zoom","Gmail","Outlook","ChatGPT"];
const DEVICES_LIST = ["MacBook","Windows laptop","iPad","iPhone","Android","Desktop PC","Chromebook"];
const BROWSERS = ["Chrome","Safari","Firefox","Edge","Arc","Brave"];
const NOTE_TOOLS = ["Handwritten notes","Notion","Google Docs","Word","Obsidian","Apple Notes","Typed in class","I don't take notes"];
const CALENDAR_APPS = ["Google Calendar","Apple Calendar","Outlook Calendar","Notion calendar","Paper planner","I don't use one"];
const TASK_MANAGERS = ["Todoist","Trello","Asana","Notion","Things 3","Apple Reminders","Sticky notes","None"];
const STOP_DOING = ["Procrastinating on assignments","Checking my phone in class","Pulling all-nighters","Missing deadlines","Ignoring emails","Saying yes to everything"];
const START_DOING = ["Building a weekly schedule","Reading emails daily","Networking more","Working out consistently","Sleeping 7+ hours","Journaling"];
const PRIORITIES = ["Academic performance","Career / internship search","Mental health & wellbeing","Social life & relationships","Health & fitness","Financial stability","Personal growth"];
const INDUSTRIES = ["Finance / Banking","Consulting","Technology / Software","Healthcare / Medicine","Law","Marketing / PR","Media / Entertainment","Non-profit / Social impact","Government / Policy","Real estate","Entrepreneurship / Startups","Education","Engineering","Research / Academia","Not sure yet"];
const GRAD_YEARS = ["2025","2026","2027","2028","2029","2030+"];
const INTERNSHIP_STATUSES = ["Currently in an internship","Actively searching","Have offers, deciding","Plan to search next semester","Not focused right now"];
const JOB_SEARCH = ["Updating resume","Reaching out on LinkedIn","Attending career fairs","Applying on Handshake / LinkedIn","Cold emailing","Practicing interviews","Building portfolio / projects"];
const STRESSORS = ["Deadlines and workload","Grades / GPA","Social pressure","Financial stress","Family expectations","Career uncertainty","Relationship issues","Health concerns","Time management","FOMO"];
const TONES = ["Professional and polished","Friendly and conversational","Motivational / coaching","Direct and efficient","Warm but focused"];
const CHECKIN_FREQ = ["Daily morning briefing","Twice a week","Weekly digest","Only when I ask","Real-time — whenever relevant"];
const AGENT_TOPICS = ["Upcoming deadlines","Internship / job opportunities","Unanswered emails","Schedule conflicts","Study reminders","Weekly goal check-ins","Mental health check-ins","Campus events","Networking suggestions"];

// ─── Wizard steps ─────────────────────────────────────────────────────────────

const STEPS = [
  { num: 1, label: "Basics" },
  { num: 2, label: "Academics" },
  { num: 3, label: "Schedule" },
  { num: 4, label: "Social" },
  { num: 5, label: "Wellbeing" },
  { num: 6, label: "Tools" },
  { num: 7, label: "Career" },
  { num: 8, label: "Your Agent" },
];

type FormData = Record<string, string | string[] | File | null>;

const BLANK: FormData = {
  firstName: "", lastName: "", schoolEmail: "", phone: "",
  school: "", year: "", major: "", agentName: "", timezone: "",
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

export default function SetupPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(BLANK);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  function toggle(k: string, val: string) {
    setForm(f => {
      const arr = (f[k] as string[]) || [];
      return { ...f, [k]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] };
    });
  }

  function next() { setStep(s => Math.min(s + 1, STEPS.length)); window.scrollTo(0, 0); }
  function back() { setStep(s => Math.max(s - 1, 1)); window.scrollTo(0, 0); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const body = new FormData();
      const { resumeFile, ...rest } = form;
      body.append("data", JSON.stringify(rest));
      if (resumeFile instanceof File) body.append("resume", resumeFile);
      const res = await fetch("/api/onboard-submit", { method: "POST", body });
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
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--navy)", marginBottom: 12 }}>Your agent build has started.</h1>
            <p style={{ fontSize: 16, color: "rgba(11,23,41,.6)", lineHeight: 1.7, marginBottom: 32 }}>
              We have everything we need. Your team will reach out within 24 hours with your agent&apos;s status.
            </p>
            <a href="/" className="btn-purple">Back to Home</a>
          </div>
        </main>
      </>
    );
  }

  const currentStep = STEPS[step - 1];
  const progress = (step / STEPS.length) * 100;

  return (
    <>
      <Nav />
      <main style={{ paddingTop: 80, minHeight: "100vh", background: "var(--cream2)" }}>

        {/* Progress bar */}
        <div style={{ position: "fixed", top: 72, left: 0, right: 0, zIndex: 99, background: "#fff", borderBottom: "1px solid rgba(11,23,41,.07)", padding: "12px 24px" }}>
          <div style={{ maxWidth: 600, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: ".08em", color: "var(--green)", textTransform: "uppercase" }}>
                Step {step} of {STEPS.length} — {currentStep.label}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(11,23,41,.35)" }}>
                {Math.round(progress)}% complete
              </span>
            </div>
            <div style={{ height: 4, background: "rgba(11,23,41,.08)", borderRadius: 4 }}>
              <div style={{ height: "100%", width: `${progress}%`, background: "var(--green)", borderRadius: 4, transition: "width .4s ease" }} />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ maxWidth: 600, margin: "0 auto", padding: "60px 24px 80px" }}>

          {step === 1 && (
            <WizardStep title="Let's start with the basics." subtitle="Who you are and how to reach you.">
              <Row>
                <Field label="First Name" required><input type="text" placeholder="Jane" value={form.firstName as string} onChange={e => set("firstName", e.target.value)} required /></Field>
                <Field label="Last Name" required><input type="text" placeholder="Smith" value={form.lastName as string} onChange={e => set("lastName", e.target.value)} required /></Field>
              </Row>
              <Field label="School Email" required>
                <input type="email" placeholder="jane@university.edu" value={form.schoolEmail as string} onChange={e => set("schoolEmail", e.target.value)} required />
              </Field>
              <Field label="Phone Number" required>
                <input type="tel" placeholder="+1 (___) ___-____" value={form.phone as string} onChange={e => set("phone", e.target.value)} required />
              </Field>
              <Field label="School" required>
                <input type="text" list="school-suggestions" placeholder="Start typing your school name..." value={form.school as string} onChange={e => set("school", e.target.value)} required />
                <datalist id="school-suggestions">{SCHOOL_SUGGESTIONS.map(s => <option key={s} value={s} />)}</datalist>
              </Field>
              <Row>
                <Field label="Year" required>
                  <select value={form.year as string} onChange={e => set("year", e.target.value)} required>
                    <option value="">Select year...</option>
                    {YEARS.map(y => <option key={y}>{y}</option>)}
                  </select>
                </Field>
                <Field label="Timezone" required>
                  <select value={form.timezone as string} onChange={e => set("timezone", e.target.value)} required>
                    <option value="">Select timezone...</option>
                    {TIMEZONES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </Field>
              </Row>
              <Field label="Major / Field of Study" required>
                <input type="text" placeholder="e.g. Business, Pre-Med, Computer Science" value={form.major as string} onChange={e => set("major", e.target.value)} required />
              </Field>
              <Field label="What would you like to name your agent?">
                <input type="text" placeholder="e.g. Nova, Atlas, Sage, Donna" value={form.agentName as string} onChange={e => set("agentName", e.target.value)} />
              </Field>
            </WizardStep>
          )}

          {step === 2 && (
            <WizardStep title="Tell us about your academic life." subtitle="Classes, how you study, and what challenges you.">
              <Field label="What classes are you currently taking?">
                <textarea rows={3} placeholder="e.g. Intro to Finance, Marketing 301, Statistics II..." value={form.currentClasses as string} onChange={e => set("currentClasses", e.target.value)} />
              </Field>
              <Field label="What LMS does your school use?">
                <select value={form.lmsType as string} onChange={e => set("lmsType", e.target.value)}>
                  <option value="">Select...</option>
                  {["Canvas","Blackboard","Moodle","D2L / Brightspace","Google Classroom","Other / None"].map(l => <option key={l}>{l}</option>)}
                </select>
              </Field>
              <Field label="GPA goal this semester">
                <Chips options={["3.8–4.0","3.5–3.7","3.0–3.4","2.5–2.9","Pass / No fail","Not focused on GPA"]} selected={form.gpaGoal as string} onSelect={v => set("gpaGoal", v)} single />
              </Field>
              <Field label="Biggest academic challenges (pick all that apply)">
                <Chips options={["Time management","Procrastination","Test anxiety","Writing papers","Math / quantitative","Staying organized","Group projects","Reading load","Balancing work & school"]} selected={form.academicChallenges as string[]} onToggle={v => toggle("academicChallenges", v)} />
              </Field>
              <Field label="How do you prefer to study?">
                <Chips options={["Alone","In groups","Both — depends on subject"]} selected={form.studyStyle as string} onSelect={v => set("studyStyle", v)} single />
              </Field>
              <Field label="Study methods you use">
                <Chips options={STUDY_METHODS} selected={form.studyMethods as string[]} onToggle={v => toggle("studyMethods", v)} />
              </Field>
              <Field label="Best time to study">
                <Chips options={STUDY_TIMES} selected={form.studyTime as string} onSelect={v => set("studyTime", v)} single />
              </Field>
              <Field label="Favorite study spot">
                <Chips options={STUDY_LOCATIONS} selected={form.studyLocation as string} onSelect={v => set("studyLocation", v)} single />
              </Field>
            </WizardStep>
          )}

          {step === 3 && (
            <WizardStep title="What does your week look like?" subtitle="Schedule, routine, and time commitments.">
              <Row>
                <Field label="Wake time">
                  <select value={form.wakeTime as string} onChange={e => set("wakeTime", e.target.value)}>
                    <option value="">Select...</option>
                    {["Before 6am","6–7am","7–8am","8–9am","9–10am","10am+","Varies"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Sleep time">
                  <select value={form.sleepTime as string} onChange={e => set("sleepTime", e.target.value)}>
                    <option value="">Select...</option>
                    {["Before 10pm","10–11pm","11pm–12am","12–1am","1–2am","After 2am","Varies"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </Field>
              </Row>
              <Field label="Most productive time of day">
                <Chips options={["Morning","Early afternoon","Late afternoon","Evening","Late night","Varies"]} selected={form.productiveTime as string} onSelect={v => set("productiveTime", v)} single />
              </Field>
              <Field label="Days you have class">
                <Chips options={DAYS} selected={form.classDays as string[]} onToggle={v => toggle("classDays", v)} />
              </Field>
              <Field label="Work / employment status">
                <Chips options={WORK_STATUSES} selected={form.workStatus as string} onSelect={v => set("workStatus", v)} single />
              </Field>
              <Field label="Roughly how many hours per week are committed? (classes + work + activities)">
                <input type="text" placeholder="e.g. 40–50 hours" value={form.weeklyCommitmentHours as string} onChange={e => set("weeklyCommitmentHours", e.target.value)} />
              </Field>
            </WizardStep>
          )}

          {step === 4 && (
            <WizardStep title="Social life & campus involvement." subtitle="Greek life, clubs, community service, and how you spend your time off.">
              <Field label="Greek life?">
                <Chips options={GREEK} selected={form.greekLife as string} onSelect={v => set("greekLife", v)} single />
              </Field>
              <Field label="Sports teams (varsity, club, intramural)?">
                <input type="text" placeholder="e.g. Club soccer, intramural basketball, none" value={form.sportsTeams as string} onChange={e => set("sportsTeams", e.target.value)} />
              </Field>
              <Field label="How socially active are you?">
                <Chips options={["Very active — something every day","A few times a week","Weekends only","Mostly focused on school","I keep to myself"]} selected={form.socialFrequency as string} onSelect={v => set("socialFrequency", v)} single />
              </Field>
              <Field label="Social activities you participate in">
                <Chips options={SOCIAL_ACTIVITIES} selected={form.socialActivities as string[]} onToggle={v => toggle("socialActivities", v)} />
              </Field>
              <Field label="Clubs & organizations you're involved in">
                <Chips options={CLUB_TYPES} selected={form.clubTypes as string[]} onToggle={v => toggle("clubTypes", v)} />
              </Field>
              <Field label="Name any specific clubs or orgs">
                <input type="text" placeholder="e.g. Finance Club, Model UN, Delta Gamma" value={form.specificClubs as string} onChange={e => set("specificClubs", e.target.value)} />
              </Field>
              <Field label="Leadership role?">
                <Chips options={["President / Chair","VP / Officer","Committee lead","General member","Not in any clubs"]} selected={form.leadershipRole as string} onSelect={v => set("leadershipRole", v)} single />
              </Field>
              <Field label="Community service / volunteering?">
                <Chips options={["Yes, regularly","Occasionally","Not right now but interested","No"]} selected={form.volunteering as string} onSelect={v => set("volunteering", v)} single />
              </Field>
              {(form.volunteering === "Yes, regularly" || form.volunteering === "Occasionally") && (
                <>
                  <Field label="Cause areas">
                    <Chips options={CAUSE_AREAS} selected={form.causeAreas as string[]} onToggle={v => toggle("causeAreas", v)} />
                  </Field>
                  <Field label="Organizations you volunteer with">
                    <input type="text" placeholder="e.g. Habitat for Humanity, local food bank" value={form.volunteerOrgs as string} onChange={e => set("volunteerOrgs", e.target.value)} />
                  </Field>
                </>
              )}
            </WizardStep>
          )}

          {step === 5 && (
            <WizardStep title="Mental health & wellbeing." subtitle="Your agent will use this to look out for you — not judge you.">
              <Field label="How would you rate your sleep quality?">
                <Chips options={["Great — I wake up rested","OK — some nights are rough","Poor — I rarely feel rested","Inconsistent"]} selected={form.sleepQuality as string} onSelect={v => set("sleepQuality", v)} single />
              </Field>
              <Field label="Current stress level">
                <Chips options={["1 — Very low","2","3","4","5 — Moderate","6","7","8","9","10 — Extremely high"]} selected={form.stressLevel as string} onSelect={v => set("stressLevel", v)} single />
              </Field>
              <Field label="Signs that you're burning out (if any)">
                <Chips options={BURNOUT_SIGNALS} selected={form.burnoutSignals as string[]} onToggle={v => toggle("burnoutSignals", v)} />
              </Field>
              <Field label="Should your agent flag you when you look overloaded?">
                <Chips options={["Yes — flag me when my schedule is too full","Yes — check in if I haven't responded in a while","No — I'll manage it myself"]} selected={form.agentWellbeingFlag as string} onSelect={v => set("agentWellbeingFlag", v)} single />
              </Field>
              <Field label="Anything off-limits? (topics you prefer your agent not bring up)">
                <textarea rows={2} placeholder="e.g. Please don't ask about my family situation" value={form.wellbeingBoundaries as string} onChange={e => set("wellbeingBoundaries", e.target.value)} />
              </Field>
            </WizardStep>
          )}

          {step === 6 && (
            <WizardStep title="The tools you use every day." subtitle="This helps us connect your agent to the right apps.">
              <Field label="Apps you use regularly">
                <Chips options={APPS_LIST} selected={form.apps as string[]} onToggle={v => toggle("apps", v)} />
              </Field>
              <Field label="Devices you use">
                <Chips options={DEVICES_LIST} selected={form.devices as string[]} onToggle={v => toggle("devices", v)} />
              </Field>
              <Field label="Primary browser">
                <Chips options={BROWSERS} selected={form.browser as string} onSelect={v => set("browser", v)} single />
              </Field>
              <Field label="How do you take notes?">
                <Chips options={NOTE_TOOLS} selected={form.noteTaking as string[]} onToggle={v => toggle("noteTaking", v)} />
              </Field>
              <Field label="Calendar app">
                <Chips options={CALENDAR_APPS} selected={form.calendarApp as string} onSelect={v => set("calendarApp", v)} single />
              </Field>
              <Field label="Task manager">
                <Chips options={TASK_MANAGERS} selected={form.taskManager as string} onSelect={v => set("taskManager", v)} single />
              </Field>
              <Field label="How do you prefer your agent to communicate?">
                <Chips options={["Short and direct — bullet points","Detailed — full explanations","Depends on the situation"]} selected={form.responseStyle as string} onSelect={v => set("responseStyle", v)} single />
              </Field>
              <Field label="Channels you use most">
                <Chips options={CHANNELS} selected={form.preferredChannels as string[]} onToggle={v => toggle("preferredChannels", v)} />
              </Field>
            </WizardStep>
          )}

          {step === 7 && (
            <WizardStep title="Goals & career." subtitle="Where you're headed and what your agent should be working toward.">
              <Field label="Your #1 priority this semester">
                <Chips options={PRIORITIES} selected={form.topPriority as string} onSelect={v => set("topPriority", v)} single />
              </Field>
              <Field label="Academic goal this semester">
                <input type="text" placeholder="e.g. Raise my GPA from 3.2 to 3.5" value={form.academicGoal as string} onChange={e => set("academicGoal", e.target.value)} />
              </Field>
              <Field label="Career goal">
                <input type="text" placeholder="e.g. Land a summer internship in finance" value={form.careerGoal as string} onChange={e => set("careerGoal", e.target.value)} />
              </Field>
              <Field label="Personal goal">
                <input type="text" placeholder="e.g. Work out 4x a week, stop all-nighters" value={form.personalGoal as string} onChange={e => set("personalGoal", e.target.value)} />
              </Field>
              <Field label="Things you want to stop doing">
                <Chips options={STOP_DOING} selected={form.stopDoing as string[]} onToggle={v => toggle("stopDoing", v)} />
              </Field>
              <Field label="Things you want to start doing">
                <Chips options={START_DOING} selected={form.startDoing as string[]} onToggle={v => toggle("startDoing", v)} />
              </Field>
              <Field label="Industry interest">
                <select value={form.industryInterest as string} onChange={e => set("industryInterest", e.target.value)}>
                  <option value="">Select industry...</option>
                  {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                </select>
              </Field>
              <Field label="Expected graduation year">
                <Chips options={GRAD_YEARS} selected={form.graduationYear as string} onSelect={v => set("graduationYear", v)} single />
              </Field>
              <Field label="Internship / job search status">
                <Chips options={INTERNSHIP_STATUSES} selected={form.internshipStatus as string} onSelect={v => set("internshipStatus", v)} single />
              </Field>
              <Field label="Dream company or organization">
                <input type="text" placeholder="e.g. Goldman Sachs, Google, NIH" value={form.dreamCompany as string} onChange={e => set("dreamCompany", e.target.value)} />
              </Field>
              <Field label="Job search activities (select all that apply)">
                <Chips options={JOB_SEARCH} selected={form.jobSearchActivities as string[]} onToggle={v => toggle("jobSearchActivities", v)} />
              </Field>
              <Field label="Biggest stressors right now">
                <Chips options={STRESSORS} selected={form.biggestStressors as string[]} onToggle={v => toggle("biggestStressors", v)} />
              </Field>
              <Field label="What falls through the cracks most often for you?">
                <Chips options={["Emails from professors","Assignment deadlines","Internship applications","Club obligations","Health appointments","Financial aid tasks","Friend plans"]} selected={form.fallsThrough as string} onSelect={v => set("fallsThrough", v)} single />
              </Field>

              {/* Resume Upload */}
              <Field label="Upload your resume (optional — PDF preferred)">
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{ border: "2px dashed rgba(11,23,41,.15)", borderRadius: 8, padding: "20px", textAlign: "center", cursor: "pointer", transition: "border-color .15s" }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--green)")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(11,23,41,.15)")}
                >
                  {form.resumeFile instanceof File ? (
                    <p style={{ fontSize: 14, color: "var(--green)", fontWeight: 600 }}>{(form.resumeFile as File).name}</p>
                  ) : (
                    <>
                      <p style={{ fontSize: 14, color: "rgba(11,23,41,.5)", marginBottom: 4 }}>Click to upload your resume</p>
                      <p style={{ fontSize: 12, color: "rgba(11,23,41,.3)", fontFamily: "var(--font-mono)" }}>PDF, DOC, or DOCX — max 5MB</p>
                    </>
                  )}
                </div>
                <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) setForm(f => ({ ...f, resumeFile: e.target.files![0] })); }} />
              </Field>
            </WizardStep>
          )}

          {step === 8 && (
            <WizardStep title="Last step — your agent's personality." subtitle="How you want it to show up for you every day.">
              <Field label="How should your agent talk to you?">
                <Chips options={TONES} selected={form.agentTone as string} onSelect={v => set("agentTone", v)} single />
              </Field>
              <Field label="How often do you want proactive check-ins?">
                <Chips options={CHECKIN_FREQ} selected={form.checkinFrequency as string} onSelect={v => set("checkinFrequency", v)} single />
              </Field>
              <Field label="What should your agent proactively surface?">
                <Chips options={AGENT_TOPICS} selected={form.agentTopics as string[]} onToggle={v => toggle("agentTopics", v)} />
              </Field>
              <Field label="Any topics that are off-limits for your agent?">
                <textarea rows={2} placeholder="e.g. Don't bring up my relationship status or finances" value={form.agentOffLimits as string} onChange={e => set("agentOffLimits", e.target.value)} />
              </Field>
              <Field label="Anything else your agent should always know about you?">
                <textarea rows={4} placeholder="Habits, preferences, context, quirks. The more you share, the better your agent." value={form.anythingElse as string} onChange={e => set("anythingElse", e.target.value)} />
              </Field>
            </WizardStep>
          )}

          {/* Nav buttons */}
          {error && <p style={{ color: "var(--red)", fontSize: 13, marginBottom: 16 }}>{error}</p>}

          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            {step > 1 && (
              <button type="button" onClick={back} style={{ flex: "0 0 auto", padding: "14px 24px", borderRadius: 4, border: "1.5px solid rgba(11,23,41,.15)", background: "transparent", fontSize: 13, fontWeight: 700, fontFamily: "var(--font-mono)", letterSpacing: ".06em", color: "rgba(11,23,41,.6)", cursor: "pointer" }}>
                ← Back
              </button>
            )}
            {step < STEPS.length ? (
              <button type="button" className="btn-purple" style={{ flex: 1, fontSize: 14 }} onClick={next}>
                Continue →
              </button>
            ) : (
              <button type="submit" className="btn-purple" style={{ flex: 1, fontSize: 14 }} disabled={loading}>
                {loading ? "Submitting..." : "Submit & Start My Build →"}
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
          border: 1.5px solid rgba(11,23,41,.12);
          border-radius: 6px; font-size: 15px;
          font-family: inherit; color: var(--navy);
          background: #fff; outline: none;
          transition: border-color .15s;
          appearance: none; -webkit-appearance: none;
        }
        select { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%230b1220' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; padding-right: 36px; }
        input:focus, select:focus, textarea:focus { border-color: var(--green); box-shadow: 0 0 0 3px rgba(61,139,61,.08); }
        input::placeholder, textarea::placeholder { color: rgba(11,23,41,.3); }
        textarea { resize: vertical; }
        button:disabled { opacity: .5; cursor: not-allowed; }
      `}</style>
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function WizardStep({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--navy)", marginBottom: 8, lineHeight: 1.25 }}>{title}</h1>
        <p style={{ fontSize: 15, color: "rgba(11,23,41,.5)", lineHeight: 1.6 }}>{subtitle}</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {children}
      </div>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>{children}</div>;
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(11,23,41,.45)", marginBottom: 8 }}>
        {label}{required && <span style={{ color: "var(--green)", marginLeft: 3 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function Chips({ options, selected, onSelect, onToggle, single }: {
  options: string[];
  selected: string | string[];
  onSelect?: (v: string) => void;
  onToggle?: (v: string) => void;
  single?: boolean;
}) {
  const isActive = (o: string) => single ? selected === o : (selected as string[]).includes(o);
  const handleClick = (o: string) => single ? onSelect?.(o) : onToggle?.(o);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {options.map(o => (
        <span
          key={o}
          onClick={() => handleClick(o)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "8px 16px", borderRadius: 99, cursor: "pointer",
            fontSize: 13, lineHeight: 1.3, transition: "all .15s",
            border: isActive(o) ? "1.5px solid var(--green)" : "1.5px solid rgba(11,23,41,.12)",
            background: isActive(o) ? "rgba(61,139,61,.07)" : "#fff",
            color: isActive(o) ? "var(--green)" : "var(--navy)",
            fontWeight: isActive(o) ? 600 : 400,
          }}
        >
          {isActive(o) && !single && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>}
          {o}
        </span>
      ))}
    </div>
  );
}
