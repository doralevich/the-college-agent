"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Blocks, Bot, Check, CreditCard, Home, Loader2, LogOut, MessageSquare, RotateCcw, Settings2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { signOut } from "@/lib/supabase/client";
import { dashboardPath, parseDashboardRoute, type DashboardTabId } from "@/lib/dashboard-tabs";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AgentsView } from "@/components/AgentsView";
import { SettingsView } from "@/components/SettingsView";
import { BillingView } from "@/components/BillingView";
import { ChatProvider, useChatContext } from "@/components/chat/ChatProvider";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatView } from "@/components/chat/ChatView";
import { FilesView } from "@/components/files/FilesView";
import { IntegrationsView } from "@/components/IntegrationsView";
import { ShortcutsView } from "@/components/ShortcutsView";
import { WelcomeView } from "@/components/WelcomeView";
import type { OnboardPrefill } from "@/components/ConversationalOnboard";

type Props = {
  paid: boolean;
  onboardDone: boolean;
  setupDone: boolean;
  // The student's single agent id, or null before one is provisioned. null => Chat tab hidden.
  agentId: string | null;
  // From onboard_submissions — used for the "Hi {firstName}" greeting on the agent dashboard.
  firstName: string | null;
  // From agents.name — used for the "I'm {agentName}" greeting in the empty chat state.
  agentName: string | null;
  // Optional custom avatar URL the student uploaded during onboarding.
  avatarUrl: string | null;
  // Auth user id — scopes the conversational onboarding's localStorage progress key.
  userId: string;
  // Optional prefill from the pre-payment /build lead-capture form, so the conversational
  // onboarding can skip questions we already asked. null when no lead row exists.
  onboardPrefill: OnboardPrefill | null;
};

