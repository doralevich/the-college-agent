"use client";

import { Calendar, GraduationCap, Mail, BookOpen, Briefcase, ListChecks, FolderOpen, Sparkles } from "lucide-react";

// A catalog of "what to say to your agent" examples organized by category. Static
// content — no API calls, no state. This page is purely a reference / inspiration
// for students who don't yet know what their agent can do.

type Category = {
  title: string;
  blurb: string;
  icon: typeof Calendar;
  shortcuts: { prompt: string; what: string }[];
};

const CATEGORIES: Category[] = [
  {
    title: "Daily planning",
    blurb: "Start the day with a tight read on what matters most.",
    icon: Calendar,
    shortcuts: [
      { prompt: "What's on my calendar today?", what: "Pull today's events from your connected calendar." },
      { prompt: "What's due this week?", what: "Cross-reference your classes and surface deadlines." },
      { prompt: "Plan my day around classes and a 2-hour study block.", what: "Build a time-blocked schedule for today." },
      { prompt: "What's the most important thing I should do right now?", what: "Triages everything into one next action." },
    ],
  },
  {
    title: "Classes & assignments",
    blurb: "Stay on top of the work without rereading every syllabus.",
    icon: GraduationCap,
    shortcuts: [
      { prompt: "Summarize the syllabus I uploaded for Marketing 301.", what: "Distills a PDF down to dates, topics, and grading weight." },
      { prompt: "When's my next exam in Stats II?", what: "Pulls dates from synced course material." },
      { prompt: "Quiz me on the chapter I uploaded.", what: "Generates practice questions from your reading." },
      { prompt: "Outline a 3-page paper on the French Revolution.", what: "Drafts a paper structure to fill in." },
    ],
  },
  {
    title: "Email & communication",
    blurb: "Faster, cleaner messages, without losing your voice.",
    icon: Mail,
    shortcuts: [
      { prompt: "Draft an email to my professor asking for an extension on Friday's paper.", what: "Polite, specific, ready to send." },
      { prompt: "Show me unread emails from my professors.", what: "Filters your inbox by sender role." },
      { prompt: "Summarize the last 5 emails in my inbox.", what: "Skim a backlog without opening each one." },
      { prompt: "Reply to the last email from financial aid.", what: "Drafts a context-aware response." },
    ],
  },
  {
    title: "Research & study",
    blurb: "Find, summarize, and explain. Then check your understanding.",
    icon: BookOpen,
    shortcuts: [
      { prompt: "Explain photosynthesis like I'm a first-year bio student.", what: "Adapts to your level." },
      { prompt: "Find 5 recent sources on the gut microbiome and summarize each.", what: "Real-time web search with structured summaries." },
      { prompt: "Compare Hobbes and Locke on the social contract.", what: "Side-by-side breakdowns for essays and exams." },
      { prompt: "Make a one-page study sheet for my biology midterm.", what: "Condenses your notes into a study guide." },
    ],
  },
  {
    title: "Career & internships",
    blurb: "Stop tab-juggling. Let your agent do the legwork.",
    icon: Briefcase,
    shortcuts: [
      { prompt: "Find 10 marketing internships open to juniors in NYC for next summer.", what: "Live search with role / location / class-year filters." },
      { prompt: "Tailor my resume for this job description.", what: "Highlights relevant experience for a posting." },
      { prompt: "Draft a cover letter for the analyst role at McKinsey.", what: "Personalized, role-specific, in your voice." },
      { prompt: "Prep me for a behavioral interview tomorrow.", what: "Common questions plus tailored STAR answers." },
    ],
  },
  {
    title: "Scheduling & reminders",
    blurb: "Set it once. Your agent remembers from there.",
    icon: ListChecks,
    shortcuts: [
      { prompt: "Remind me to email my advisor every Monday at 10am.", what: "Recurring nudge until you say stop." },
      { prompt: "Block 6-8pm Tuesday for the group project.", what: "Adds a calendar event with context." },
      { prompt: "Move my study session if I have a conflict.", what: "Resolves clashes automatically." },
      { prompt: "What's the rest of my week look like?", what: "Compresses 5-7 days into a quick read." },
    ],
  },
  {
    title: "Files & documents",
    blurb: "Treat your agent like a smart filing cabinet.",
    icon: FolderOpen,
    shortcuts: [
      { prompt: "Find the lecture notes I uploaded last week.", what: "Searches all uploaded files." },
      { prompt: "Pull the key takeaways from this PDF.", what: "Read + summarize any uploaded document." },
      { prompt: "Compare these two versions of my essay.", what: "Side-by-side diff with editorial notes." },
      { prompt: "Turn this into bullet points I can paste into my slide deck.", what: "Reformats prose into deck-ready bullets." },
    ],
  },
  {
    title: "Quick wins",
    blurb: "Tiny prompts, outsized leverage.",
    icon: Sparkles,
    shortcuts: [
      { prompt: "What did I miss in class yesterday?", what: "If you've uploaded notes, surfaces the gap." },
      { prompt: "Help me say no to this commitment kindly.", what: "Drafts a graceful decline." },
      { prompt: "Reformat this list into a table.", what: "Light-weight formatting on demand." },
      { prompt: "What should I eat tonight?", what: "Because sometimes that's the hardest decision." },
    ],
  },
];

export function ShortcutsView() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Shortcuts</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Ways to talk to your agent, copy any of these into Chat, or use them as inspiration to
          ask in your own words. Your agent works best when you treat it like a smart classmate
          who already has access to your calendar, email, files, and the open web.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <div key={cat.title} className="rounded-lg border bg-card">
              <div className="flex items-center gap-3 border-b px-5 py-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-semibold leading-tight">{cat.title}</h2>
                  <p className="text-xs text-muted-foreground">{cat.blurb}</p>
                </div>
              </div>
              <ul className="divide-y">
                {cat.shortcuts.map((s) => (
                  <li key={s.prompt} className="px-5 py-3">
                    <p className="text-sm font-medium text-foreground">&ldquo;{s.prompt}&rdquo;</p>
                    <p className="mt-1 text-xs text-muted-foreground">{s.what}</p>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Tip: the more you connect (calendar, email, Canvas, Drive), the more shortcuts unlock, 
        head over to <span className="font-medium text-foreground">Integrations</span> to plug
        anything in.
      </p>
    </div>
  );
}
