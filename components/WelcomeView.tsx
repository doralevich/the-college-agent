"use client";

import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

// The student's landing page after sign-in. Carries the personalized intro that
// used to live in the empty chat state — keeps Chat itself clean for every
// session after the first.
export function WelcomeView({
  firstName,
  agentName,
  onOpenChat,
}: {
  firstName: string | null;
  agentName: string | null;
  onOpenChat: () => void;
}) {
  const name = firstName?.trim() || "there";
  const bot = agentName?.trim() || "your College Agent";
  return (
    <div className="mx-auto max-w-2xl space-y-6 py-4">
      <h1 className="text-[28px] font-semibold tracking-tight text-foreground sm:text-[34px]">
        Hi {name},
        <br />
        I&apos;m {bot}. Here to help and guide you through your college years (and then some!).
      </h1>

      <p className="text-base leading-relaxed text-muted-foreground">
        First, let me know a little about yourself. Tell me about your academic life, your personal life,
        family, social life, your major, your minor. Tell me anything you want me to know so we can get
        started.
      </p>

      <p className="text-base leading-relaxed text-muted-foreground">
        Then, click on the{" "}
        <span className="font-medium text-foreground">Integrations</span>{" "}
        tab in the sidebar. This is where you customize your experience with programs you already use:
        Email, Google Docs, Outlook, Dropbox, Canvas, Blackbaud. There are thousands of integrations,
        just search and in a few clicks you&apos;re all set.
      </p>

      <p className="text-base leading-relaxed text-muted-foreground">
        Try your email or calendar and then ask{" "}
        <span className="font-medium text-foreground">&ldquo;What&apos;s on my calendar?&rdquo;</span>
      </p>

      <div className="pt-2">
        <Button size="lg" onClick={onOpenChat} className="gap-2">
          <MessageSquare className="h-4 w-4" />
          Open Chat
        </Button>
      </div>
    </div>
  );
}
