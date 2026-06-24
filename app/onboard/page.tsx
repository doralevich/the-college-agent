"use client";
import { useState, useRef } from "react";
import Nav from "../components/Nav";

// ─── Option lists ─────────────────────────────────────────────────────────────

const YEARS = ["Freshman (1st Year)","Sophomore (2nd Year)","Junior (3rd Year)","Senior (4th Year)","Graduate Student","Other"];
const TIMEZONES = ["Eastern Time (ET)","Central Time (CT)","Mountain Time (MT)","Pacific Time (PT)","Alaska Time (AKT)","Hawaii Time (HST)","London (GMT/BST)","Central Europe (CET)","India (IST)","Other"];
const LMS_OPTIONS = ["Canvas","Blackboard","Moodle","D2L / Brightspace","Google Classroom","Other / None"];
const ACADEMIC_CHALLENGES = ["Time management","Procrastination","Test anxiety","Writing papers","Math / quantitative work","Staying organized","Group projects","Heavy reading load","Balancing work & school","Participating in class"];
const GPA_GOALS = ["3.8 – 4.0","3.5 – 3.7","3.0 – 3.4","2.5 – 2.9","Pass / No fail","Not focused on GPA right now"];
const STUDY_STYLES = ["Alone","In groups","Both, depends on the subject"];
const STUDY_METHODS = ["Flashcards","Rewriting notes","Practice tests","YouTube / videos","Tutoring","Study guides","Pomodoro technique","Mind maps","Working through problems","Reading the textbook"];
const STUDY_TIMES = ["Early morning (before 8am)","Morning (8am – 12pm)","Afternoon (12pm – 5pm)","Evening (5pm – 9pm)","Late night (9pm+)","Varies day to day"];
const STUDY_LOCATIONS = ["Dorm room / bedroom","Library","Coffee shop","Campus study lounge","Home","Outdoors / anywhere","Varies"];
const SESSION_LENGTHS = ["Under 30 minutes","30 – 60 minutes","1 – 2 hours","2 – 3 hours","3+ hours","Varies"];
const TIMES_OF_DAY = ["Before 6am","6 – 7am","7 – 8am","8 – 9am","9 – 10am","10am – 12pm","12 – 2pm","2 – 4pm","4 – 6pm","6 – 8pm","8 – 10pm","10pm – 12am","After midnight","Varies"];
const SLEEP_TIMES = ["Before 9pm","9 – 10pm","10 – 11pm","11pm – 12am","12 – 1am","1 – 2am","After 2am","Varies"];
const WORK_STATUSES = ["Not working","Part-time job (on campus)","Part-time job (off campus)","Full-time job","Internship or co-op","Freelance / self-employed"];
const GREEK = ["Yes, fraternity","Yes, sorority","No","Interested / currently rushing"];
const SOCIAL_ACTIVITIES = ["Parties / social events","Bars / nightlife","Concerts & shows","Gaming","Intramural sports","Outdoor recreation","Dating / dating apps","Heavy social media user","Road trips / travel","Dining out frequently"];
const SOCIAL_FREQ = ["Very active: something almost every day","A few times a week","Mostly weekends","Occasional, mostly focused on school","Rarely, I keep to myself"];
const CLUB_TYPES = ["Academic / honor society","Cultural / international","Sports / athletics","Arts / performance","Pre-professional (law, med, business)","Political / advocacy","Religious / spiritual","Community service","Media / journalism","STEM / research","Entrepreneurship"];
const LEADERSHIP_ROLES = ["President / Chair","Vice President / Officer","Committee lead","General member","Not currently in any clubs"];
const CLUB_TIME = ["Under 2 hours / week","2 – 5 hours / week","5 – 10 hours / week","10+ hours / week"];
const VOLUNTEERING = ["Yes, regularly","Occasionally","Not right now, but I'm interested","No"];
const CAUSE_AREAS = ["Education / tutoring","Environmental","Hunger / homelessness","Healthcare / mental health","Animal welfare","Social justice","Faith-based","International / global causes"];
const SLEEP_QUALITY = ["Great, I wake up feeling rested","OK, some nights are rough","Poor, I rarely feel rested","Very inconsistent"];
const STRESS_LEVELS = ["1: Very low","2","3","4","5: Moderate","6","7","8","9","10: Extremely high"];
const BURNOUT_SIGNALS = ["Skipping class","Procrastinating more than usual","Withdrawing from friends","Trouble sleeping","Loss of motivation","Emotional exhaustion","Irritability or mood swings","Overeating or undereating"];
const COMM_STYLES = ["Formal: I prefer structured, professional writing","Casual: conversational and relaxed","It depends on who I'm writing to"];
const CHANNELS = ["Email","Text / SMS","Telegram","Discord","Slack","WhatsApp","Phone call"];
const RESPONSE_STYLES = ["Short and direct: bullet points, no fluff","Detailed: full context and explanation","Depends on the situation"];
const EMAIL_RESPONSE = ["Same day","Within 24 hours","Within 48 hours","A few days is fine","I tend to let emails sit"];
const APPS_LIST = ["Notion","Google Docs","Microsoft Word","Obsidian","Evernote","OneNote","Trello","Asana","Todoist","Things 3","Slack","Discord","Telegram","LinkedIn","Handshake","Zoom","Microsoft Teams","Gmail","Outlook","ChatGPT","Copilot","Spotify"];
const DEVICES = ["MacBook","Windows laptop","iPad / tablet","iPhone","Android phone","Desktop PC","Chromebook"];
const BROWSERS = ["Chrome","Safari","Firefox","Edge","Arc","Brave","Other"];
const NOTE_TOOLS = ["Handwritten notes","Notion","Google Docs","Microsoft Word","Obsidian","Apple Notes","Typed directly in class","I don't take notes"];
const CALENDAR_APPS = ["Google Calendar","Apple Calendar","Outlook Calendar","Notion calendar","Paper / physical planner","I don't use a calendar"];
const TASK_MANAGERS = ["Todoist","Trello","Asana","Notion","Things 3","Apple Reminders","Google Tasks","Sticky notes","None"];
const STOP_DOING = ["Procrastinating on assignments","Checking my phone in class","Pulling all-nighters","Missing deadlines","Ignoring emails for days","Saying yes to everything","Skipping meals"];
const START_DOING = ["Building a weekly schedule","Checking emails daily","Networking more","Working out consistently","Getting 7+ hours of sleep","Meal prepping","Journaling"];
const PRIORITIES = ["Academic performance","Career / internship search","Mental health & wellbeing","Social life & relationships","Health & fitness","Financial stability","Personal growth"];
const INDUSTRIES = ["Finance / Banking","Consulting","Technology / Software","Healthcare / Medicine","Law","Marketing / PR","Media / Entertainment","Non-profit / Social impact","Government / Policy","Real estate","Entrepreneurship / Startups","Education","Engineering","Research / Academia","Not sure yet"];
const GRAD_YEARS = ["2025","2026","2027","2028","2029","2030+"];
const INTERNSHIP_STATUS = ["Currently in an internship","Actively searching right now","Have offers, deciding","Plan to search next semester","Not focused on internships right now"];
const JOB_SEARCH = ["Updating my resume","Reaching out on LinkedIn","Attending career fairs","Applying on Handshake or LinkedIn","Sending cold emails","Practicing interview questions","Building a portfolio or projects","Working with the career center"];
const STRESSORS = ["Deadlines and workload","Grades / GPA pressure","Social pressure","Financial stress","Family expectations","Career uncertainty","Relationship issues","Health concerns","Poor time management","FOMO"];
const FALLS_THROUGH = ["Emails from professors or advisors","Assignment deadlines","Internship or job applications","Advisor meetings","Club or organization obligations","Friend plans","Personal health appointments","Financial aid tasks"];
const HANDLE_FIRST = ["Email drafting and follow-ups","Deadline tracking and reminders","Internship / job search support","Study scheduling","Weekly planning briefings","Meeting and class prep","General task management"];
const TONES = ["Professional and polished","Friendly and conversational","Motivational / coaching style","Short and direct: just give me the facts","Warm but focused"];
const CHECKIN_FREQ = ["Daily morning briefing","Twice a week","Weekly digest only","Only when I ask","Real-time, whenever something comes up"];
const AGENT_TOPICS = ["Upcoming deadlines","Internship / job opportunities","Unanswered emails","Schedule conflicts","Study reminders","Weekly goal check-ins","Mental health check-ins","Campus events","Networking suggestions"];

