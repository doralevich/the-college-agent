"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, Loader2, Plus, Search, Send, X } from "lucide-react";
import majorsData from "@/data/college-agent-majors.json";

// Conversational replacement for /onboard. Frankenstein asks one question at a time;
// the student answers with text or chip-picks. Each answer is persisted to
// localStorage so a refresh / tab close resumes at the same spot. On completion we
// POST the exact same payload shape the legacy form submits — the provisioner and
// SOUL.md build path stay unchanged.

// Resolved through the --ca-* variables in app/agent-ui.css so the wizard follows
// day/night mode. greenText is for brand-green TEXT (flips light in dark mode);
// greenDeep is the CTA hover FILL (stays deep in both).
const T = {
  green: "var(--ca-green)",
  greenDeep: "var(--ca-green-deep)",
  greenText: "var(--ca-green-text)",
  greenSoft: "var(--ca-green-soft)",
  paper: "var(--ca-paper)",
  card: "var(--ca-card)",
  ink: "var(--ca-ink)",
  inkSoft: "var(--ca-ink-soft)",
  line: "var(--ca-line)",
};

const FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=DM+Sans:wght@400;500;600;700&display=swap";

// Voice options — pick any to blend (short labels, picked from the spec).
const VOICE_OPTIONS = [
  "Direct, no filler",
  "Calm and thoughtful",
  "Warm and encouraging",
  "Witty, give me personality",
  "Motivational and fierce",
  "Plainspoken and patient",
  "Candid and real",
  "Analytical and curious",
];

const CHECKIN_OPTIONS = [
  "A few times a day",
  "A morning briefing each day",
  "Twice a week",
  "Weekly digest",
  "Only when I ask",
  "Real-time, whenever something comes up",
];

const YEAR_OPTIONS = ["Freshman", "Sophomore", "Junior", "Senior", "5th year+", "Grad student"];

// Success picks — what "success" can mean by year-end. Spec list, verbatim.
const SUCCESS_OPTIONS = [
  "Hit my target GPA",
  "Finish every class I'm enrolled in",
  "Build deeper friendships",
  "Land an internship or job offer",
  "Get into grad / professional school",
  "Build a consistent habit (sleep, gym, study)",
  "Finish a personal project",
  "Improve a key skill",
  "Get fitter or healthier",
  "Protect my mental health",
  "Strengthen a key relationship",
  "Step into a leadership role",
  "Start something of my own",
  "Save money or pay down debt",
  "Travel somewhere meaningful",
  "Show up consistently and finish what I start",
];

// Trimmed to the realistic v1 set from the spec (each requires its own OAuth,
// so don't promise more than we can wire). Selected labels land on the onboard
// submission for the Integrations tab to spotlight.
const INTEGRATION_OPTIONS = [
  "Google Calendar",
  "Gmail",
  "Canvas",
  "School email",
];

const PRIORITY_OPTIONS = [
  "Grades & academic performance",
  "Skill building & certifications",
  "Grad / professional school prep",
  "Mental health",
  "Physical health, fitness & sleep",
  "Spirituality, faith or values",
  "Friendships & social life",
  "Family relationships",
  "Romantic life & dating",
  "Networking & mentorship",
  "Career prep & internships",
  "Leadership & extracurriculars",
  "Financial stability & earning",
  "Travel or study abroad",
  "Time management & organization",
  "Creative projects & hobbies",
  "Personal growth",
  "Community service & impact",
];

// Tier-3 short option lists (per spec).
const LIVING_OPTIONS = ["Dorm / on-campus", "Off-campus apartment or house", "With family", "Greek house"];
const GREEK_OPTIONS = ["Yes", "No", "Thinking about rushing"];
const CLUBS_OPTIONS = [
  "Academic / pre-professional",
  "Cultural / identity",
  "Service / volunteer",
  "Arts / music / performance",
  "Religious / spiritual",
  "Political / advocacy",
  "Recreational / hobby",
  "Student government",
  "None right now",
];
const SPORTS_OPTIONS = ["Varsity", "Club", "Intramural", "Not right now"];
const WORK_OPTIONS = [
  "No, school is my focus",
  "Yes, under 10 hrs/week",
  "Yes, 10-20 hrs/week",
  "Yes, 20+ hrs/week",
];
const AFTER_COLLEGE_OPTIONS = [
  "Straight into a career",
  "Grad / professional school",
  "Gap year",
  "Start something of my own",
  "Still figuring it out",
];
const ACADEMIC_STRUGGLES_OPTIONS = [
  "Staying focused",
  "Procrastination",
  "Test anxiety",
  "Writing / essays",
  "Math-heavy classes",
  "Reading load",
  "Time management",
  "Asking for help",
];
const STRESS_RESET_OPTIONS = [
  "Exercise / moving",
  "Sleep",
  "Time with friends",
  "Alone time",
  "Music",
  "Getting outside",
  "Talking it out",
  "Just powering through",
];

// Curated major list (grouped) loaded from data/college-agent-majors.json. The
// "Other" group already contains "Undecided" and "Other (type your own)".
const MAJOR_GROUPS: MajorGroup[] = (majorsData as { groups: MajorGroup[] }).groups;

// Each step in the conversation. `kind` controls the input UI and validation. `key`
// matches the form-field name the existing /api/onboard-submit endpoint reads.
// `tier: 2` -> shown only when wantTier2 === "yes"  (priorities, voice, classes, etc.)
// `tier: 3` -> shown only when wantDeepDive === "yes" (year, major, family, etc.)
// `tier: "tail"` -> shown unless the student exited early at wantTier2.
type Tier = 2 | 3 | "tail";
type Step =
  | { kind: "text"; key: TextKey; prompt: string; placeholder?: string; inputType?: "text" | "email" | "tel"; required?: boolean; tier?: Tier }
  | { kind: "textarea"; key: TextKey; prompt: string; placeholder?: string; required?: boolean; tier?: Tier }
  | { kind: "multi"; key: MultiKey; prompt: string; options: string[]; max?: number; required?: boolean; tier?: Tier }
  | { kind: "single"; key: SingleKey; prompt: string; options: string[]; required?: boolean; tier?: Tier }
  // School typeahead backed by /api/schools (College Scorecard proxy).
  | { kind: "typeahead"; key: TextKey; prompt: string; placeholder?: string; required?: boolean; tier?: Tier }
  // Grouped dropdown with search (majors/minors). extraOptions inject non-major
  // choices like "Not yet" / "None" at the top of the list.
  | { kind: "select"; key: TextKey; prompt: string; placeholder?: string; groups: MajorGroup[]; extraOptions?: string[]; required?: boolean; tier?: Tier }
  | { kind: "image"; key: "avatarFile"; prompt: string; required?: boolean }
  | { kind: "intro"; key: "__intro"; prompt: string }
  // Read-only message bubble (no input, no answer). Used to set up a section.
  | { kind: "info"; key: string; prompt: string }
  // Yes/No branch. wantTier2 gates whether tier-2/3 steps render at all (graceful early
  // exit); wantDeepDive then narrows tier-3 if they keep going.
  | { kind: "branch"; key: BranchKey; prompt: string; yesLabel?: string; noLabel?: string; tier?: Tier }
  // Repeating list of classes — name + days + time + location + professor + SKU.
  | { kind: "classList"; key: "classes"; prompt: string; tier?: Tier };

