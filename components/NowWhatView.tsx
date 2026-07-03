"use client";

import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dashboardPath } from "@/lib/dashboard-tabs";

// First-week orientation for a student whose agent just came to life: a short, numbered
// tour of what to actually DO with it. Static content, no API calls. Deeper prompt
// inspiration lives in Shortcuts; plumbing lives in Integrations. This page just gets
// them talking.

type Step = {
  title: string;
  body: string;
  // Optional example the student can copy into Chat verbatim.
  prompt?: string;
};

const STEPS: Step[] = [
  {
    title: "Just start talking",
    body: "Speak to your agent like a person. Ask it questions. It already knows your classes, your schedule, and how you like to work from your intake.",
    prompt: "What should I be focused on this week?",
  },
  {
    title: "Ask about your schedule",
    body: "Your agent keeps your week in its head so you don't have to.",
    prompt: "What does my Tuesday look like?",
  },
  {
    title: "Put your integrations to work",
    body: "Once Gmail or your calendar is connected, ask your agent to manage them for you. Anything else you use lives under Integrations.",
    prompt: "Check my Gmail for anything from my professors and summarize it.",
  },
  {
    title: "Send it to your school's website",
    body: "Your agent can browse the web on your behalf and bring back what matters.",
    prompt:
      "Go to my school's website, pull everything about fall semester I need to know about, and put the important dates on my calendar.",
  },
  {
    title: "Let it plan real life too",
    body: "Trips, visits, logistics. It handles more than homework.",
    prompt:
      "I'm looking to visit Chloe at the University of Miami the first week of August. Can you help me make arrangements, including best flights?",
  },
  {
    title: "Tell it your quiz and test schedule",
    body: "Once your agent knows what's coming, it can remind you, build study plans, and quiz you before the real thing.",
    prompt: "Here's my quiz and test schedule for the semester.",
  },
  {
    title: "Feed it your notes",
    body: "Update your notes as you get them. If you already have them, drag and drop them right into Chat and your agent keeps them organized and searchable.",
  },
  {
    title: "Sort out a class, one at a time",
    body: "Pick a class and let your agent get the whole semester squared away: readings, due dates, study blocks.",
    prompt: "Let's get Bio 201 sorted out for the semester.",
  },
  {
    title: "Share links, books, and syllabi",
    body: "Have a link to a book? Syllabus information? Share it with your agent and it becomes part of what it knows about you.",
  },
];

export function NowWhatView({ onOpenChat }: { onOpenChat: () => void }) {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Compass className="h-5 w-5" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Now what?</h1>
        </div>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Welcome. Now that you have your agent, what do I do? Here are the first moves. You can
          copy any example straight into Chat, or say it your own way.
        </p>
      </div>

      <ol className="space-y-3">
        {STEPS.map((step, i) => (
          <li key={step.title} className="rounded-xl border bg-card p-5">
            <div className="flex items-start gap-4">
              <span className="flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold leading-tight">{step.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
                {step.prompt && (
                  <p className="mt-2.5 rounded-lg bg-secondary/60 px-3.5 py-2.5 text-sm italic text-foreground/90">
                    &ldquo;{step.prompt}&rdquo;
                  </p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div className="rounded-xl border bg-card p-6">
        <h2 className="text-base font-semibold">That's it. The rest is conversation.</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The more you share with your agent, the more useful it gets. When you want more ideas,
          browse <span className="font-medium text-foreground">Shortcuts</span>; to plug in your
          tools, head to <span className="font-medium text-foreground">Integrations</span>.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={onOpenChat}>
            Open chat
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button asChild variant="outline">
            <Link href={dashboardPath("shortcuts")} prefetch={false}>
              Browse Shortcuts
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
