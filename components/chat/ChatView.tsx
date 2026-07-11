"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { DropOverlay } from "./Attachments";
import { ChatComposer } from "./ChatComposer";
import { ChatMessages } from "./ChatMessages";
import { NewChatTopBar } from "./NewChatTopBar";
import { useChatContext } from "./ChatProvider";
import { useChat } from "./useChat";
import { useChatAttachments } from "./useChatAttachments";

// The conversation pane, rendered full-height in the dashboard main when the Chat tab is active.
// Empty state = a centered greeting + big composer; once there are messages it becomes a scrolling
// transcript with the composer docked at the bottom. The composer is kept at a STABLE position in
// the tree across both states so it never remounts (preserving the draft, model, and effort
// selection through the first send).

type ClassInfo = { name: string; days: string; time: string };

// Per-weekday tokens matched (whole-word, case-insensitive) against the free-text `days`
// a student typed for each class ("Mon / Wed / Fri", "Tues & Thurs", "Friday"). Compact
// no-separator forms like "MWF" won't match — acceptable for a greeting garnish.
const DAY_TOKENS: string[][] = [
  ["sun", "sunday"],
  ["mon", "monday"],
  ["tue", "tues", "tuesday"],
  ["wed", "weds", "wednesday"],
  ["thu", "thur", "thurs", "thursday"],
  ["fri", "friday"],
  ["sat", "saturday"],
];

function classIsToday(days: string): boolean {
  const tokens = DAY_TOKENS[new Date().getDay()];
  const norm = days.toLowerCase();
  return tokens.some((t) => new RegExp(`\\b${t}\\b`).test(norm));
}

// Heuristic: does a send failure look like the agent's AI budget ran dry? The gateway's
// wording isn't under our control, so match the family of phrasings rather than one string.
// A false positive still shows a helpful card with the real path to fixing most outages.
function isOutOfCreditsError(message: string): boolean {
  return /budget|credit|insufficient|quota|payment required|\b402\b/i.test(message);
}