type MajorGroup = { label: string; majors: string[] };

type BranchKey = "wantTier2" | "wantDeepDive";

type TextKey =
  | "firstName"
  | "lastName"
  | "agentName"
  | "schoolEmail"
  | "personalEmail"
  | "phone"
  | "school"
  | "major"
  | "minor"
  | "anythingElse";
type MultiKey =
  | "checkinFrequency"
  | "topPriority"
  | "agentHandleFirst"
  | "responseStyle"
  | "integrationsWanted"
  | "clubs"
  | "sportsTeams"
  | "academicStruggles"
  | "stressReset";
type SingleKey = "year" | "livingSituation" | "greekLife" | "workStatus" | "afterCollege";

export type ClassEntry = {
  name: string;
  days: string;
  time: string;
  location: string;
  professor: string;
  sku: string;
};

const EMPTY_CLASS: ClassEntry = { name: "", days: "", time: "", location: "", professor: "", sku: "" };

// `{firstName}` is interpolated from the prop at render time so the intro can greet
// the student by name (pulled from /build lead-capture). Missing → falls back to "there".
const STEPS: Step[] = [
  {
    kind: "intro",
    key: "__intro",
    prompt:
      "Hi {firstName}, nice to meet you. I'm your College Agent. Let's start by getting to know each other. I'll run through a few quick questions, it only takes a couple of minutes, and the more you tell me the sharper I get. Ready?",
  },
  { kind: "text", key: "agentName", prompt: "Before we dive in, what do you want to call me? Pick any name you like, or skip to leave me as your College Agent.", placeholder: "Type a name..." },
  { kind: "image", key: "avatarFile", prompt: "Want to give me a face? Upload an image (PNG or JPG), or skip and I'll use the default bot. You can always change this later." },
  { kind: "text", key: "firstName", prompt: "And what should I call you? Just your first name is perfect.", placeholder: "Your first name", required: true },
  { kind: "text", key: "lastName", prompt: "And your last name", placeholder: "Your last name", required: true },
  { kind: "typeahead", key: "school", prompt: "What school do you go to?", placeholder: "Start typing your school...", required: true },
  { kind: "text", key: "schoolEmail", prompt: "What's your school email?", placeholder: "you@school.edu", inputType: "email", required: true },
  { kind: "text", key: "personalEmail", prompt: "What's your personal email?", placeholder: "you@email.com", inputType: "email" },
  { kind: "text", key: "phone", prompt: "What's your mobile number?", placeholder: "(555) 555-5555", inputType: "tel", required: true },
  {
    kind: "branch",
    key: "wantTier2",
    prompt:
      "Awesome, that's the basics done. We're officially introduced. Now here's where it gets good. The more I know about your schedule, your classes, and how you like to work, the more I can actually help instead of just answering questions. Want to keep going? It's worth it, I promise.",
    yesLabel: "Let's keep going",
    noLabel: "I'm good for now",
  },
  {
    kind: "multi",
    key: "topPriority",
    prompt: "What matters most to you across your college years? Pick everything that fits.",
    options: PRIORITY_OPTIONS,
    required: true,
    tier: 2,
  },
  {
    kind: "multi",
    key: "agentHandleFirst",
    prompt: "What does success look like by the end of this semester and this year? Pick everything that fits.",
    options: SUCCESS_OPTIONS,
    required: true,
    tier: 2,
  },
  { kind: "multi", key: "responseStyle", prompt: "How do you want me to communicate with you? Pick any styles that fit and I'll blend them.", options: VOICE_OPTIONS, required: true, tier: 2 },
  { kind: "multi", key: "checkinFrequency", prompt: "How often should I check in with you? Pick any that fit.", options: CHECKIN_OPTIONS, required: true, tier: 2 },
  {
    kind: "classList",
    key: "classes",
    prompt: "Let's add your classes one at a time. Name, days, time, location, professor, class SKU. Add another until you're done.",
    tier: 2,
  },
  {
    kind: "branch",
    key: "wantDeepDive",
    prompt: "Want to get into some more detailed questions? They help me build a fuller picture of your life. Just a couple more minutes.",
    yesLabel: "Yes, let's keep going",
    noLabel: "No, that's enough for now",
    tier: 2,
  },
  // Tier 3 — only shown if wantDeepDive === "yes". Spec-aligned: short radios and
  // checkbox lists, no follow-up text prompts.
  { kind: "single", key: "year", prompt: "What year are you in?", options: YEAR_OPTIONS, tier: 3 },
  { kind: "select", key: "major", prompt: "What's your major?", placeholder: "Search majors...", groups: MAJOR_GROUPS, tier: 3 },
  { kind: "select", key: "minor", prompt: "Any minor or second focus?", placeholder: "Search minors...", groups: MAJOR_GROUPS, extraOptions: ["Not yet", "None"], tier: 3 },
  { kind: "single", key: "livingSituation", prompt: "Where are you living this year?", options: LIVING_OPTIONS, tier: 3 },
  { kind: "single", key: "greekLife", prompt: "Are you in a fraternity or sorority?", options: GREEK_OPTIONS, tier: 3 },
  { kind: "multi", key: "clubs", prompt: "What clubs or student orgs are you part of? Pick any that apply.", options: CLUBS_OPTIONS, tier: 3 },
  { kind: "multi", key: "sportsTeams", prompt: "Are you on any sports teams? Pick any that apply.", options: SPORTS_OPTIONS, tier: 3 },
  { kind: "single", key: "workStatus", prompt: "Do you work or have a side hustle alongside school?", options: WORK_OPTIONS, tier: 3 },
  { kind: "single", key: "afterCollege", prompt: "What are you hoping to do after college?", options: AFTER_COLLEGE_OPTIONS, tier: 3 },
  { kind: "multi", key: "academicStruggles", prompt: "What's hardest for you academically? Pick any that apply.", options: ACADEMIC_STRUGGLES_OPTIONS, tier: 3 },
  { kind: "multi", key: "stressReset", prompt: "When you get stressed or burnt out, what helps you reset? Pick any that fit.", options: STRESS_RESET_OPTIONS, tier: 3 },
  { kind: "textarea", key: "anythingElse", prompt: "Anything else you want me to know? Goals, habits, pressure points, anything.", tier: "tail" },
];