// ─── Wizard config ────────────────────────────────────────────────────────────

const STEPS = [
  { num: 1, label: "About You" },
  { num: 2, label: "Academic Life" },
  { num: 3, label: "Schedule & Routine" },
  { num: 4, label: "Social & Campus Life" },
  { num: 5, label: "Mental Health & Wellbeing" },
  { num: 6, label: "Tools & Communication" },
  { num: 7, label: "Goals & Career" },
  { num: 8, label: "Your Agent" },
];

type FD = Record<string, string | string[] | File | null>;

const BLANK: FD = {
  firstName:"", lastName:"", schoolEmail:"", phone:"", school:"", year:"", major:"", agentName:"", timezone:"",
  currentClasses:"", professors:"", lmsType:"", classFormats:[], academicChallenges:[], gpaGoal:"",
  studyStyle:"", studyMethods:[], studyTime:"", studyLocation:"", studySessionLength:"",
  wakeTime:"", sleepTime:"", productiveTime:"", classDays:[], workStatus:"", weeklyHours:"",
  greekLife:"", sportsTeams:"", socialFrequency:"", socialActivities:[],
  clubTypes:[], specificClubs:"", leadershipRole:"", clubTimeCommitment:"",
  volunteering:"", causeAreas:[], volunteerOrgs:"",
  sleepQuality:"", stressLevel:"", burnoutSignals:[], agentWellbeingFlag:"", wellbeingBoundaries:"",
  commStyle:"", preferredChannels:[], responseStyle:"", emailResponseTime:"",
  apps:[], devices:[], browser:"", noteTaking:[], calendarApp:"", taskManager:"",
  topPriority:"", academicGoal:"", careerGoal:"", personalGoal:"", stopDoing:[], startDoing:[],
  industryInterest:"", graduationYear:"", internshipStatus:"", resumeReady:"", jobSearchActivities:[], dreamCompany:"",
  biggestStressors:[], fallsThrough:"", agentHandleFirst:"", anythingElse:"",
  agentTone:"", checkinFrequency:"", agentTopics:[], agentOffLimits:"",
  resumeFile: null,
};

