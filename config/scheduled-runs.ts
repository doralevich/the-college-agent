// The things an agent does on a clock, rather than because it was asked.
//
// A scheduled run is the one moment the agent starts the conversation, so each of these has to
// earn the interruption. They are deliberately few, and each answers a different question a
// student actually has at that hour - not the same summary three times a day.
//
// Adding a fourth is an entry here. lib/checkin-schedules.ts reads this registry for the prompt
// and the sweep, the setup panel renders one card per entry, and the API validates against it;
// none of them needs changing. A row in the database whose kind is NOT here is skipped rather
// than run with a guessed prompt.

export type ScheduledRunId = "morning-brief" | "end-of-day" | "weekly-planning";

export type ScheduledRun = {
  id: ScheduledRunId;
  name: string;
  /** One line on the card. What arrives, in the student's terms. */
  description: string;
  /** Local hour it starts at when first turned on. */
  defaultHour: number;
  /** 'daily' | 'weekdays' | comma-separated weekday names. */
  defaultDays: string;
  /**
   * What the agent is asked to do. Cron runs open a FRESH session with no memory of the chat,
   * so each prompt has to stand alone - it cannot refer back to anything said earlier.
   *
   * Every one ends by allowing [SILENT]. An agent that messages every single morning whether or
   * not it has anything to say is one a student mutes inside a week, and a muted agent is worth
   * less than no agent because they stop looking at it.
   */
  prompt: (ctx: { who: string; topics: string; priority: string }) => string;
};

export const SCHEDULED_RUNS: ScheduledRun[] = [
  {
    id: "morning-brief",
    name: "Morning brief",
    description: "Today's classes, what's due, and what to start with.",
    defaultHour: 8,
    defaultDays: "daily",
    prompt: ({ who, topics, priority }) =>
      [
        `Morning brief for ${who}. You are their personal college agent.`,
        `Look at today: classes and where they have to be, anything due today or tomorrow, and`,
        `anything waiting on a reply. Watch for ${topics}.`,
        priority ? `Keep their top priority (${priority}) in view.` : "",
        `Give them the few things that matter this morning and what to start with. Short and`,
        `concrete - they are reading this between waking up and leaving. If there is genuinely`,
        `nothing worth flagging, reply with only [SILENT].`,
      ]
        .filter(Boolean)
        .join(" "),
  },
  {
    id: "end-of-day",
    name: "End of day",
    description: "What got done, what slipped, and what to set up for tomorrow.",
    defaultHour: 17,
    defaultDays: "weekdays",
    prompt: ({ who, topics, priority }) =>
      [
        `End-of-day check for ${who}. You are their personal college agent.`,
        `Close the day out: what moved, what did NOT and is now more urgent, and the one or two`,
        `things worth setting up tonight so tomorrow starts well. Watch for ${topics}.`,
        priority ? `Their top priority is ${priority}.` : "",
        `Be honest about what slipped rather than encouraging - a summary that says everything is`,
        `fine when it is not is worse than silence. If nothing changed today and nothing is`,
        `pressing, reply with only [SILENT].`,
      ]
        .filter(Boolean)
        .join(" "),
  },
  {
    id: "weekly-planning",
    name: "Weekly planning",
    description: "The week ahead, big deadlines, and when to start on them.",
    // Sunday evening: late enough that the weekend happened, early enough to act on.
    defaultHour: 18,
    defaultDays: "sunday",
    prompt: ({ who, topics, priority }) =>
      [
        `Weekly planning for ${who}. You are their personal college agent.`,
        `Look at the week ahead, not just the next day: exams, papers and projects due this week`,
        `and next, which of them need starting NOW rather than the night before, and where the`,
        `week is overloaded. Watch for ${topics}.`,
        priority ? `Their top priority this semester is ${priority}.` : "",
        `Say what to start this week and roughly when. Naming the one thing most likely to be`,
        `left too late is worth more than a complete list. If the week genuinely holds nothing`,
        `that needs planning, reply with only [SILENT].`,
      ]
        .filter(Boolean)
        .join(" "),
  },
];

const BY_ID = new Map<ScheduledRunId, ScheduledRun>(SCHEDULED_RUNS.map((r) => [r.id, r]));

export function scheduledRun(id: string): ScheduledRun | undefined {
  return BY_ID.get(id as ScheduledRunId);
}

export function isScheduledRunId(value: string): value is ScheduledRunId {
  return BY_ID.has(value as ScheduledRunId);
}