type FormState = {
  firstName: string;
  lastName: string;
  agentName: string;
  schoolEmail: string;
  personalEmail: string;
  phone: string;
  school: string;
  topPriority: string[];
  agentHandleFirst: string[];
  responseStyle: string[];
  checkinFrequency: string[];
  integrationsWanted: string[];
  classes: ClassEntry[];
  wantTier2: "" | "yes" | "no";
  wantDeepDive: "" | "yes" | "no";
  year: string;
  major: string;
  minor: string;
  livingSituation: string;
  greekLife: string;
  clubs: string[];
  sportsTeams: string[];
  workStatus: string;
  afterCollege: string;
  academicStruggles: string[];
  stressReset: string[];
  anythingElse: string;
};

const EMPTY: FormState = {
  firstName: "",
  lastName: "",
  agentName: "",
  schoolEmail: "",
  personalEmail: "",
  phone: "",
  school: "",
  topPriority: [],
  agentHandleFirst: [],
  responseStyle: [],
  checkinFrequency: [],
  integrationsWanted: [],
  classes: [],
  wantTier2: "",
  wantDeepDive: "",
  year: "",
  major: "",
  minor: "",
  livingSituation: "",
  greekLife: "",
  clubs: [],
  sportsTeams: [],
  workStatus: "",
  afterCollege: "",
  academicStruggles: [],
  stressReset: [],
  anythingElse: "",
};

type StoredProgress = { stepIdx: number; form: FormState };

// Layer pre-payment lead values onto a FormState (typically EMPTY or a restored draft).
// Only fields the student actually filled in pre-payment are copied — leaves whatever
// they've since typed in the chat alone if they already overrode it.
function seedFormFromPrefill(base: FormState, prefill: OnboardPrefill | null | undefined): FormState {
  if (!prefill) return base;
  const next: FormState = { ...base };
  for (const k of PREFILL_KEYS) {
    const v = (prefill[k] ?? "").trim();
    if (v && !(base[k] as string).trim()) {
      (next as Record<keyof OnboardPrefill, string>)[k] = v;
    }
  }
  return next;
}

// Format a class list into the legacy `currentClasses` text blob so the existing
// provisioner/SOUL.md path (which references currentClasses) keeps working unchanged.
function formatClassesForLegacy(classes: ClassEntry[]): string {
  return classes
    .filter((c) => c.name.trim())
    .map((c) => {
      const bits = [c.name, c.days, c.time, c.location, c.professor, c.sku]
        .map((s) => s.trim())
        .filter(Boolean);
      return bits.join(" - ");
    })
    .join("; ");
}

export type OnboardPrefill = {
  firstName: string;
  lastName: string;
  schoolEmail: string;
  personalEmail: string;
  phone: string;
  school: string;
};

// Keys we collected pre-payment on /build. When prefill has a non-empty value for one of
// these, the matching step is dropped from the chat and its value lives in form state from
// the first render — the student never sees a duplicate question for something they typed
// in the build form.
const PREFILL_KEYS: ReadonlyArray<keyof OnboardPrefill> = [
  "firstName",
  "lastName",
  "schoolEmail",
  "personalEmail",
  "phone",
  "school",
];