export default function OnboardPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FD>(BLANK);
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
  function next() { setStep(s => Math.min(s + 1, STEPS.length)); window.scrollTo(0,0); }
  function back() { setStep(s => Math.max(s - 1, 1)); window.scrollTo(0,0); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const body = new FormData();
      const { resumeFile, ...rest } = form;
      body.append("data", JSON.stringify(rest));
      if (resumeFile instanceof File) body.append("resume", resumeFile);
      const res = await fetch("/api/onboard-submit", { method: "POST", body });
      if (!res.ok) throw new Error();
      setSubmitted(true);
    } catch { setError("Something went wrong. Please try again."); }
    finally { setLoading(false); }
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
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--navy)", marginBottom: 12 }}>You&apos;re all set.</h1>
            <p style={{ fontSize: 16, color: "rgba(11,23,41,.6)", lineHeight: 1.7, marginBottom: 32 }}>
              We received everything we need to build your agent. Your team will be in touch within 24 hours.
            </p>
            <a href="/dashboard" className="btn-purple">Back to Dashboard</a>
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

        {/* Progress bar */}
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

          {/* ── Step 1: About You ── */}
          {step === 1 && (
            <Section title="Tell us about yourself." sub="This helps us personalize your agent from day one.">
              <TwoCol>
                <Field label="First Name" required>
                  <input type="text" placeholder="Jane" value={form.firstName as string} onChange={e => set("firstName", e.target.value)} required />
                </Field>
                <Field label="Last Name" required>
                  <input type="text" placeholder="Smith" value={form.lastName as string} onChange={e => set("lastName", e.target.value)} required />
                </Field>
              </TwoCol>
              <Field label="School Email" required>
                <input type="email" placeholder="jane@university.edu" value={form.schoolEmail as string} onChange={e => set("schoolEmail", e.target.value)} required />
              </Field>
              <Field label="Phone Number" required>
                <input type="tel" placeholder="+1 (___) ___-____" value={form.phone as string} onChange={e => set("phone", e.target.value)} required />
              </Field>
              <Field label="School" required>
                <input type="text" placeholder="Enter your school name" value={form.school as string} onChange={e => set("school", e.target.value)} required />
              </Field>
              <TwoCol>
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
              </TwoCol>
              <Field label="Major / Field of Study" required>
                <input type="text" placeholder="e.g. Business, Pre-Med, Computer Science" value={form.major as string} onChange={e => set("major", e.target.value)} required />
              </Field>
              <Field label="What would you like to name your agent?">
                <input type="text" placeholder="e.g. Nova, Atlas, Sage, Donna" value={form.agentName as string} onChange={e => set("agentName", e.target.value)} />
              </Field>
            </Section>
          )}

          {/* ── Step 2: Academic Life ── */}
          {step === 2 && (
            <Section title="Academic life." sub="Your classes, study habits, and biggest challenges.">
              <Field label="What classes are you currently taking?">
                <textarea rows={3} placeholder="e.g. Intro to Finance, Marketing 301, Statistics II..." value={form.currentClasses as string} onChange={e => set("currentClasses", e.target.value)} />
              </Field>
              <Field label="What LMS does your school use?">
                <RadioGrid options={LMS_OPTIONS} name="lmsType" selected={form.lmsType as string} onSelect={v => set("lmsType", v)} cols={2} />
              </Field>
              <Field label="GPA goal this semester">
                <RadioGrid options={GPA_GOALS} name="gpaGoal" selected={form.gpaGoal as string} onSelect={v => set("gpaGoal", v)} cols={2} />
              </Field>
              <Field label="Biggest academic challenges (check all that apply)">
                <CheckGrid options={ACADEMIC_CHALLENGES} selected={form.academicChallenges as string[]} onToggle={v => toggle("academicChallenges", v)} cols={2} />
              </Field>
              <Field label="How do you prefer to study?">
                <RadioGrid options={STUDY_STYLES} name="studyStyle" selected={form.studyStyle as string} onSelect={v => set("studyStyle", v)} cols={1} />
              </Field>
              <Field label="Study methods you use (check all that apply)">
                <CheckGrid options={STUDY_METHODS} selected={form.studyMethods as string[]} onToggle={v => toggle("studyMethods", v)} cols={2} />
              </Field>
              <Field label="Best time of day to study">
                <RadioGrid options={STUDY_TIMES} name="studyTime" selected={form.studyTime as string} onSelect={v => set("studyTime", v)} cols={2} />
              </Field>
              <Field label="Favorite study location">
                <RadioGrid options={STUDY_LOCATIONS} name="studyLocation" selected={form.studyLocation as string} onSelect={v => set("studyLocation", v)} cols={2} />
              </Field>
              <Field label="Typical study session length">
                <RadioGrid options={SESSION_LENGTHS} name="studySessionLength" selected={form.studySessionLength as string} onSelect={v => set("studySessionLength", v)} cols={2} />
              </Field>
            </Section>
          )}

          {/* ── Step 3: Schedule & Routine ── */}
          {step === 3 && (
            <Section title="Schedule & routine." sub="Your weekly structure helps your agent plan around you.">
              <TwoCol>
                <Field label="What time do you usually wake up?">
                  <select value={form.wakeTime as string} onChange={e => set("wakeTime", e.target.value)}>
                    <option value="">Select...</option>
                    {TIMES_OF_DAY.map(t => <option key={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="What time do you usually go to sleep?">
                  <select value={form.sleepTime as string} onChange={e => set("sleepTime", e.target.value)}>
                    <option value="">Select...</option>
                    {SLEEP_TIMES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </Field>
              </TwoCol>
              <Field label="When are you most productive?">
                <RadioGrid options={["Morning","Early afternoon","Late afternoon","Evening","Late night","Varies"]} name="productiveTime" selected={form.productiveTime as string} onSelect={v => set("productiveTime", v)} cols={3} />
              </Field>
              <Field label="Which days do you have class? (check all that apply)">
                <CheckGrid options={["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]} selected={form.classDays as string[]} onToggle={v => toggle("classDays", v)} cols={4} />
              </Field>
              <Field label="Work or employment status">
                <RadioGrid options={WORK_STATUSES} name="workStatus" selected={form.workStatus as string} onSelect={v => set("workStatus", v)} cols={2} />
              </Field>
              <Field label="Roughly how many hours per week are you committed? (classes + work + activities)">
                <input type="text" placeholder="e.g. 40 – 50 hours" value={form.weeklyHours as string} onChange={e => set("weeklyHours", e.target.value)} />
              </Field>
            </Section>
          )}

          {/* ── Step 4: Social & Campus Life ── */}
          {step === 4 && (
            <Section title="Social & campus life." sub="Your involvement helps your agent understand how you spend your time.">
              <Field label="Greek life?">
                <RadioGrid options={GREEK} name="greekLife" selected={form.greekLife as string} onSelect={v => set("greekLife", v)} cols={2} />
              </Field>
              <Field label="Sports teams (varsity, club, or intramural)?">
                <input type="text" placeholder="e.g. Club soccer, intramural basketball, or leave blank" value={form.sportsTeams as string} onChange={e => set("sportsTeams", e.target.value)} />
              </Field>
              <Field label="How socially active are you?">
                <RadioGrid options={SOCIAL_FREQ} name="socialFreq" selected={form.socialFrequency as string} onSelect={v => set("socialFrequency", v)} cols={1} />
              </Field>
              <Field label="Social activities you participate in (check all that apply)">
                <CheckGrid options={SOCIAL_ACTIVITIES} selected={form.socialActivities as string[]} onToggle={v => toggle("socialActivities", v)} cols={2} />
              </Field>
              <Field label="Clubs & organizations (check all that apply)">
                <CheckGrid options={CLUB_TYPES} selected={form.clubTypes as string[]} onToggle={v => toggle("clubTypes", v)} cols={2} />
              </Field>
              <Field label="Name any specific clubs or orgs you're in">
                <input type="text" placeholder="e.g. Finance Club, Model UN, Delta Gamma" value={form.specificClubs as string} onChange={e => set("specificClubs", e.target.value)} />
              </Field>
              <Field label="Your leadership role">
                <RadioGrid options={LEADERSHIP_ROLES} name="leadershipRole" selected={form.leadershipRole as string} onSelect={v => set("leadershipRole", v)} cols={2} />
              </Field>
              <Field label="Club / org time commitment per week">
                <RadioGrid options={CLUB_TIME} name="clubTime" selected={form.clubTimeCommitment as string} onSelect={v => set("clubTimeCommitment", v)} cols={2} />
              </Field>
              <Field label="Community service or volunteering?">
                <RadioGrid options={VOLUNTEERING} name="volunteering" selected={form.volunteering as string} onSelect={v => set("volunteering", v)} cols={2} />
              </Field>
              {(form.volunteering === "Yes, regularly" || form.volunteering === "Occasionally") && (
                <>
                  <Field label="Cause areas (check all that apply)">
                    <CheckGrid options={CAUSE_AREAS} selected={form.causeAreas as string[]} onToggle={v => toggle("causeAreas", v)} cols={2} />
                  </Field>
                  <Field label="Organizations you volunteer with">
                    <input type="text" placeholder="e.g. Habitat for Humanity, local food bank" value={form.volunteerOrgs as string} onChange={e => set("volunteerOrgs", e.target.value)} />
                  </Field>
                </>
              )}
            </Section>
          )}

          {/* ── Step 5: Mental Health & Wellbeing ── */}
          {step === 5 && (
            <Section title="Mental health & wellbeing." sub="Your agent will use this to look out for you, not judge you.">
              <Field label="How would you rate your sleep quality?">
                <RadioGrid options={SLEEP_QUALITY} name="sleepQuality" selected={form.sleepQuality as string} onSelect={v => set("sleepQuality", v)} cols={1} />
              </Field>
              <Field label="Current stress level (1 = very low, 10 = extremely high)">
                <RadioGrid options={STRESS_LEVELS} name="stressLevel" selected={form.stressLevel as string} onSelect={v => set("stressLevel", v)} cols={5} />
              </Field>
              <Field label="Signs that you're burning out (check any that apply)">
                <CheckGrid options={BURNOUT_SIGNALS} selected={form.burnoutSignals as string[]} onToggle={v => toggle("burnoutSignals", v)} cols={2} />
              </Field>
              <Field label="Should your agent flag you when you look overloaded?">
                <RadioGrid options={["Yes, flag me when my schedule looks too full","Yes, check in if I haven't responded in a while","No, I'll manage it myself"]} name="agentWellbeingFlag" selected={form.agentWellbeingFlag as string} onSelect={v => set("agentWellbeingFlag", v)} cols={1} />
              </Field>
              <Field label="Anything your agent should never bring up? (optional)">
                <textarea rows={2} placeholder="e.g. Please don't ask about my family situation" value={form.wellbeingBoundaries as string} onChange={e => set("wellbeingBoundaries", e.target.value)} />
              </Field>
            </Section>
          )}

          {/* ── Step 6: Tools & Communication ── */}
          {step === 6 && (
            <Section title="Tools & communication." sub="This helps us connect your agent to the right apps and match your style.">
              <Field label="Apps you use regularly (check all that apply)">
                <CheckGrid options={APPS_LIST} selected={form.apps as string[]} onToggle={v => toggle("apps", v)} cols={3} />
              </Field>
              <Field label="Devices you use (check all that apply)">
                <CheckGrid options={DEVICES} selected={form.devices as string[]} onToggle={v => toggle("devices", v)} cols={3} />
              </Field>
              <Field label="Primary browser">
                <RadioGrid options={BROWSERS} name="browser" selected={form.browser as string} onSelect={v => set("browser", v)} cols={3} />
              </Field>
              <Field label="How do you take notes? (check all that apply)">
                <CheckGrid options={NOTE_TOOLS} selected={form.noteTaking as string[]} onToggle={v => toggle("noteTaking", v)} cols={2} />
              </Field>
              <Field label="Calendar app">
                <RadioGrid options={CALENDAR_APPS} name="calendarApp" selected={form.calendarApp as string} onSelect={v => set("calendarApp", v)} cols={2} />
              </Field>
              <Field label="Task manager">
                <RadioGrid options={TASK_MANAGERS} name="taskManager" selected={form.taskManager as string} onSelect={v => set("taskManager", v)} cols={3} />
              </Field>
              <Field label="How do you naturally write?">
                <RadioGrid options={COMM_STYLES} name="commStyle" selected={form.commStyle as string} onSelect={v => set("commStyle", v)} cols={1} />
              </Field>
              <Field label="Channels you use most (check all that apply)">
                <CheckGrid options={CHANNELS} selected={form.preferredChannels as string[]} onToggle={v => toggle("preferredChannels", v)} cols={3} />
              </Field>
              <Field label="How do you want your agent to respond?">
                <RadioGrid options={RESPONSE_STYLES} name="responseStyle" selected={form.responseStyle as string} onSelect={v => set("responseStyle", v)} cols={1} />
              </Field>
              <Field label="Your typical email response time">
                <RadioGrid options={EMAIL_RESPONSE} name="emailResponseTime" selected={form.emailResponseTime as string} onSelect={v => set("emailResponseTime", v)} cols={2} />
              </Field>
            </Section>
          )}

          {/* ── Step 7: Goals & Career ── */}
          {step === 7 && (
            <Section title="Goals & career." sub="What your agent should be working toward on your behalf.">
              <Field label="Your #1 priority this semester">
                <RadioGrid options={PRIORITIES} name="topPriority" selected={form.topPriority as string} onSelect={v => set("topPriority", v)} cols={2} />
              </Field>
              <Field label="Academic goal this semester">
                <input type="text" placeholder="e.g. Raise my GPA from 3.2 to 3.5" value={form.academicGoal as string} onChange={e => set("academicGoal", e.target.value)} />
              </Field>
              <Field label="Career goal">
                <input type="text" placeholder="e.g. Land a summer internship in finance" value={form.careerGoal as string} onChange={e => set("careerGoal", e.target.value)} />
              </Field>
              <Field label="Personal goal">
                <input type="text" placeholder="e.g. Work out 4x a week, stop pulling all-nighters" value={form.personalGoal as string} onChange={e => set("personalGoal", e.target.value)} />
              </Field>
              <Field label="Things you want to stop doing (check all that apply)">
                <CheckGrid options={STOP_DOING} selected={form.stopDoing as string[]} onToggle={v => toggle("stopDoing", v)} cols={2} />
              </Field>
              <Field label="Things you want to start doing (check all that apply)">
                <CheckGrid options={START_DOING} selected={form.startDoing as string[]} onToggle={v => toggle("startDoing", v)} cols={2} />
              </Field>
              <Field label="Industry you're most interested in">
                <select value={form.industryInterest as string} onChange={e => set("industryInterest", e.target.value)}>
                  <option value="">Select industry...</option>
                  {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                </select>
              </Field>
              <Field label="Expected graduation year">
                <RadioGrid options={GRAD_YEARS} name="graduationYear" selected={form.graduationYear as string} onSelect={v => set("graduationYear", v)} cols={3} />
              </Field>
              <Field label="Internship / job search status">
                <RadioGrid options={INTERNSHIP_STATUS} name="internshipStatus" selected={form.internshipStatus as string} onSelect={v => set("internshipStatus", v)} cols={1} />
              </Field>
              <Field label="Is your resume ready to send?">
                <RadioGrid options={["Yes, updated and ready to go","Needs updating","I don't have one yet"]} name="resumeReady" selected={form.resumeReady as string} onSelect={v => set("resumeReady", v)} cols={1} />
              </Field>
              <Field label="Job search activities you're doing (check all that apply)">
                <CheckGrid options={JOB_SEARCH} selected={form.jobSearchActivities as string[]} onToggle={v => toggle("jobSearchActivities", v)} cols={2} />
              </Field>
              <Field label="Dream company or organization">
                <input type="text" placeholder="e.g. Goldman Sachs, Google, Deloitte, NIH" value={form.dreamCompany as string} onChange={e => set("dreamCompany", e.target.value)} />
              </Field>
              <Field label="Biggest stressors right now (check all that apply)">
                <CheckGrid options={STRESSORS} selected={form.biggestStressors as string[]} onToggle={v => toggle("biggestStressors", v)} cols={2} />
              </Field>
              <Field label="What falls through the cracks most often for you?">
                <RadioGrid options={FALLS_THROUGH} name="fallsThrough" selected={form.fallsThrough as string} onSelect={v => set("fallsThrough", v)} cols={2} />
              </Field>
              <Field label="What do you want your agent to handle first?">
                <RadioGrid options={HANDLE_FIRST} name="agentHandleFirst" selected={form.agentHandleFirst as string} onSelect={v => set("agentHandleFirst", v)} cols={2} />
              </Field>

              {/* Resume Upload */}
              <Field label="Upload your resume (optional, PDF preferred)">
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{ border: "2px dashed rgba(11,23,41,.15)", borderRadius: 8, padding: "24px", textAlign: "center", cursor: "pointer", background: "#fff", transition: "border-color .15s" }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--green)")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(11,23,41,.15)")}
                >
                  {form.resumeFile instanceof File ? (
                    <p style={{ fontSize: 14, color: "var(--green)", fontWeight: 600 }}>{(form.resumeFile as File).name}</p>
                  ) : (
                    <>
                      <p style={{ fontSize: 14, color: "rgba(11,23,41,.5)", marginBottom: 4 }}>Click to upload your resume</p>
                      <p style={{ fontSize: 12, color: "rgba(11,23,41,.3)", fontFamily: "var(--font-mono)" }}>PDF, DOC, or DOCX, max 5MB</p>
                    </>
                  )}
                </div>
                <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) setForm(f => ({ ...f, resumeFile: e.target.files![0] })); }} />
              </Field>
            </Section>
          )}

          {/* ── Step 8: Your Agent ── */}
          {step === 8 && (
            <Section title="Your agent's personality." sub="The last step: how you want it to show up for you every day.">
              <Field label="How should your agent talk to you?">
                <RadioGrid options={TONES} name="agentTone" selected={form.agentTone as string} onSelect={v => set("agentTone", v)} cols={1} />
              </Field>
              <Field label="How often do you want proactive check-ins?">
                <RadioGrid options={CHECKIN_FREQ} name="checkinFrequency" selected={form.checkinFrequency as string} onSelect={v => set("checkinFrequency", v)} cols={1} />
              </Field>
              <Field label="What should your agent proactively surface? (check all that apply)">
                <CheckGrid options={AGENT_TOPICS} selected={form.agentTopics as string[]} onToggle={v => toggle("agentTopics", v)} cols={2} />
              </Field>
              <Field label="Any topics that are off-limits for your agent? (optional)">
                <textarea rows={2} placeholder="e.g. Don't bring up my relationship status or finances" value={form.agentOffLimits as string} onChange={e => set("agentOffLimits", e.target.value)} />
              </Field>
              <Field label="Anything else your agent should always know about you?">
                <textarea rows={4} placeholder="Habits, preferences, context, quirks, anything that didn't fit above. The more you share, the better your agent." value={form.anythingElse as string} onChange={e => set("anythingElse", e.target.value)} />
              </Field>
            </Section>
          )}

          {/* Nav */}
          {error && <p style={{ color: "var(--red)", fontSize: 13, marginBottom: 16 }}>{error}</p>}
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            {step > 1 && (
              <button type="button" onClick={back} style={{ flexShrink: 0, padding: "14px 24px", borderRadius: 4, border: "1.5px solid rgba(11,23,41,.15)", background: "transparent", fontSize: 13, fontWeight: 700, fontFamily: "var(--font-mono)", letterSpacing: ".06em", color: "rgba(11,23,41,.6)", cursor: "pointer" }}>
                ← Back
              </button>
            )}
            {step < STEPS.length ? (
              <button type="button" className="btn-purple" style={{ flex: 1, fontSize: 14 }} onClick={next}>Continue →</button>
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
      `}</style>
    </>
  );
}

// ─── Layout components ────────────────────────────────────────────────────────

function Section({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
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

function TwoCol({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>{children}</div>;
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(11,23,41,.45)", marginBottom: 10 }}>
        {label}{required && <span style={{ color: "var(--green)", marginLeft: 3 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

// ─── Radio grid ───────────────────────────────────────────────────────────────

function RadioGrid({ options, name, selected, onSelect, cols = 2 }: {
  options: string[]; name: string; selected: string;
  onSelect: (v: string) => void; cols?: number;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: "8px 16px" }}>
      {options.map(o => (
        <label key={o} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "4px 0" }}>
          <input
            type="radio" name={name} value={o} checked={selected === o}
            onChange={() => onSelect(o)}
            style={{ width: 16, height: 16, accentColor: "var(--green)", flexShrink: 0, cursor: "pointer" }}
          />
          <span style={{ fontSize: 14, color: "var(--navy)", lineHeight: 1.4 }}>{o}</span>
        </label>
      ))}
    </div>
  );
}

// ─── Checkbox grid ────────────────────────────────────────────────────────────

function CheckGrid({ options, selected, onToggle, cols = 2 }: {
  options: string[]; selected: string[];
  onToggle: (v: string) => void; cols?: number;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: "8px 16px" }}>
      {options.map(o => (
        <label key={o} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "4px 0" }}>
          <input
            type="checkbox" checked={selected.includes(o)}
            onChange={() => onToggle(o)}
            style={{ width: 16, height: 16, accentColor: "var(--green)", flexShrink: 0, cursor: "pointer" }}
          />
          <span style={{ fontSize: 14, color: "var(--navy)", lineHeight: 1.4 }}>{o}</span>
        </label>
      ))}
    </div>
  );
}
