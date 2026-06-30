"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";

// Conversational replacement for /onboard. Frankenstein asks one question at a time;
// the student answers with text or chip-picks. Each answer is persisted to
// localStorage so a refresh / tab close resumes at the same spot. On completion we
// POST the exact same payload shape the legacy form submits — the provisioner and
// SOUL.md build path stay unchanged.

const T = {
  green: "#2D7A3A",
  greenDeep: "#1B5E2A",
  greenSoft: "#E8F1E6",
  paper: "#F6F8F3",
  card: "#FFFFFF",
  ink: "#1A2421",
  inkSoft: "#5C6660",
  line: "#DEE6DA",
};

const FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=DM+Sans:wght@400;500;600;700&display=swap";

// Voice personas modelled on real, widely-admired public figures (6 men, 6 women).
// The label drives SOUL.md tone — the agent emulates the style, not the person.
const VOICE_OPTIONS = [
  "Steve Jobs, visionary, direct, no filler (male)",
  "Warren Buffett, folksy wisdom, plainspoken, patient (male)",
  "Barack Obama, eloquent, measured, motivational (male)",
  "Tim Ferriss, analytical, curious, productivity-focused (male)",
  "David Attenborough, calm, curious, thoughtful (male)",
  "Anthony Bourdain, candid, witty, honest (male)",
  "Michelle Obama, warm, encouraging, principled (female)",
  "Oprah Winfrey, empathetic, inspiring, big-hearted (female)",
  "Brené Brown, vulnerable, candid, wise (female)",
  "Sara Blakely, entrepreneurial, optimistic, grounded (female)",
  "Mindy Kaling, witty, upbeat, relatable (female)",
  "Serena Williams, fierce, motivational, focused (female)",
];

const CHECKIN_OPTIONS = [
  "Multiple times throughout the day",
  "Daily morning briefing",
  "Twice a week",
  "Weekly digest only",
  "Only when I ask",
  "Real-time, whenever something comes up",
];

// Each step in the conversation. `kind` controls the input UI and validation. `key`
// matches the form-field name the existing /api/onboard-submit endpoint reads.
type Step =
  | { kind: "text"; key: TextKey; prompt: string; placeholder?: string; inputType?: "text" | "email" | "tel"; required?: boolean }
  | { kind: "textarea"; key: TextKey; prompt: string; placeholder?: string; required?: boolean }
  | { kind: "multi"; key: MultiKey; prompt: string; options: string[]; max?: number; required?: boolean }
  | { kind: "single"; key: SingleKey; prompt: string; options: string[]; required?: boolean }
  | { kind: "image"; key: "avatarFile"; prompt: string; required?: boolean }
  | { kind: "intro"; key: "__intro"; prompt: string };

type TextKey =
  | "firstName"
  | "lastName"
  | "agentName"
  | "schoolEmail"
  | "personalEmail"
  | "phone"
  | "school"
  | "topPriority"
  | "agentHandleFirst"
  | "currentClasses"
  | "anythingElse";
type MultiKey = "checkinFrequency";
type SingleKey = "responseStyle";

// `{firstName}` is interpolated from the prop at render time so the intro can greet
// the student by name (pulled from /build lead-capture). Missing → falls back to "there".
const STEPS: Step[] = [
  {
    kind: "intro",
    key: "__intro",
    prompt:
      "Hi {firstName}, nice to meet you. I'm your College Agent. Let's get started by getting to know each other. I'm going to go through a series of questions — feel free to skip any, but I really recommend we do this properly the first time. It only takes a few minutes. Ready? Great!",
  },
  { kind: "text", key: "agentName", prompt: "Before we dive in — what do you want to call me? Pick any name you like, or skip to leave me as your College Agent." },
  { kind: "image", key: "avatarFile", prompt: "Want to give me a face? Upload an image (PNG or JPG), or skip and I'll use the default bot." },
  { kind: "text", key: "firstName", prompt: "Just to confirm — what's your first name?", placeholder: "Jane", required: true },
  { kind: "text", key: "lastName", prompt: "And your last name?", placeholder: "Smith", required: true },
  { kind: "text", key: "schoolEmail", prompt: "What's your school email? I'll use this if I ever need to reach you about your classes.", placeholder: "you@school.edu", inputType: "email", required: true },
  { kind: "text", key: "personalEmail", prompt: "Got a personal email too? I'll use it for non-school stuff.", placeholder: "you@gmail.com", inputType: "email" },
  { kind: "text", key: "phone", prompt: "What's a good phone number? I won't spam you, promise.", placeholder: "+1 (___) ___-____", inputType: "tel", required: true },
  { kind: "text", key: "school", prompt: "Which school are you at?", placeholder: "Your university", required: true },
  {
    kind: "textarea",
    key: "topPriority",
    prompt:
      "What are your primary priorities this semester, this year, and through your college experience? The more you tell me here, the better I can help you later.",
    placeholder: "Academic performance, staying organized, lining up a summer internship, mental health, taking care of myself, prepping for grad school…",
    required: true,
  },
  {
    kind: "textarea",
    key: "agentHandleFirst",
    prompt:
      "What does success look like at the end of this semester, and this year? Be specific where you can — grades, projects, friendships, habits, anything.",
    placeholder: "A 3.8 GPA, a paid internship offer by April, sleeping 7+ hours a night, finishing the screenplay…",
    required: true,
  },
  { kind: "single", key: "responseStyle", prompt: "How do you want me to sound when I talk to you?", options: VOICE_OPTIONS, required: true },
  { kind: "multi", key: "checkinFrequency", prompt: "How often should I check in with you? Pick any that fit.", options: CHECKIN_OPTIONS, required: true },
  { kind: "textarea", key: "currentClasses", prompt: "What classes are you taking this semester? Just dump them, formatting doesn't matter.", placeholder: "Marketing 301, Stats II, Bio Lab Tues/Thu 2pm…", required: true },
  { kind: "textarea", key: "anythingElse", prompt: "Anything else you want me to know? Goals, habits, pressure points, anything." },
];