export function ConversationalOnboard({
  userId,
  knownFirstName,
  prefill,
}: {
  userId: string;
  knownFirstName?: string | null;
  prefill?: OnboardPrefill | null;
}) {
  const router = useRouter();
  const storageKey = `ca-onboard-progress:${userId}`;
  // Initial form state already carries any pre-payment lead values so the submit payload
  // is complete even though the student never sees those questions.
  const [form, setForm] = useState<FormState>(() => seedFormFromPrefill(EMPTY, prefill));
  const [stepIdx, setStepIdx] = useState(0);

  // Every step change returns the viewport to the top of the wizard — on phones the
  // options list can leave you scrolled halfway down when you tap Next.
  const rootRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    rootRef.current?.scrollIntoView({ block: "start" });
  }, [stepIdx]);
  const [restored, setRestored] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Files don't serialize cleanly to localStorage, so avatar lives in component state
  // only — students who refresh mid-flow keep their text answers but re-pick the image.
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  // Draft class being filled out before it lands in form.classes.
  const [classDraft, setClassDraft] = useState<ClassEntry>(EMPTY_CLASS);
  const scrollRef = useRef<HTMLDivElement>(null);

  const displayFirstName = (form.firstName?.trim() || knownFirstName?.trim() || "there");
  const displayBotName = (form.agentName?.trim() || "Your College Agent");

  // Filter steps based on the student's branch answers and what we already know from
  // pre-payment lead capture. Three filters layered:
  //   (1) Step prefilled by /build leads → skip it (no duplicate question).
  //   (2) wantTier2 === "no" → drop everything tagged tier 2 / 3 / tail. The branch is
  //       then the LAST visible step, so Continue becomes Finish and the student exits
  //       gracefully with just the basics on file.
  //   (3) wantDeepDive === "no" → drop tier-3 steps (the deeper questions). Tier 2 +
  //       the closing "anything else" still show.
  const visibleSteps = useMemo(() => {
    const prefilledKeys = new Set<string>();
    if (prefill) {
      for (const k of PREFILL_KEYS) {
        if ((prefill[k] ?? "").trim()) prefilledKeys.add(k);
      }
    }
    return STEPS.filter((s) => {
      if ((s.kind === "text" || s.kind === "textarea" || s.kind === "typeahead") && prefilledKeys.has(s.key)) return false;
      const tier = "tier" in s ? s.tier : undefined;
      // Default is to SHOW tier 2 / 3 / tail. Only hide when the student explicitly
      // tapped "no" on the matching branch, so the branch step's CTA stays
      // "Continue" before they pick (and flips to "Finish" once they say no).
      if (form.wantTier2 === "no" && (tier === 2 || tier === 3 || tier === "tail")) return false;
      if (form.wantDeepDive === "no" && tier === 3) return false;
      return true;
    });
  }, [form.wantTier2, form.wantDeepDive, prefill]);

  // Inject Fraunces + DM Sans (match the Welcome card's vibe).
  useEffect(() => {
    const links: HTMLLinkElement[] = [];
    const add = (attrs: Record<string, string>) => {
      const el = document.createElement("link");
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
      document.head.appendChild(el);
      links.push(el);
    };
    add({ rel: "preconnect", href: "https://fonts.googleapis.com" });
    add({ rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" });
    add({ rel: "stylesheet", href: FONTS_HREF });
    return () => links.forEach((el) => el.remove());
  }, []);

  // Restore in-flight progress on mount. Same-browser only — cross-device resume would
  // need a server-side draft store, which is a follow-up.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<StoredProgress>;
        if (parsed.form) setForm(seedFormFromPrefill({ ...EMPTY, ...parsed.form }, prefill));
        if (typeof parsed.stepIdx === "number") {
          // Clamp into the visible-step range computed from the restored form.
          // visibleSteps isn't available here (we'd need to recompute), so cap at the
          // full list length — the next effect tightens this if needed.
          setStepIdx(Math.min(Math.max(parsed.stepIdx, 0), STEPS.length - 1));
        }
      }
    } catch {
      /* corrupt entry — start fresh */
    }
    setRestored(true);
  }, [storageKey]);

  // Persist every state change once we've restored (skip the very first render).
  useEffect(() => {
    if (!restored) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ stepIdx, form } satisfies StoredProgress));
    } catch {
      /* quota / disabled — non-fatal, user just won't get resume */
    }
  }, [storageKey, stepIdx, form, restored]);

  // Auto-scroll to the bottom whenever the visible conversation grows.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [stepIdx, submitting]);

  // If the visible list shrinks (e.g. student switched from yes to no on deep-dive),
  // clamp the cursor so we don't index off the end.
  useEffect(() => {
    if (stepIdx > visibleSteps.length - 1) {
      setStepIdx(Math.max(0, visibleSteps.length - 1));
    }
  }, [visibleSteps.length, stepIdx]);

  const current = visibleSteps[stepIdx];
  const isLast = stepIdx === visibleSteps.length - 1;

  const setField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setError(null);
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  function answerSummary(step: Step): string {
    if (step.kind === "intro") return "Ready, let's go!";
    if (step.kind === "info") return "Got it.";
    if (step.kind === "image") return avatarFile ? avatarFile.name : "(using the default bot)";
    if (step.kind === "branch") {
      const v = form[step.key];
      if (v === "yes") return step.yesLabel ?? "Yes";
      if (v === "no") return step.noLabel ?? "No";
      return "(skipped)";
    }
    if (step.kind === "classList") {
      if (!form.classes.length) return "(none added)";
      return form.classes.map((c) => c.name).filter(Boolean).join(", ") || "(none added)";
    }
    const value = form[step.key as keyof FormState];
    if (Array.isArray(value)) return value.length ? value.join(", ") : "(skipped)";
    const v = String(value || "").trim();
    if (!v) return "(skipped)";
    return v;
  }

  function isRequired(step: Step): boolean {
    if (step.kind === "intro" || step.kind === "info" || step.kind === "image") return false;
    if (step.kind === "branch") return true;
    if (step.kind === "classList") return false;
    return !!step.required;
  }

  function isAnswered(step: Step): boolean {
    if (step.kind === "intro" || step.kind === "info") return true;
    if (step.kind === "image") return !!avatarFile;
    if (step.kind === "branch") {
      const v = form[step.key];
      return v === "yes" || v === "no";
    }
    if (step.kind === "classList") return form.classes.length > 0;
    const value = form[step.key as keyof FormState];
    if (Array.isArray(value)) return value.length > 0;
    return !!String(value || "").trim();
  }

  function validateCurrent(): string | null {
    if (current.kind === "intro" || current.kind === "info") return null;
    if (current.kind === "image") return null;
    if (current.kind === "classList") return null;
    if (current.kind === "branch") {
      const v = form[current.key];
      if (v !== "yes" && v !== "no") return "Pick one.";
      return null;
    }
    if (!current.required) return null;
    if (current.kind === "text" || current.kind === "textarea" || current.kind === "typeahead" || current.kind === "select") {
      const v = String(form[current.key] || "").trim();
      if (!v) return "This one's required.";
      if (current.kind === "text" && current.inputType === "email" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) {
        return "That email doesn't look right.";
      }
      return null;
    }
    const value = form[current.key];
    if (Array.isArray(value) && value.length === 0) return "Pick at least one.";
    if (typeof value === "string" && !value) return "Pick one.";
    return null;
  }

  async function advance() {
    const v = validateCurrent();
    if (v) {
      setError(v);
      return;
    }
    if (!isLast) {
      setStepIdx((i) => i + 1);
      return;
    }
    await submit();
  }

  function goBack() {
    if (stepIdx === 0) return;
    setError(null);
    setStepIdx((i) => Math.max(0, i - 1));
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const body = new FormData();
      body.append(
        "data",
        JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          agentName: form.agentName.trim(),
          schoolEmail: form.schoolEmail.trim(),
          personalEmail: form.personalEmail.trim(),
          phone: form.phone.trim(),
          school: form.school.trim(),
          topPriority: form.topPriority,
          agentHandleFirst: form.agentHandleFirst,
          responseStyle: form.responseStyle,
          checkinFrequency: form.checkinFrequency,
          integrationsWanted: form.integrationsWanted,
          // Legacy text blob for the existing provisioner/SOUL.md path. The full
          // structured list also rides along under `classes`.
          currentClasses: formatClassesForLegacy(form.classes),
          classes: form.classes,
          wantTier2: form.wantTier2,
          wantDeepDive: form.wantDeepDive,
          year: form.year.trim(),
          major: form.major.trim(),
          minor: form.minor.trim(),
          livingSituation: form.livingSituation,
          greekLife: form.greekLife,
          clubs: form.clubs,
          sportsTeams: form.sportsTeams,
          workStatus: form.workStatus,
          afterCollege: form.afterCollege,
          academicStruggles: form.academicStruggles,
          stressReset: form.stressReset,
          anythingElse: form.anythingElse.trim(),
        }),
      );
      if (avatarFile) body.append("avatar", avatarFile);
      const res = await fetch("/api/onboard-submit", { method: "POST", body });
      if (!res.ok) throw new Error("Couldn't save your answers. Try again?");
      try {
        localStorage.removeItem(storageKey);
      } catch {
        /* non-fatal */
      }
      // Auto-provision once onboarding is in — the dashboard otherwise leaves the
      // student stranded on the Welcome card with no Chat tab. Best-effort: a
      // provision failure surfaces a message but the onboard answers are saved, so
      // the student can retry from the dashboard funnel.
      try {
        const provRes = await fetch("/api/provision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        if (!provRes.ok) {
          const body = await provRes.json().catch(() => ({}));
          // 400 onboard_incomplete shouldn't happen after a successful submit, but be
          // defensive — surface anything Stripe / Agent37 says rather than silently failing.
          const msg = body?.error?.message || `Couldn't build your agent (${provRes.status})`;
          throw new Error(msg);
        }
      } catch (provErr) {
        // Don't undo the onboarding submit on a provision failure; the StepsView fallback
        // can pick up from here. Surface the reason to the student.
        setError(`Saved your answers — but ${(provErr as Error).message}. Refresh to try again.`);
        setSubmitting(false);
        router.refresh();
        return;
      }
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  }

  const progress = useMemo(
    () => Math.round(((stepIdx + (submitting ? 1 : 0)) / visibleSteps.length) * 100),
    [stepIdx, submitting, visibleSteps.length],
  );

  return (
    <div
      ref={rootRef}
      className="ca-onboard-root"
      style={{
        minHeight: "100%",
        background: `radial-gradient(120% 80% at 50% -10%, ${T.greenSoft} 0%, transparent 55%), ${T.paper}`,
        fontFamily: "'DM Sans', system-ui, sans-serif",
        color: T.ink,
        margin: "-16px",
        padding: "40px 16px 32px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Welcome header above the wizard card. */}
      <div className="ca-onboard-header" style={{ width: "100%", maxWidth: 620, textAlign: "center", marginBottom: 24 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: T.greenSoft,
            color: T.greenText,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            padding: "6px 14px",
            borderRadius: 999,
            marginBottom: 16,
          }}
        >
          Your intake
        </div>
        <h1
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: 32,
            fontWeight: 600,
            lineHeight: 1.15,
            letterSpacing: "-.01em",
            color: T.ink,
            margin: "0 0 10px",
          }}
        >
          Welcome{displayFirstName && displayFirstName !== "there" ? `, ${displayFirstName}` : ""}!
        </h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, color: T.inkSoft, maxWidth: 500, margin: "0 auto" }}>
          Let&apos;s build your College Agent. A few quick questions about you, your classes, and how you
          like to work, so your agent is personalized from day one. It saves as you go.
        </p>
      </div>

      <div
        className="ca-onboard-card"
        style={{
          background: T.card,
          width: "100%",
          maxWidth: 620,
          border: `1px solid ${T.line}`,
          borderRadius: 20,
          boxShadow: "0 1px 2px rgba(26,36,33,.04), 0 24px 60px -28px rgba(27,94,42,.28)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Progress bar — a rounded pill inside the top padding so the card's
            corner radius never clips it. */}
        <div className="ca-progress-wrap" style={{ padding: "24px 44px 0" }}>
          <div style={{ height: 8, background: T.greenSoft, borderRadius: 999, overflow: "hidden" }}>
            <div
              style={{
                width: `${Math.max(progress, 4)}%`,
                height: "100%",
                background: T.green,
                borderRadius: 999,
                transition: "width .3s ease",
              }}
            />
          </div>
        </div>

        <div className="ca-q-body" style={{ padding: "28px 44px", minHeight: 320, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          {/* Mascot + question header: side by side on desktop, a small icon stacked on
              top with the question full-width on phones (see the media block below). */}
          <div className="ca-q-row" style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 26 }}>
            <div
              className="ca-q-mascot"
              style={{
                flex: "0 0 auto",
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: T.greenSoft,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <Image src="/thecollegeagent.png" alt="" width={52} height={52} style={{ objectFit: "contain", width: "100%", height: "100%" }} />
              )}
            </div>
            <div style={{ flex: 1, paddingTop: 2, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.inkSoft, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 8 }}>
                Question {Math.min(stepIdx + 1, visibleSteps.length)} of {visibleSteps.length}
              </div>
              <h1
                className="ca-q-prompt"
                style={{
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  fontSize: 18,
                  fontWeight: 400,
                  lineHeight: 1.45,
                  color: T.ink,
                  margin: 0,
                }}
              >
                {current.prompt.replace("{firstName}", displayFirstName)}
              </h1>
            </div>
          </div>

          {submitting ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: T.inkSoft, fontSize: 14, padding: "16px 0" }}>
              <Loader2 className="animate-spin" style={{ width: 16, height: 16 }} />
              Saving your answers and building your agent. This can take a minute or two.
            </div>
          ) : (
            <Input
              step={current}
              form={form}
              setField={setField}
              onAdvance={advance}
              disabled={submitting}
              avatarFile={avatarFile}
              avatarPreview={avatarPreview}
              setAvatar={(file) => {
                setAvatarFile(file);
                setAvatarPreview((prev) => {
                  if (prev) URL.revokeObjectURL(prev);
                  return file ? URL.createObjectURL(file) : null;
                });
              }}
              classDraft={classDraft}
              setClassDraft={setClassDraft}
              addClass={() => {
                if (!classDraft.name.trim()) return;
                setField("classes", [...form.classes, classDraft]);
                setClassDraft(EMPTY_CLASS);
              }}
              removeClass={(idx) => setField("classes", form.classes.filter((_, i) => i !== idx))}
            />
          )}

          {error && <p style={{ marginTop: 14, fontSize: 13, color: "var(--ca-error)" }}>{error}</p>}
        </div>

        <div
          className="ca-q-footer"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 44px 20px",
            borderTop: `1px solid ${T.line}`,
            gap: 12,
          }}
        >
          <button
            type="button"
            onClick={goBack}
            disabled={submitting || stepIdx === 0}
            className="ca-onboard-back"
            style={{
              border: "none",
              background: "transparent",
              color: T.inkSoft,
              fontFamily: "'DM Sans', system-ui, sans-serif",
              fontSize: 14,
              fontWeight: 500,
              padding: "10px 14px",
              cursor: submitting || stepIdx === 0 ? "not-allowed" : "pointer",
              opacity: submitting || stepIdx === 0 ? 0.4 : 1,
              borderRadius: 8,
            }}
          >
            ← Back
          </button>

          <button
            type="button"
            onClick={advance}
            disabled={submitting || (isRequired(current) && !isAnswered(current))}
            className="ca-onboard-cta"
            style={{
              border: "none",
              cursor: submitting || (isRequired(current) && !isAnswered(current)) ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans', system-ui, sans-serif",
              fontSize: 15,
              fontWeight: 600,
              color: "#fff",
              background: T.green,
              padding: "12px 28px",
              borderRadius: 10,
              opacity: submitting || (isRequired(current) && !isAnswered(current)) ? 0.55 : 1,
              transition: "background .15s, opacity .15s",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              flexShrink: 0,
            }}
          >
            {submitting
              ? <Loader2 className="animate-spin" style={{ width: 14, height: 14 }} />
              : ctaLabel(current, isLast, form)}
          </button>
        </div>

        <div className="ca-q-hint" style={{ padding: "10px 44px 18px", textAlign: "center", fontSize: 12, color: T.inkSoft }}>
          Saves automatically. Close this tab and come back any time.
        </div>
      </div>

      <style>{`
        .ca-onboard-cta:hover:not(:disabled) { background: ${T.greenDeep}; }
        .ca-onboard-cta:focus-visible { outline: 3px solid ${T.greenSoft}; outline-offset: 3px; }
        .ca-onboard-back:hover:not(:disabled) { background: ${T.greenSoft}; color: ${T.ink}; }
        @media (max-width: 560px) {
          /* Compact single-column layout: small mascot on top, question full width, no
             header paragraph — the question and its options fit the top of the screen. */
          .ca-onboard-root { padding: 18px 12px 28px !important; }
          .ca-onboard-header { margin-bottom: 12px !important; }
          .ca-onboard-header > div { margin-bottom: 8px !important; }
          .ca-onboard-header h1 { font-size: 22px !important; margin-bottom: 0 !important; }
          .ca-onboard-header p { display: none !important; }
          .ca-onboard-card { border-radius: 14px !important; }
          .ca-onboard-card h1 { font-size: 22px !important; }
          .ca-onboard-card > div { padding-left: 20px !important; padding-right: 20px !important; }
          .ca-progress-wrap { padding-top: 14px !important; }
          .ca-q-body {
            min-height: 0 !important;
            padding-top: 16px !important; padding-bottom: 16px !important;
            justify-content: flex-start !important;
          }
          .ca-q-row { display: block !important; margin-bottom: 14px !important; }
          .ca-q-mascot { width: 34px !important; height: 34px !important; margin: 0 auto 10px !important; }
          .ca-onboard-card h1.ca-q-prompt { font-size: 16px !important; line-height: 1.4 !important; }
          .ca-q-footer { padding-top: 10px !important; padding-bottom: 12px !important; }
          .ca-q-hint { padding-top: 4px !important; padding-bottom: 10px !important; font-size: 11px !important; }
          /* 16px inputs on phones or iOS Safari zooms-and-pans the page on focus. */
          .ca-onboard-input { font-size: 16px !important; }
        }
      `}</style>
    </div>
  );
}

