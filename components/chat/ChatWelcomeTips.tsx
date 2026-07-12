"use client";

import { Blocks, Compass, GraduationCap, BookOpen, CalendarDays, Target, Sparkles } from "lucide-react";

// The Chat empty-state onboarding: a friendly "here's what I already know about you"
// recap (pulled from the intake) plus a few getting-started tips (connect tools, find
// your way around, just ask). Shows only on a fresh/empty chat, so it never clutters an
// active conversation. Pure presentation — the recap chips render only when the fact exists.

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}
function firstOf(v: unknown): string {
  if (Array.isArray(v)) return str(v[0]);
  return str(v);
}

export function ChatWelcomeTips({
  agentName,
  intake,
  classesCount,
}: {
  agentName?: string | null;
  intake?: Record<string, unknown> | null;
  classesCount: number;
}) {
  const name = agentName?.trim() || "your College Agent";
  const school = str(intake?.school);
  const major = str(intake?.major);
  const goal = str(intake?.academicGoal) || firstOf(intake?.topPriority) || firstOf(intake?.agentHandleFirst);

  const facts: { icon: typeof GraduationCap; label: string }[] = [];
  if (school) facts.push({ icon: GraduationCap, label: school });
  if (major) facts.push({ icon: BookOpen, label: major });
  if (classesCount > 0) facts.push({ icon: CalendarDays, label: `${classesCount} class${classesCount === 1 ? "" : "es"}` });
  if (goal) facts.push({ icon: Target, label: goal });

  const tips = [
    {
      icon: Blocks,
      title: "Connect your tools",
      body: "Open the Integrations tab in the sidebar to link Gmail, Canvas, your calendar, and 250+ apps. Once they're connected, I can act on them, not just talk about them.",
    },
    {
      icon: Compass,
      title: "Find your way around",
      body: "Your sidebar: Start Here (the guide), Checklist, Chat (you're here), Integrations, Refer & Earn, API Credits, and Settings.",
    },
    {
      icon: Sparkles,
      title: "Just ask",
      body: "Try “What's due this week?”, “Turn my syllabus into a study plan,” or “Draft an email to my professor.” The more you tell me, the sharper I get.",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 text-left">
      {facts.length > 0 && (
        <div className="rounded-2xl border bg-secondary/40 px-5 py-4">
          <p className="text-sm font-medium text-foreground">
            Here&apos;s what I already know about you:
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {facts.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs font-medium text-foreground/80"
              >
                <Icon className="h-3.5 w-3.5 text-[var(--ca-green-text,#3d8b3d)]" />
                {label}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            It&apos;s all in {name}&apos;s memory, so you never have to repeat yourself. Update it
            anytime from the Checklist tab.
          </p>
        </div>
      )}

      <div className="rounded-2xl border bg-background px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          New here? Three quick tips
        </p>
        <ul className="mt-3 space-y-3">
          {tips.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground/70">
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-foreground">{title}</span>
                <span className="block text-xs leading-relaxed text-muted-foreground">{body}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