type FormState = {
  firstName: string;
  lastName: string;
  agentName: string;
  schoolEmail: string;
  personalEmail: string;
  phone: string;
  school: string;
  topPriority: string;
  agentHandleFirst: string;
  responseStyle: string;
  checkinFrequency: string[];
  currentClasses: string;
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
  topPriority: "",
  agentHandleFirst: "",
  responseStyle: "",
  checkinFrequency: [],
  currentClasses: "",
  anythingElse: "",
};

type StoredProgress = { stepIdx: number; form: FormState };

export function ConversationalOnboard({ userId, knownFirstName }: { userId: string; knownFirstName?: string | null }) {
  const router = useRouter();
  const storageKey = `ca-onboard-progress:${userId}`;
  const [form, setForm] = useState<FormState>(EMPTY);
  const [stepIdx, setStepIdx] = useState(0);
  const [restored, setRestored] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Files don't serialize cleanly to localStorage, so avatar lives in component state
  // only — students who refresh mid-flow keep their text answers but re-pick the image.
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const displayFirstName = (form.firstName?.trim() || knownFirstName?.trim() || "there");
  const displayBotName = (form.agentName?.trim() || "your College Agent");

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
        if (parsed.form) setForm({ ...EMPTY, ...parsed.form });
        if (typeof parsed.stepIdx === "number") {
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

  const current = STEPS[stepIdx];
  const isLast = stepIdx === STEPS.length - 1;

  const setField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setError(null);
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  function answerSummary(step: Step): string {
    if (step.kind === "intro") return "Ready, let's go!";
    if (step.kind === "image") return avatarFile ? avatarFile.name : "(using the default bot)";
    const value = form[step.key];
    if (Array.isArray(value)) return value.length ? value.join(", ") : "(skipped)";
    const v = String(value || "").trim();
    if (!v) return "(skipped)";
    return v;
  }

  function isRequired(step: Step): boolean {
    if (step.kind === "intro" || step.kind === "image") return false;
    return !!step.required;
  }

  function isAnswered(step: Step): boolean {
    if (step.kind === "intro") return true;
    if (step.kind === "image") return !!avatarFile;
    const value = form[step.key];
    if (Array.isArray(value)) return value.length > 0;
    return !!String(value || "").trim();
  }

  function validateCurrent(): string | null {
    if (current.kind === "intro") return null;
    if (current.kind === "image") return null;
    if (!current.required) return null;
    if (current.kind === "text" || current.kind === "textarea") {
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
          topPriority: form.topPriority.trim(),
          agentHandleFirst: form.agentHandleFirst.trim(),
          responseStyle: form.responseStyle ? [form.responseStyle] : [],
          checkinFrequency: form.checkinFrequency,
          currentClasses: form.currentClasses.trim(),
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

  const progress = useMemo(() => Math.round(((stepIdx + (submitting ? 1 : 0)) / STEPS.length) * 100), [stepIdx, submitting]);

  return (
    <div
      style={{
        minHeight: "100%",
        background: `radial-gradient(120% 80% at 50% -10%, ${T.greenSoft} 0%, transparent 55%), ${T.paper}`,
        fontFamily: "'DM Sans', system-ui, sans-serif",
        color: T.ink,
        margin: "-16px",
        padding: "32px 4px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        className="ca-onboard-card"
        style={{
          background: T.card,
          width: "100%",
          maxWidth: 640,
          border: `1px solid ${T.line}`,
          borderRadius: 24,
          boxShadow: "0 1px 2px rgba(26,36,33,.04), 0 24px 60px -28px rgba(27,94,42,.28)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "20px 24px 14px", borderBottom: `1px solid ${T.line}`, display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar previewUrl={avatarPreview} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 600, fontSize: 17 }}>{displayBotName}</div>
            <div style={{ fontSize: 12, color: T.inkSoft }}>Question {Math.min(stepIdx + 1, STEPS.length)} of {STEPS.length}</div>
          </div>
          <ProgressBar value={progress} />
        </div>

        <div ref={scrollRef} style={{ flex: 1, padding: "22px 24px 8px", maxHeight: "62vh", minHeight: 380, overflowY: "auto" }}>
          {STEPS.slice(0, stepIdx + 1).map((step, i) => {
            const isCurrent = i === stepIdx;
            const text = step.prompt.replace("{firstName}", displayFirstName);
            return (
              <div key={step.key + i} style={{ marginBottom: 18 }}>
                <BotBubble previewUrl={avatarPreview}>{text}</BotBubble>
                {!isCurrent && (
                  <UserBubble>
                    {answerSummary(step)}
                  </UserBubble>
                )}
              </div>
            );
          })}
          {submitting && (
            <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, color: T.inkSoft, fontSize: 14 }}>
              <Loader2 className="animate-spin" style={{ width: 14, height: 14 }} />
              Saving your answers and building your agent… this can take a minute or two.
            </div>
          )}
        </div>

        <div style={{ borderTop: `1px solid ${T.line}`, padding: "18px 24px 22px" }}>
          {!submitting && (
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
            />
          )}
          {error && <p style={{ marginTop: 10, fontSize: 13, color: "#B23636" }}>{error}</p>}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, gap: 12 }}>
            <span style={{ fontSize: 12, color: T.inkSoft }}>
              Your progress saves automatically. You can close this tab and come back later.
            </span>
            <button
              type="button"
              onClick={advance}
              disabled={submitting || (isRequired(current) && !isAnswered(current))}
              className="ca-onboard-cta"
              style={{
                border: "none",
                cursor: submitting || (isRequired(current) && !isAnswered(current)) ? "not-allowed" : "pointer",
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: 14,
                fontWeight: 600,
                color: "#fff",
                background: T.green,
                padding: "10px 22px",
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
                : current.kind === "intro" ? "I'm ready" : isLast ? "Finish" : "Continue"}
              {!submitting && <Send style={{ width: 14, height: 14 }} />}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .ca-onboard-cta:hover:not(:disabled) { background: ${T.greenDeep}; }
        .ca-onboard-cta:focus-visible { outline: 3px solid ${T.greenSoft}; outline-offset: 3px; }
        @media (max-width: 560px) {
          .ca-onboard-card { border-radius: 16px !important; }
        }
      `}</style>
    </div>
  );
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
}: {
  step: Step;
  form: FormState;
  setField: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  onAdvance: () => void;
  disabled: boolean;
  avatarFile: File | null;
  avatarPreview: string | null;
  setAvatar: (file: File | null) => void;
}) {
  if (step.kind === "intro") {
    return (
      <p style={{ fontSize: 13, color: T.inkSoft, margin: 0 }}>
        Click <span style={{ color: T.green, fontWeight: 600 }}>I&apos;m ready</span> to begin.
      </p>
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
          fontSize: 15,
          padding: "12px 14px",
          border: `1.5px solid ${T.line}`,
          borderRadius: 12,
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
  if (step.kind === "multi") {
    const value = (form[step.key] as string[]) ?? [];
    const atLimit = !!step.max && value.length >= step.max;
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {step.options.map((opt) => {
          const selected = value.includes(opt);
          const tooMany = atLimit && !selected;
          return (
            <button
              key={opt}
              type="button"
              disabled={disabled || tooMany}
              onClick={() => {
                if (selected) setField(step.key, value.filter((v) => v !== opt));
                else setField(step.key, [...value, opt]);
              }}
              style={{
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: 13,
                fontWeight: 500,
                padding: "8px 14px",
                borderRadius: 999,
                border: `1.5px solid ${selected ? T.green : T.line}`,
                background: selected ? T.green : T.card,
                color: selected ? "#fff" : T.ink,
                cursor: disabled || tooMany ? "not-allowed" : "pointer",
                opacity: tooMany ? 0.5 : 1,
                transition: "background .15s, color .15s, border-color .15s",
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
    );
  }
  if (step.kind === "single") {
    const value = form[step.key] as string;
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {step.options.map((opt) => {
          const selected = value === opt;
          return (
            <button
              key={opt}
              type="button"
              disabled={disabled}
              onClick={() => setField(step.key, opt)}
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
              {opt}
            </button>
          );
        })}
      </div>
    );
  }
  return null;
}
