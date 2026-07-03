// The "make your agent perfect" checklist: everything a student can feed their agent,
// grouped by theme. Item keys are stored in checklist_items.item_key, so treat them as
// stable identifiers — rename labels freely, never reuse a key for a different meaning.

export type ChecklistItem = {
  key: string;
  label: string;
  // One line under the label: how to actually do it (usually: say it in Chat).
  hint: string;
};

export type ChecklistGroup = {
  title: string;
  items: ChecklistItem[];
};

export const CHECKLIST_GROUPS: ChecklistGroup[] = [
  {
    title: "Classes and academics",
    items: [
      { key: "classes", label: "Add your full class list", hint: "Names, days, times, professors. It's part of your intake below." },
      { key: "syllabi", label: "Upload each course syllabus", hint: "Drag the PDF into Chat and your agent pulls out every date that matters." },
      { key: "quizzes", label: "Load your quiz schedule", hint: "Tell your agent every quiz you know about, per class." },
      { key: "tests", label: "Load your test and exam schedule", hint: "Midterms and finals included, so study plans start early." },
      { key: "deadlines", label: "Add assignment deadlines", hint: "Papers, projects, problem sets. Anything with a due date." },
      { key: "grade_goals", label: "Share your grade goals per class", hint: "Your agent tracks effort against the grade you want." },
      { key: "office_hours", label: "Add your professors' office hours", hint: "So your agent can suggest the right time to get help." },
    ],
  },
  {
    title: "Key dates",
    items: [
      { key: "semester_dates", label: "Semester start and end dates", hint: "The frame everything else hangs on." },
      { key: "holidays", label: "Holidays and school breaks", hint: "Long weekends, spring break, reading days." },
      { key: "add_drop", label: "Add/drop and registration deadlines", hint: "The dates that are expensive to miss." },
      { key: "finals_week", label: "Finals week", hint: "Exact dates, so the study ramp starts on time." },
    ],
  },
  {
    title: "People and social life",
    items: [
      { key: "social_events", label: "Social events, in detail", hint: "Parties, games, formals, road trips. The more detail the better." },
      { key: "friends", label: "Your friends", hint: "Names and a little context. Your agent will keep track of plans with them." },
      { key: "family_birthdays", label: "Family birthdays", hint: "Never miss Mom's birthday again. Your agent will remind you early." },
      { key: "anniversaries", label: "Anniversaries and special dates", hint: "Relationships, family milestones, anything worth remembering." },
      { key: "roommates", label: "Roommates and who you live with", hint: "Helps with shared plans, bills, and quiet-hours scheduling." },
    ],
  },
  {
    title: "Routines",
    items: [
      { key: "study_blocks", label: "Your weekly study schedule", hint: "When you actually study best. Your agent protects those blocks." },
      { key: "work_shifts", label: "Work shifts or job schedule", hint: "If you work, your agent plans around it." },
      { key: "gym", label: "Gym and workout routine", hint: "Consistency is easier when someone is keeping score." },
      { key: "sleep", label: "Sleep and wake-up routine", hint: "Your agent won't schedule 8am study blocks if you're a night owl." },
    ],
  },
  {
    title: "Tools and goals",
    items: [
      { key: "connect_calendar", label: "Connect your calendar", hint: "The single highest-leverage integration. Do it first." },
      { key: "connect_email", label: "Connect Gmail or school email", hint: "So your agent can flag what matters in your inbox." },
      { key: "connect_lms", label: "Connect Canvas or your LMS", hint: "Assignments and grades flow in automatically." },
      { key: "notes", label: "Start feeding it your class notes", hint: "Drag and drop them into Chat as you take them." },
      { key: "budget", label: "Budget and money goals", hint: "Rent, meal plan, fun money. Your agent helps you stay inside it." },
      { key: "career", label: "Career goals and resume", hint: "Upload your resume and name a target. Internship season comes fast." },
    ],
  },
];

// Flat set of valid keys for API validation.
export const CHECKLIST_KEYS = new Set(CHECKLIST_GROUPS.flatMap((g) => g.items.map((i) => i.key)));

export const CHECKLIST_TOTAL = CHECKLIST_GROUPS.reduce((n, g) => n + g.items.length, 0);
