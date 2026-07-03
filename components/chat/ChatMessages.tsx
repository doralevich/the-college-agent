"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, ChevronDown, ChevronRight, FileText, Image as ImageIcon, Loader2, User, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { Markdown } from "./Markdown";
import type { ChatMessage, MessageAttachment, ToolEvent } from "./types";

// The agent's face beside its messages — the intake avatar (uploaded or preset) when one
// exists, the default mascot otherwise. Storage URLs aren't in next/image's remote list,
// so uploaded avatars render through a plain img (same idiom as WelcomeView).
function AgentBadge({ src }: { src?: string | null }) {
  return (
    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-background">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <Image src="/thecollegeagent.png" alt="" width={28} height={28} className="h-full w-full object-contain p-0.5" />
      )}
    </span>
  );
}

// The student's marker beside their messages: first initial in a brand-tinted circle
// (a neutral person glyph if we somehow have no name or email to take a letter from).
function UserBadge({ initial }: { initial: string }) {
  return (
    <span
      aria-hidden
      className="mt-0.5 flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
    >
      {initial || <User className="h-3.5 w-3.5" />}
    </span>
  );
}

// Files that rode along with a user turn, shown as compact chips above the message bubble.
function MessageAttachments({ attachments }: { attachments: MessageAttachment[] }) {
  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      {attachments.map((a, k) => (
        <span
          key={`${a.path}-${k}`}
          title={a.name}
          className="flex items-center gap-1.5 rounded-lg border bg-secondary/60 px-2 py-1 text-xs text-foreground"
        >
          {a.isImage ? (
            <ImageIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
          <span className="max-w-[12rem] truncate">{a.name}</span>
        </span>
      ))}
    </div>
  );
}

function ThinkingBlock({ content, live }: { content: string; live: boolean }) {
  const [open, setOpen] = useState(live);
  if (!content) return null;
  return (
    <div className="mb-2">
      <button
        onClick={() => setOpen(!open)}
        className="-ml-1 inline-flex items-center gap-1 rounded-md px-1 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        <span>{live ? "Thinking…" : "Thought process"}</span>
        {live && <Loader2 className="h-3 w-3 animate-spin" />}
      </button>
      {open && (
        <div className="mt-1 max-h-60 overflow-y-auto whitespace-pre-wrap break-words border-l-2 border-border pl-3 text-xs leading-relaxed text-muted-foreground">
          {content}
        </div>
      )}
    </div>
  );
}

function ToolChip({ tool }: { tool: ToolEvent }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs",
        tool.status === "error" ? "border-destructive/40 text-destructive" : "border-border text-muted-foreground"
      )}
    >
      <Wrench className="h-3.5 w-3.5 shrink-0" />
      <span className="font-medium capitalize">{tool.tool.replace(/_/g, " ")}</span>
      {tool.label && <span className="max-w-[12rem] truncate font-mono opacity-70">{tool.label}</span>}
      {tool.status === "running" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {tool.status === "completed" && <Check className="h-3.5 w-3.5" />}
      {tool.durationMs != null && <span className="ml-auto tabular-nums opacity-60">{(tool.durationMs / 1000).toFixed(1)}s</span>}
    </div>
  );
}

// Bigger, higher-contrast "..." with a staggered bounce. Telegram-style — visible the whole time
// the agent is generating, until the first content chunk arrives.
function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-2" aria-label="Agent is typing">
      {[0, 150, 300].map((d) => (
        <span
          key={d}
          className="h-2 w-2 animate-bounce rounded-full bg-foreground/60"
          style={{ animationDelay: `${d}ms` }}
        />
      ))}
    </span>
  );
}

export function ChatMessages({
  messages,
  isStreaming,
  agentAvatarUrl,
  userInitial = "",
}: {
  messages: ChatMessage[];
  isStreaming: boolean;
  // Intake avatar for the agent's messages; null falls back to the default mascot.
  agentAvatarUrl?: string | null;
  // Student's first initial for their message marker.
  userInitial?: string;
}) {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-5 px-5 py-6">
      {messages.map((m, i) => {
        if (m.role === "user") {
          const attachments = m.attachments ?? [];
          return (
            <div key={m.id} className="flex items-start justify-end gap-2">
              <div className="flex min-w-0 max-w-[85%] flex-col items-end gap-1.5">
                {attachments.length > 0 && <MessageAttachments attachments={attachments} />}
                {m.content && (
                  <div className="whitespace-pre-wrap break-words rounded-[18px] bg-secondary px-3.5 py-2 text-sm text-foreground">
                    {m.content}
                  </div>
                )}
              </div>
              <UserBadge initial={userInitial} />
            </div>
          );
        }

        const lastAssistant = i === messages.length - 1 && m.role === "assistant";
        const tools = m.tools ?? [];
        // Show the Telegram-style dots whenever the agent is generating and no markdown content
        // has streamed yet — even if a thinking block or tool chip is already visible. That way
        // the student always sees an obvious "something is happening" cue, not just a subtle
        // spinner buried in the thinking dropdown.
        const showDots = lastAssistant && isStreaming && !m.content;

        return (
          <div key={m.id} className="flex items-start justify-start gap-2.5">
            <AgentBadge src={agentAvatarUrl} />
            <div className="min-w-0 flex-1">
              {m.thinking && <ThinkingBlock content={m.thinking} live={lastAssistant && isStreaming && !m.content} />}
              {tools.length > 0 && (
                <div className="mb-3 space-y-2">
                  {tools.map((t, k) => (
                    <ToolChip key={`${t.tool}-${k}`} tool={t} />
                  ))}
                </div>
              )}
              {m.content ? <Markdown content={m.content} /> : null}
              {showDots && (
                <div className={m.thinking || tools.length > 0 ? "mt-2" : undefined}>
                  <TypingDots />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