export function DashboardClient({ paid, onboardDone, setupDone, agentId, firstName, agentName, avatarUrl, userId, onboardPrefill }: Props) {
  const hasAgent = !!agentId;
  const { userEmail } = useWorkspace();
  const router = useRouter();
  const pathname = usePathname();

  // Provisioning fires only when the student clicks "Create my agent" (both steps done).
  const [provisioning, setProvisioning] = useState(false);
  const [provisionFailed, setProvisionFailed] = useState(false);

  async function provision() {
    setProvisionFailed(false);
    setProvisioning(true);
    try {
      await apiFetch("/api/provision", { method: "POST", body: JSON.stringify({}) });
      router.refresh(); // page re-renders → hasAgent flips → AgentsView
    } catch (e) {
      setProvisioning(false);
      setProvisionFailed(true);
      toast.error((e as Error).message || "Provisioning failed. You can retry.");
    }
  }

  // Sidebar nav. Settings is always present — every account has a workspace (name/ID/delete
  // don't need an agent or a paid plan). "Chat" leads once there's an agent to talk to (and is
  // the default landing then), with "Your Agent" right beneath it; Files and Integrations follow.
  // Before there's an agent that whole block collapses to a single "Agents" item (which hosts the
  // build CTA when unpaid, the setup checklist once paid). Billing appears once they've paid
  // (there's a subscription to show / manage).
  // `iconColor` (optional) tints just the icon — used to make Integrations / Shortcuts
  // stand out from the otherwise-muted sidebar. Labels stay in the default text color so
  // the row still reads as a single nav item, not a colored chip.
  const tabs: { id: DashboardTabId; label: string; icon: typeof Bot; iconColor?: string }[] = [
    // Welcome shows for any paid student — it's the conversational onboarding pre-agent
    // and the persistent greeting + Open Chat CTA post-agent. The rest of the agent-bound
    // surfaces (Chat, Your Agent) only appear after the agent is provisioned. Files has
    // been hidden from the sidebar (still routable directly if needed).
    ...(paid ? [{ id: "welcome" as DashboardTabId, label: "Welcome", icon: Home }] : []),
    ...(hasAgent
      ? [
          { id: "chat" as DashboardTabId, label: "Chat", icon: MessageSquare },
          { id: "agent" as DashboardTabId, label: "Your Agent", icon: Bot },
          { id: "integrations" as DashboardTabId, label: "Integrations", icon: Blocks, iconColor: "#3B82F6" },
          { id: "shortcuts" as DashboardTabId, label: "Shortcuts", icon: Sparkles, iconColor: "#F59E0B" },
        ]
      : paid
        ? []
        : [{ id: "agents" as DashboardTabId, label: "Agents", icon: Bot }]),
    ...(paid ? [{ id: "billing" as DashboardTabId, label: "Billing", icon: CreditCard }] : []),
    { id: "settings", label: "Settings", icon: Settings2 },
  ];

  // One parse of the URL into { tab, chatSessionId }. The open chat thread rides the URL as a third
  // segment (/dashboard/chat/<sessionId>); null means a new chat. `dashboardPath` keeps that thread
  // id on the canonical path so the normalizer below doesn't strip it back to /dashboard/chat.
  const segments = pathname.split("/").filter(Boolean);
  const route = segments[0] === "dashboard" ? parseDashboardRoute(segments.slice(1)) : null;
  const active = normalizeDashboardTab(route?.tab ?? null, tabs, hasAgent);
  const chatSessionId = route?.chatSessionId ?? null;
  const activePath = dashboardPath(active, chatSessionId);

  useEffect(() => {
    if (pathname !== activePath) updateDashboardHistory(activePath, "replace");
  }, [activePath, pathname]);

  function openDashboardTab(tab: DashboardTabId) {
    updateDashboardHistory(dashboardPath(tab), "push");
  }

  // Selecting / creating / clearing a chat is a URL navigation; activeSessionId then follows the
  // URL inside ChatProvider. Stable (history writes don't read render state) so it can live in the
  // chat context without re-creating its callbacks each render.
  const navigateToSession = useCallback(
    (sessionId: string | null, mode: "push" | "replace" = "push") => {
      updateDashboardHistory(dashboardPath("chat", sessionId), mode);
    },
    []
  );

  // `active` can only reach "chat"/"files" when there's an agent (the tabs and their triggers are
  // gated on hasAgent), so these imply hasAgent.
  const isChat = active === "chat";
  const isFiles = active === "files";

  // Chat/Files mount lazily on first open, then stay mounted (just hidden) so drafts, streams,
  // current directories, and scroll survive tab switches without paying their initial fetches on
  // dashboards where the student never opens them. Latched during render rather than in an effect,
  // so the mount lands in the same pass as the switch.
  const [chatOpened, setChatOpened] = useState(isChat);
  if (isChat && !chatOpened) setChatOpened(true);
  const [filesOpened, setFilesOpened] = useState(false);
  if (isFiles && !filesOpened) setFilesOpened(true);

  const shell = (
    <div className="flex h-screen">
      <aside className="flex w-64 shrink-0 flex-col border-r bg-card p-4">
        <div className="px-1 py-1">
          <Image
            src="/logo-college-agent.svg"
            alt="The College Agent"
            width={310}
            height={30}
            priority
            className="h-auto w-full"
          />
        </div>

        {tabs.length > 0 && (
          <nav className="mt-5 flex flex-col gap-1">
            {tabs.map((t) => {
              const Icon = t.icon;
              const isActive = active === t.id;
              return t.id === "chat" ? (
                <ChatTabButton
                  key={t.id}
                  Icon={Icon}
                  label={t.label}
                  isActive={isActive}
                  href={dashboardPath(t.id)}
                />
              ) : (
                <NavLink
                  key={t.id}
                  Icon={Icon}
                  label={t.label}
                  isActive={isActive}
                  href={dashboardPath(t.id)}
                  iconColor={t.iconColor}
                />
              );
            })}
          </nav>
        )}

        {/* Keep the thread rail visible across dashboard tabs; selecting a thread returns to Chat. */}
        {hasAgent && <ChatSidebar />}

        <div className="mt-auto space-y-2 pt-4">
          <div className="truncate px-3 text-xs text-muted-foreground">{userEmail}</div>
          <Button variant="ghost" className="w-full justify-start" onClick={signOut}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-hidden">
        {/* Chat owns its full height (scrolling messages + pinned composer) — no page padding.
            It stays MOUNTED (just hidden) across tab switches so an in-flight first turn, the
            composer draft, and the model selection survive leaving and returning to the tab. */}
        {hasAgent && chatOpened && (
          <div className={cn("h-full", !isChat && "hidden")}>
            <ChatView />
          </div>
        )}
        {/* Files mirrors Chat: full-height, kept MOUNTED (just hidden) so the current directory,
            scroll position, and any open dialog survive leaving and returning to the tab. */}
        {agentId && filesOpened && (
          <div className={cn("h-full", !isFiles && "hidden")}>
            <FilesView agentId={agentId} />
          </div>
        )}
        {!isChat && !isFiles && (
          <div className="h-full overflow-y-auto">
            <div className="mx-auto w-full max-w-6xl p-6 md:px-10 md:py-8">
              {active === "settings" ? (
                <SettingsView />
              ) : active === "billing" ? (
                <BillingView />
              ) : active === "integrations" && agentId ? (
                <IntegrationsView agentId={agentId} />
              ) : active === "shortcuts" && hasAgent ? (
                <ShortcutsView />
              ) : active === "welcome" && paid ? (
                <WelcomeView
                  firstName={firstName}
                  agentName={agentName}
                  avatarUrl={avatarUrl}
                  onOpenChat={() => openDashboardTab("chat")}
                  onboardDone={onboardDone}
                  hasAgent={hasAgent}
                  userId={userId}
                  onboardPrefill={onboardPrefill}
                />
              ) : !paid ? (
                <BuildCta />
              ) : hasAgent ? (
                <AgentsView firstName={firstName} onOpenChat={() => openDashboardTab("chat")} />
              ) : provisioning || provisionFailed ? (
                <Provisioning failed={provisionFailed} onRetry={provision} />
              ) : (
                <StepsView onboardDone={onboardDone} setupDone={setupDone} onCreate={provision} />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );

  // The chat thread rail (aside) and conversation (main) share one provider. Only mount it
  // when there's an agent to talk to — otherwise the Chat tab doesn't exist. (Keying off
  // `agentId` rather than `hasAgent` narrows it to a non-null string for the provider.)
  return agentId ? (
    <ChatProvider
      agentId={agentId}
      urlSessionId={chatSessionId}
      onChatTab={isChat}
      navigateToSession={navigateToSession}
    >
      {shell}
    </ChatProvider>
  ) : (
    shell
  );
}

function ChatTabButton({
  Icon,
  label,
  isActive,
  href,
}: {
  Icon: typeof Bot;
  label: string;
  isActive: boolean;
  href: string;
}) {
  const { startNewChat } = useChatContext();

  return (
    <NavLink
      Icon={Icon}
      label={label}
      isActive={isActive}
      href={href}
      onClick={startNewChat}
    />
  );
}

function NavLink({
  Icon,
  label,
  isActive,
  href,
  onClick,
  iconColor,
}: {
  Icon: typeof Bot;
  label: string;
  isActive: boolean;
  href: string;
  onClick?: () => void;
  iconColor?: string;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      scroll={false}
      onNavigate={(e) => {
        e.preventDefault();
        onClick?.();
        updateDashboardHistory(href, "push");
      }}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4" style={iconColor ? { color: iconColor } : undefined} />
      <span className="flex-1 text-left">{label}</span>
    </Link>
  );
}

function updateDashboardHistory(path: string, mode: "push" | "replace") {
  if (typeof window === "undefined" || window.location.pathname === path) return;
  if (mode === "replace") window.history.replaceState(null, "", path);
  else window.history.pushState(null, "", path);
}

function normalizeDashboardTab(
  requestedTab: DashboardTabId | null,
  tabs: { id: DashboardTabId }[],
  hasAgent: boolean
): DashboardTabId {
  if (requestedTab === "agents" && hasAgent) return "agent";
  if (requestedTab === "agent" && !hasAgent) return "agents";
  if (requestedTab && tabs.some((t) => t.id === requestedTab)) return requestedTab;
  // Welcome is the default whenever it's available (every paid student) — it covers
  // both the conversational onboarding (pre-agent) and the static greeting (post-agent).
  if (tabs.some((t) => t.id === "welcome")) return "welcome";
  return hasAgent ? "chat" : "agents";
}

function BuildCta() {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Let&apos;s build your agent</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Configure your personal AI agent and choose your plan. Once you&apos;re set up, your Hermes
        agent comes to life automatically.
      </p>
      <Button asChild size="lg" className="mt-8">
        <Link href="/build">Build my agent</Link>
      </Button>
    </div>
  );
}

// The setup checklist shown until the student has an agent. Three numbered steps in one
// rhythm: the two prep steps (any order) collapse to a "Done" badge when complete, and the
// final "Create your agent" step lights up (and its button enables) only once both are done.
function StepsView({
  onboardDone,
  setupDone,
  onCreate,
}: {
  onboardDone: boolean;
  setupDone: boolean;
  onCreate: () => void;
}) {
  const router = useRouter();
  const bothDone = onboardDone && setupDone;

  // "Redo" clears that step's saved answers and stays on the dashboard — the card flips
  // back to "not done" so the student can re-launch the form themselves when ready.
  const [redoing, setRedoing] = useState<"onboard" | "setup" | null>(null);
  async function redo(step: "onboard" | "setup") {
    setRedoing(step);
    try {
      await apiFetch("/api/intake/reset", { method: "POST", body: JSON.stringify({ step }) });
      router.refresh(); // step flips to not-done; its action button reappears in place
    } catch (e) {
      setRedoing(null);
      toast.error((e as Error).message || "Couldn't reset that step. Try again.");
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Set up your agent</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Three quick steps and your agent comes to life. The first two can be done in any order.
        </p>
      </div>

      <div className="space-y-4">
        <StepRow
          n={1}
          title="Tell the agent about you"
          desc="A few questions about your classes, schedule, and goals so your agent is built around you."
          done={onboardDone}
          onRedo={() => redo("onboard")}
          redoing={redoing === "onboard"}
        >
          {!onboardDone && (
            <Button asChild className="mt-4">
              <Link href="/onboard">Get started</Link>
            </Button>
          )}
        </StepRow>

        <StepRow
          n={2}
          title="Technical setup"
          desc="Connect Telegram to chat with your agent, and optionally bring your own Anthropic or OpenAI key. Takes about two minutes."
          done={setupDone}
          onRedo={() => redo("setup")}
          redoing={redoing === "setup"}
        >
          {!setupDone && (
            <Button asChild className="mt-4">
              <Link href="/setup">Start setup</Link>
            </Button>
          )}
        </StepRow>

        <StepRow
          n={3}
          title="Create your agent"
          desc="We'll provision your agent and connect it to Telegram. This takes about a minute."
          ready={bothDone}
        >
          <Button className="mt-4" disabled={!bothDone} onClick={onCreate}>
            Create my agent
          </Button>
          {!bothDone && (
            <p className="mt-2 text-xs text-muted-foreground">Finish steps 1 and 2 first.</p>
          )}
        </StepRow>
      </div>
    </div>
  );
}

// One row in the setup checklist. `done` shows a green check + "Done" badge; `ready`
// highlights the row (used by the final create step once its prerequisites are met).
function StepRow({
  n,
  title,
  desc,
  done = false,
  ready = false,
  onRedo,
  redoing = false,
  children,
}: {
  n: number;
  title: string;
  desc: string;
  done?: boolean;
  ready?: boolean;
  onRedo?: () => void;
  redoing?: boolean;
  children?: ReactNode;
}) {
  const filled = done || ready;
  return (
    <div
      className={cn(
        "rounded-xl border p-6 transition-colors",
        ready && "border-primary/60 bg-primary/[0.03]"
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
            filled ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
          )}
        >
          {done ? <Check className="h-4 w-4" /> : n}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-medium">{title}</h2>
            {done && (
              <div className="flex shrink-0 items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  <Check className="h-3 w-3" /> Done
                </span>
                {onRedo && (
                  <button
                    type="button"
                    onClick={onRedo}
                    disabled={redoing}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
                  >
                    <RotateCcw className={cn("h-3 w-3", redoing && "animate-spin")} />
                    {redoing ? "Resetting…" : "Redo"}
                  </button>
                )}
              </div>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

function Provisioning({ failed, onRetry }: { failed: boolean; onRetry: () => void }) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      {failed ? (
        <>
          <h1 className="text-xl font-semibold">We couldn&apos;t finish setting up your agent</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your details are saved. Retry, or our team will finish provisioning shortly.
          </p>
          <Button className="mt-6" onClick={onRetry}>
            Retry
          </Button>
        </>
      ) : (
        <>
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <h1 className="mt-4 text-xl font-semibold">Setting up your Hermes agent…</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We&apos;re provisioning your agent and connecting it to Telegram. This takes about a minute.
          </p>
        </>
      )}
    </div>
  );
}