function ctaLabel(step: Step, isLast: boolean, form: FormState): string {
  if (step.kind === "intro") return "Let's do it";
  if (step.kind === "info") return "Got it";
  if (step.kind === "classList") return form.classes.length ? (isLast ? "Finish" : "Continue") : "Skip for now";
  if (isLast) return "Finish";
  return "Continue";
}

function Avatar({ previewUrl }: { previewUrl?: string | null }) {
  return (
    <div style={{ width: 40, height: 40, borderRadius: "50%", background: T.greenSoft, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <Image src="/thecollegeagent.png" alt="" width={40} height={40} style={{ objectFit: "contain" }} />
      )}
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div style={{ width: 100, height: 6, borderRadius: 999, background: T.greenSoft, overflow: "hidden" }} aria-label="Onboarding progress">
      <div style={{ width: `${value}%`, height: "100%", background: T.green, transition: "width .35s ease" }} />
    </div>
  );
}

function BotBubble({ children, previewUrl }: { children: ReactNode; previewUrl?: string | null }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 6 }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", background: T.greenSoft, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <Image src="/thecollegeagent.png" alt="" width={28} height={28} style={{ objectFit: "contain" }} />
        )}
      </div>
      <div style={{ background: T.greenSoft, color: T.ink, padding: "10px 14px", borderRadius: 14, borderTopLeftRadius: 4, fontSize: 15, lineHeight: 1.5, maxWidth: "85%" }}>
        {children}
      </div>
    </div>
  );
}

