"use client";

import { WelcomeView } from "@/components/WelcomeView";
import { NowWhatView } from "@/components/NowWhatView";
import { ShortcutsView } from "@/components/ShortcutsView";
import { type OnboardPrefill } from "@/components/ConversationalOnboard";

// "Start Here" combines the old Welcome, Now what?, and Shortcuts tabs into one
// orientation surface. Pre-agent it's just the conversational onboarding (WelcomeView
// handles that). Once the agent exists and onboarding is done, it stacks: the greeting
// + Open Chat, then the "first moves" guide, then the example prompts.
export function StartHereView({
  firstName,
  agentName,
  avatarUrl,
  onOpenChat,
  onboardDone,
  hasAgent,
  userId,
  onboardPrefill,
}: {
  firstName: string | null;
  agentName?: string | null;
  avatarUrl?: string | null;
  onOpenChat: () => void;
  onboardDone: boolean;
  hasAgent: boolean;
  userId: string;
  onboardPrefill: OnboardPrefill | null;
}) {
  return (
    <div className="space-y-12">
      <WelcomeView
        firstName={firstName}
        agentName={agentName}
        avatarUrl={avatarUrl}
        onOpenChat={onOpenChat}
        onboardDone={onboardDone}
        hasAgent={hasAgent}
        userId={userId}
        onboardPrefill={onboardPrefill}
      />

      {/* The guide + example prompts only make sense once there's a live agent to talk to. */}
      {hasAgent && onboardDone && (
        <>
          <div className="mx-auto max-w-3xl border-t border-[var(--ca-line)]" />
          <NowWhatView onOpenChat={onOpenChat} avatarUrl={avatarUrl} agentName={agentName} />
          <div className="mx-auto max-w-3xl border-t border-[var(--ca-line)]" />
          <ShortcutsView />
        </>
      )}
    </div>
  );
}