export function ChatView({
  firstName,
  classes = [],
  accent,
  avatarUrl,
}: {
  // Student's first name from the intake — greets them on the empty state.
  firstName?: string | null;
  // Structured class list from the intake; classes matching today's weekday show
  // as a "Today: ..." line under the greeting.
  classes?: ClassInfo[];
  // School brand color (or the College Agent green fallback) — renders as a faint
  // wash from the top of the pane so the chat feels like the student's school.
  accent?: string;
  // Intake avatar shown beside the agent's messages (default mascot when null).
  avatarUrl?: string | null;
}) {
  const { userEmail } = useWorkspace();
  const {
    agentId,
    sessions,
    activeSessionId,
    composerFocusToken,
    requestComposerFocus,
    composerSeed,
    seedComposer,
    startNewChat,
    onSessionCreated,
    bumpSession,
  } = useChatContext();
  const { messages, isStreaming, loadingHistory, error, send, stop } = useChat({
    agentId,
    sessionId: activeSessionId,
    onSessionCreated,
    onActivity: bumpSession,
  });

  // Attachment state lives here (not in the composer) so the ENTIRE pane is a drop zone — a file
  // dropped anywhere over the transcript or composer lands in the same tray. A landed attachment
  // refocuses the composer through the same shared signal selecting/creating a thread uses.
  const att = useChatAttachments(agentId, requestComposerFocus);
  const { clearFiles } = att;

  // Switching threads / starting a new chat empties the staged tray, so a file picked for one
  // conversation can't silently ride along into the next.
  useEffect(() => {
    clearFiles();
  }, [activeSessionId, clearFiles]);

  const scrollRef = useRef<HTMLDivElement>(null);
  // Whether the user is pinned near the bottom — controls whether new tokens auto-scroll.
  const stickRef = useRef(true);

  const onScroll = () => {
    const el = scrollRef.current;
    if (el) stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  // Follow the stream only when the user is already near the bottom.
  useEffect(() => {
    if (!stickRef.current) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loadingHistory]);

  const showWelcome = !loadingHistory && messages.length === 0;
  // Memoized so the per-token re-renders during streaming don't re-scan the thread list.
  const activeTitle = useMemo(
    () => sessions.find((s) => s.session_id === activeSessionId)?.title?.trim(),
    [sessions, activeSessionId]
  );
  const headerTitle = activeTitle || (activeSessionId ? "Chat" : "New chat");

  // Greeting bits for the empty state. Computed client-side so the time of day and
  // "today" follow the student's local clock. Memoized per mount — a chat session
  // won't straddle a greeting boundary in any way worth re-rendering for.
  const timeOfDay = useMemo(() => {
    const h = new Date().getHours();
    return h < 12 ? "good morning" : h < 17 ? "good afternoon" : "good evening";
  }, []);
  const todaysClasses = useMemo(() => classes.filter((c) => c.days && classIsToday(c.days)), [classes]);
  const greetName = firstName?.trim() || "there";
  const userInitial = (firstName?.trim()?.[0] || userEmail?.[0] || "").toUpperCase();

  return (
    <div
      className="relative flex h-full min-h-0 flex-col"
      // A faint top wash in the school's color (~9% alpha hex suffix), dissolving to
      // transparent. Subtle by design: identity, not decoration.
      style={accent ? { background: `linear-gradient(180deg, ${accent}17 0%, transparent 360px)` } : undefined}
      {...att.dragHandlers}
    >
      {att.dragOver && <DropOverlay />}
      <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background/80 px-6 backdrop-blur-sm md:px-10">
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold text-foreground">{headerTitle}</h1>
        </div>
        <button
          type="button"
          onClick={startNewChat}
          aria-label="New chat"
          title="New chat"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
        </button>
      </header>
      {/* Top: scrolling transcript when there are messages; the centered welcome panel when
          empty (justify-end seats it just above the composer). */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className={cn(
          "min-h-0",
          showWelcome
            ? "flex flex-1 flex-col items-center justify-end gap-6 overflow-y-auto px-4 pb-6 pt-5"
            : "flex-1 overflow-y-auto overflow-x-hidden"
        )}
      >
        {loadingHistory ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : messages.length > 0 ? (
          <ChatMessages
            messages={messages}
            isStreaming={isStreaming}
            agentAvatarUrl={avatarUrl}
            userInitial={userInitial}
          />
        ) : (
          <>
            {/* Greeting leads; the weather banner + quick actions sit beneath it, and the
                whole group seats just above the composer (justify-end on the wrapper). */}
            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="text-[26px] font-semibold tracking-tight text-foreground sm:text-[30px]">
                Hi {greetName}, {timeOfDay}.
              </h1>
              {todaysClasses.length > 0 && (
                <p className="max-w-xl text-sm text-muted-foreground">
                  Today:{" "}
                  {todaysClasses
                    .map((c) => (c.time ? `${c.name} at ${c.time}` : c.name))
                    .join(" · ")}
                </p>
              )}
              <p className="text-lg text-foreground/75">How can I help you today?</p>
            </div>

            <NewChatTopBar classes={classes} accent={accent} onSeed={seedComposer} />
          </>
        )}
      </div>

      {/* Composer wrapper — the STABLE 2nd child. Its chrome (docked vs bare centered) is a
          className swap so the ChatComposer inside never changes tree position. */}
      <div className={cn("relative", showWelcome ? "w-full px-6 md:px-10" : "bg-background px-6 py-3 md:px-10 sm:py-4")}>
        {/* No hard divider — a short fade dissolves the transcript into the composer instead. */}
        {!showWelcome && (
          <div className="pointer-events-none absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-background to-transparent" />
        )}
        <div className={cn("mx-auto w-full", showWelcome ? "max-w-2xl" : "max-w-3xl")} aria-live="polite">
          {error &&
            (isOutOfCreditsError(error) ? (
              <div className="mb-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                <p className="font-semibold">Your agent is out of AI credits.</p>
                <p className="mt-0.5">
                  Add credits and this conversation picks up right where you left off.
                </p>
                <Link
                  href="/dashboard/credits"
                  className="mt-1.5 inline-block font-semibold underline underline-offset-2"
                >
                  Add credits
                </Link>
              </div>
            ) : (
              <p className="mb-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
            ))}
        </div>
        <ChatComposer
          agentId={agentId}
          isStreaming={isStreaming}
          att={att}
          onSend={send}
          onStop={stop}
          large={showWelcome}
          focusToken={composerFocusToken}
          seed={composerSeed}
        />
      </div>

      {/* Bottom: balances the vertical centering on the welcome state. */}
      {showWelcome && (
        <div className="flex flex-1 flex-col items-center px-4 pt-3">
          <p className="text-sm text-muted-foreground">
            The more context you give, the better your agent can help.
          </p>
        </div>
      )}
    </div>
  );
}