function UserBubble({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
      <div style={{ background: T.green, color: "#fff", padding: "10px 14px", borderRadius: 14, borderTopRightRadius: 4, fontSize: 14, lineHeight: 1.5, maxWidth: "85%", whiteSpace: "pre-wrap" }}>
        {children}
      </div>
    </div>
  );
}

function Input({
  step,
  form,
  setField,
  onAdvance,
  disabled,
  avatarFile,
  avatarPreview,
  setAvatar,
  classDraft,
  setClassDraft,
  addClass,
  removeClass,
}: {
  step: Step;
  form: FormState;
  setField: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  onAdvance: () => void;
  disabled: boolean;
  avatarFile: File | null;
  avatarPreview: string | null;
  setAvatar: (file: File | null) => void;
  classDraft: ClassEntry;
  setClassDraft: (c: ClassEntry) => void;
  addClass: () => void;
  removeClass: (idx: number) => void;
}) {
  if (step.kind === "intro") {
    return (
      <p style={{ fontSize: 13, color: T.inkSoft, margin: 0 }}>
        Click <span style={{ color: T.green, fontWeight: 600 }}>I&apos;m ready</span> to begin.
      </p>
    );
  }
  if (step.kind === "info") {
    return (
      <p style={{ fontSize: 13, color: T.inkSoft, margin: 0 }}>
        Click <span style={{ color: T.green, fontWeight: 600 }}>Got it</span> to keep going.
      </p>
    );
  }
  if (step.kind === "branch") {
    const yesLabel = step.yesLabel ?? "Yes";
    const noLabel = step.noLabel ?? "No";
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {[
          { value: "yes" as const, label: yesLabel },
          { value: "no" as const, label: noLabel },
        ].map((opt) => {
          const selected = form[step.key] === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              disabled={disabled}
              onClick={() => setField(step.key, opt.value)}
              style={{
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: 13,
                fontWeight: 500,
                padding: "8px 14px",
                borderRadius: 999,
                border: `1.5px solid ${selected ? T.green : T.line}`,
                background: selected ? T.green : T.card,
                color: selected ? "#fff" : T.ink,
                cursor: disabled ? "not-allowed" : "pointer",
                transition: "background .15s, color .15s, border-color .15s",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    );
  }
  if (step.kind === "classList") {
    return (
      <ClassListInput
        classes={form.classes}
        draft={classDraft}
        setDraft={setClassDraft}
        addClass={addClass}
        removeClass={removeClass}
        disabled={disabled}
      />
    );
  }
  if (step.kind === "image") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", overflow: "hidden", background: T.greenSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {avatarPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <Image src="/thecollegeagent.png" alt="" width={56} height={56} style={{ objectFit: "contain" }} />
          )}
        </div>
        <label
          style={{
            cursor: disabled ? "not-allowed" : "pointer",
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontSize: 13,
            fontWeight: 600,
            color: T.green,
            border: `1.5px solid ${T.green}`,
            borderRadius: 10,
            padding: "8px 14px",
          }}
        >
          {avatarFile ? "Choose a different image" : "Upload an image"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            disabled={disabled}
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              if (f) setAvatar(f);
              e.target.value = "";
            }}
            style={{ display: "none" }}
          />
        </label>
        {avatarFile && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => setAvatar(null)}
            style={{
              background: "transparent",
              border: "none",
              color: T.inkSoft,
              fontSize: 13,
              cursor: "pointer",
              textDecoration: "underline",
              textUnderlineOffset: 2,
            }}
          >
            Remove
          </button>
        )}
      </div>
    );
  }
  if (step.kind === "text") {
    const value = form[step.key] as string;
    return (
      <input
        type={step.inputType ?? "text"}
        autoFocus
        placeholder={step.placeholder}
        value={value}
        disabled={disabled}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setField(step.key, e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onAdvance(); } }}
        className="ca-onboard-input"
        style={{
          width: "100%",
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontSize: 17,
          padding: "14px 16px",
          border: `1.5px solid ${T.line}`,
          borderRadius: 10,
          outline: "none",
          background: T.card,
          color: T.ink,
          transition: "border-color .15s, box-shadow .15s",
        }}
      />
    );
  }
  if (step.kind === "textarea") {
    const value = form[step.key] as string;
    return (
      <textarea
        autoFocus
        placeholder={step.placeholder}
        value={value}
        disabled={disabled}
        rows={3}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setField(step.key, e.target.value)}
        className="ca-onboard-input"
        style={{
          width: "100%",
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontSize: 15,
          padding: "12px 14px",
          border: `1.5px solid ${T.line}`,
          borderRadius: 12,
          outline: "none",
          background: T.card,
          color: T.ink,
          resize: "vertical",
          minHeight: 80,
        }}
      />
    );
  }
  if (step.kind === "typeahead") {
    return (
      <SchoolTypeahead
        value={form[step.key] as string}
        placeholder={step.placeholder}
        disabled={disabled}
        onChange={(v) => setField(step.key, v)}
      />
    );
  }
  if (step.kind === "select") {
    return (
      <MajorSelect
        value={form[step.key] as string}
        placeholder={step.placeholder}
        groups={step.groups}
        extraOptions={step.extraOptions}
        disabled={disabled}
        onChange={(v) => setField(step.key, v)}
      />
    );
  }
  if (step.kind === "multi") {
    const value = (form[step.key] as string[]) ?? [];
    const atLimit = !!step.max && value.length >= step.max;
    // Vertical aligned checkbox list: square checkbox on the left, label on the
    // right, full row is the click target. Reads as a standard form, not a pill row.
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {step.options.map((opt) => {
          const selected = value.includes(opt);
          const tooMany = atLimit && !selected;
          return (
            <button
              key={opt}
              type="button"
              role="checkbox"
              aria-checked={selected}
              disabled={disabled || tooMany}
              onClick={() => {
                if (selected) setField(step.key, value.filter((v) => v !== opt));
                else setField(step.key, [...value, opt]);
              }}
              style={{
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: 14,
                fontWeight: 500,
                padding: "10px 12px",
                borderRadius: 8,
                border: "none",
                background: selected ? T.greenSoft : "transparent",
                color: T.ink,
                cursor: disabled || tooMany ? "not-allowed" : "pointer",
                opacity: tooMany ? 0.5 : 1,
                transition: "background .12s",
                display: "flex",
                alignItems: "center",
                gap: 12,
                textAlign: "left",
                width: "100%",
              }}
            >
              <span
                aria-hidden
                style={{
                  flex: "0 0 auto",
                  width: 20,
                  height: 20,
                  borderRadius: 5,
                  border: `1.5px solid ${selected ? T.green : T.line}`,
                  background: selected ? T.green : T.card,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background .12s, border-color .12s",
                }}
              >
                {selected && <Check style={{ width: 13, height: 13, color: "#FFFFFF", strokeWidth: 3 }} />}
              </span>
              <span style={{ flex: 1 }}>{opt}</span>
            </button>
          );
        })}
      </div>
    );
  }
  if (step.kind === "single") {
    const value = form[step.key] as string;
    // Vertical aligned radio list — same shape as the checkbox list, with a round
    // bullet instead of a square. Pick-one semantics.
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {step.options.map((opt) => {
          const selected = value === opt;
          return (
            <button
              key={opt}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => setField(step.key, opt)}
              style={{
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: 14,
                fontWeight: 500,
                padding: "10px 12px",
                borderRadius: 8,
                border: "none",
                background: selected ? T.greenSoft : "transparent",
                color: T.ink,
                cursor: disabled ? "not-allowed" : "pointer",
                transition: "background .12s",
                display: "flex",
                alignItems: "center",
                gap: 12,
                textAlign: "left",
                width: "100%",
              }}
            >
              <span
                aria-hidden
                style={{
                  flex: "0 0 auto",
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  border: `1.5px solid ${selected ? T.green : T.line}`,
                  background: T.card,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "border-color .12s",
                }}
              >
                {selected && (
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: T.green,
                    }}
                  />
                )}
              </span>
              <span style={{ flex: 1 }}>{opt}</span>
            </button>
          );
        })}
      </div>
    );
  }
  return null;
}

function ClassListInput({
  classes,
  draft,
  setDraft,
  addClass,
  removeClass,
  disabled,
}: {
  classes: ClassEntry[];
  draft: ClassEntry;
  setDraft: (c: ClassEntry) => void;
  addClass: () => void;
  removeClass: (idx: number) => void;
  disabled: boolean;
}) {
  const fields: Array<{ key: keyof ClassEntry; label: string; placeholder: string }> = [
    { key: "name", label: "Class name", placeholder: "Marketing 301" },
    { key: "days", label: "Days", placeholder: "Mon / Wed / Fri" },
    { key: "time", label: "Time", placeholder: "10:00–10:50am" },
    { key: "location", label: "Location", placeholder: "Bryan Hall 215" },
    { key: "professor", label: "Professor", placeholder: "Prof. Lewis" },
    { key: "sku", label: "Class SKU", placeholder: "MKT-301-A" },
  ];
  const canAdd = !!draft.name.trim();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {classes.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {classes.map((c, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                background: T.greenSoft,
                padding: "8px 12px",
                borderRadius: 10,
                fontSize: 13,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: T.ink }}>{c.name || "Untitled class"}</div>
                <div style={{ color: T.inkSoft, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {[c.days, c.time, c.location, c.professor, c.sku].filter((s) => s.trim()).join(" · ") || "No details"}
                </div>
              </div>
              <button
                type="button"
                disabled={disabled}
                onClick={() => removeClass(i)}
                aria-label="Remove class"
                style={{
                  border: "none",
                  background: "transparent",
                  color: T.inkSoft,
                  cursor: disabled ? "not-allowed" : "pointer",
                  padding: 4,
                  borderRadius: 6,
                  display: "flex",
                }}
              >
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
          padding: 12,
          border: `1.5px dashed ${T.line}`,
          borderRadius: 12,
        }}
      >
        {fields.map((f) => (
          <label key={f.key} style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: T.inkSoft }}>
            {f.label}
            <input
              type="text"
              value={draft[f.key]}
              disabled={disabled}
              placeholder={f.placeholder}
              onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (canAdd) addClass();
                }
              }}
              style={{
                width: "100%",
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: 14,
                padding: "8px 10px",
                border: `1px solid ${T.line}`,
                borderRadius: 8,
                outline: "none",
                background: T.card,
                color: T.ink,
              }}
            />
          </label>
        ))}
        <button
          type="button"
          disabled={disabled || !canAdd}
          onClick={addClass}
          style={{
            gridColumn: "1 / -1",
            marginTop: 2,
            background: canAdd ? T.green : T.greenSoft,
            color: canAdd ? "#fff" : T.inkSoft,
            border: "none",
            borderRadius: 10,
            padding: "10px 14px",
            cursor: disabled || !canAdd ? "not-allowed" : "pointer",
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontSize: 13,
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <Plus style={{ width: 14, height: 14 }} />
          {classes.length === 0 ? "Add first class" : "Add another class"}
        </button>
      </div>
    </div>
  );
}

// School typeahead — queries /api/schools (College Scorecard proxy) as the student
// types and shows matching institutions. Selecting one stores its name; the student
// can also just type a school we don't return and keep it (free-text fallback).
function SchoolTypeahead({
  value,
  placeholder,
  disabled,
  onChange,
}: {
  value: string;
  placeholder?: string;
  disabled: boolean;
  onChange: (v: string) => void;
}) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<{ id: number; name: string; city: string; state: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Debounced fetch. Skips queries under 2 chars (matches the API's own guard) and
  // when the box is showing an already-selected value.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/schools?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (!cancelled) setResults(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  // Close the dropdown on outside click.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={boxRef} style={{ position: "relative", width: "100%" }}>
      <input
        type="text"
        autoFocus
        placeholder={placeholder}
        value={query}
        disabled={disabled}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className="ca-onboard-input"
        style={{
          width: "100%",
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontSize: 17,
          padding: "14px 16px",
          border: `1.5px solid ${T.line}`,
          borderRadius: 10,
          outline: "none",
          background: T.card,
          color: T.ink,
        }}
      />
      {open && query.trim().length >= 2 && (results.length > 0 || loading) && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 20,
            background: T.card,
            border: `1.5px solid ${T.line}`,
            borderRadius: 10,
            boxShadow: "0 12px 30px -12px rgba(26,36,33,.25)",
            maxHeight: 260,
            overflowY: "auto",
          }}
        >
          {loading && results.length === 0 ? (
            <div style={{ padding: "12px 14px", fontSize: 14, color: T.inkSoft }}>Searching…</div>
          ) : (
            results.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  onChange(r.name);
                  setQuery(r.name);
                  setOpen(false);
                }}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  border: "none",
                  background: "transparent",
                  padding: "11px 14px",
                  cursor: "pointer",
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  fontSize: 15,
                  color: T.ink,
                  borderBottom: `1px solid ${T.paper}`,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = T.greenSoft)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span style={{ fontWeight: 500 }}>{r.name}</span>
                {(r.city || r.state) && (
                  <span style={{ color: T.inkSoft, fontSize: 13 }}>
                    {" "}
                    · {[r.city, r.state].filter(Boolean).join(", ")}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Grouped, searchable dropdown for majors/minors. Renders a search box that filters
// the curated list; picking an option stores its label. "Other (type your own)" lets
// the student enter a value we don't list.
function MajorSelect({
  value,
  placeholder,
  groups,
  extraOptions,
  disabled,
  onChange,
}: {
  value: string;
  placeholder?: string;
  groups: MajorGroup[];
  extraOptions?: string[];
  disabled: boolean;
  onChange: (v: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const q = query.trim().toLowerCase();
  const filteredGroups = groups
    .map((g) => ({ label: g.label, majors: g.majors.filter((m) => !q || m.toLowerCase().includes(q)) }))
    .filter((g) => g.majors.length > 0);
  const filteredExtras = (extraOptions ?? []).filter((o) => !q || o.toLowerCase().includes(q));

  // Free-text entry once the student picks "Other (type your own)".
  if (customMode) {
    return (
      <div style={{ width: "100%" }}>
        <input
          type="text"
          autoFocus
          placeholder="Type your major..."
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="ca-onboard-input"
          style={{
            width: "100%",
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontSize: 17,
            padding: "14px 16px",
            border: `1.5px solid ${T.line}`,
            borderRadius: 10,
            outline: "none",
            background: T.card,
            color: T.ink,
          }}
        />
        <button
          type="button"
          onClick={() => {
            setCustomMode(false);
            onChange("");
          }}
          style={{
            marginTop: 10,
            border: "none",
            background: "transparent",
            color: T.inkSoft,
            fontSize: 13,
            cursor: "pointer",
            textDecoration: "underline",
            textUnderlineOffset: 2,
          }}
        >
          Back to the list
        </button>
      </div>
    );
  }

  return (
    <div ref={boxRef} style={{ position: "relative", width: "100%" }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          textAlign: "left",
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontSize: 17,
          padding: "14px 16px",
          border: `1.5px solid ${T.line}`,
          borderRadius: 10,
          background: T.card,
          color: value ? T.ink : T.inkSoft,
          cursor: disabled ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {value || placeholder || "Select…"}
        <span style={{ color: T.inkSoft, fontSize: 12 }}>▾</span>
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 20,
            background: T.card,
            border: `1.5px solid ${T.line}`,
            borderRadius: 10,
            boxShadow: "0 12px 30px -12px rgba(26,36,33,.25)",
            maxHeight: 300,
            overflowY: "auto",
          }}
        >
          <div style={{ position: "sticky", top: 0, background: T.card, padding: 8, borderBottom: `1px solid ${T.paper}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", border: `1.5px solid ${T.line}`, borderRadius: 8 }}>
              <Search style={{ width: 15, height: 15, color: T.inkSoft, flexShrink: 0 }} />
              <input
                type="text"
                autoFocus
                placeholder={placeholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{
                  border: "none",
                  outline: "none",
                  width: "100%",
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  fontSize: 15,
                  background: "transparent",
                  color: T.ink,
                }}
              />
            </div>
          </div>
          {filteredExtras.map((opt) => (
            <MajorOption key={opt} label={opt} onPick={() => { onChange(opt); setOpen(false); }} />
          ))}
          {filteredGroups.map((g) => (
            <div key={g.label}>
              <div style={{ padding: "8px 14px 4px", fontSize: 11, fontWeight: 700, color: T.inkSoft, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {g.label}
              </div>
              {g.majors.map((m) => {
                const isCustom = m.toLowerCase().startsWith("other");
                return (
                  <MajorOption
                    key={m}
                    label={m}
                    onPick={() => {
                      if (isCustom) {
                        setCustomMode(true);
                        onChange("");
                      } else {
                        onChange(m);
                      }
                      setOpen(false);
                    }}
                  />
                );
              })}
            </div>
          ))}
          {filteredGroups.length === 0 && filteredExtras.length === 0 && (
            <div style={{ padding: "12px 14px", fontSize: 14, color: T.inkSoft }}>No matches.</div>
          )}
        </div>
      )}
    </div>
  );
}

function MajorOption({ label, onPick }: { label: string; onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        border: "none",
        background: "transparent",
        padding: "10px 14px",
        cursor: "pointer",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        fontSize: 15,
        color: T.ink,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = T.greenSoft)}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {label}
    </button>
  );
}
