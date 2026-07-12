"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Blocks, Bot, Check, Coins, Compass, Gift, ListChecks, Loader2, LogOut, Menu, MessageSquare, RotateCcw, Settings2, X } from "lucide-react";
import { toast } from "sonner";
import { signOut } from "@/lib/supabase/client";
import { usd } from "@/lib/format";
import { dashboardPath, parseDashboardRoute, type DashboardTabId } from "@/lib/dashboard-tabs";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SettingsHub } from "@/components/SettingsHub";
import { ChecklistView } from "@/components/ChecklistView";
import { CreditsView } from "@/components/CreditsView";
import { ReferralCard } from "@/components/ReferralCard";
import { ChatProvider, useChatContext } from "@/components/chat/ChatProvider";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatView } from "@/components/chat/ChatView";
import { FilesView } from "@/components/files/FilesView";
import { IntegrationsView } from "@/components/IntegrationsView";
import { WelcomeView } from "@/components/WelcomeView";
import { StartHereView } from "@/components/StartHereView";
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
  // The stored intake questionnaire — the Checklist tab shows it and seeds the edit flow.
  intake: Record<string, unknown> | null;
  // Optional prefill from the pre-payment /build lead-capture form, so the conversational
  // onboarding can skip questions we already asked. null when no lead row exists.
  onboardPrefill: OnboardPrefill | null;
  // Structured class list from the intake (name/days/time) — the Chat empty state
  // uses it for the "Today: ..." schedule line in the greeting.
  classes: ChatClassInfo[];
  // School brand color (falls back to College Agent green) — drives the faded wash
  // behind the chat pane and the sidebar's active accent.
  schoolAccent: string;
};

export type ChatClassInfo = { name: string; days: string; time: string };

export function DashboardClient({ paid, onboardDone, setupDone, agentId, firstName, agentName, avatarUrl, userId, intake, onboardPrefill, classes, schoolAccent }: Props) {
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
  const tabs: { id: DashboardTabId; label: string; icon: typeof Bot }[] = [
    // Welcome shows for any paid student — it's the conversational onboarding pre-agent
    // and the persistent greeting + Open Chat CTA post-agent. The rest of the agent-bound
    // surfaces (Chat, Your Agent) only appear after the agent is provisioned. Files has
    // been hidden from the sidebar (still routable directly if needed).
    // "Start Here" combines the old Welcome, Now what?, and Shortcuts into one
    // orientation surface (onboarding pre-agent; greeting + first moves + examples after).
    ...(paid ? [{ id: "start-here" as DashboardTabId, label: "Start Here", icon: Compass }] : []),
    ...(hasAgent
      ? [
          { id: "checklist" as DashboardTabId, label: "Checklist", icon: ListChecks },
          { id: "chat" as DashboardTabId, label: "Chat", icon: MessageSquare },
          { id: "integrations" as DashboardTabId, label: "Integrations", icon: Blocks },
          { id: "refer" as DashboardTabId, label: "Refer & Earn", icon: Gift },
          { id: "credits" as DashboardTabId, label: "API Credits", icon: Coins },
        ]
      : paid
        ? []
        : [{ id: "agents" as DashboardTabId, label: "Agents", icon: Bot }]),
    // Your Agent and Billing live INSIDE Settings now (SettingsHub sections); their old
    // /dashboard/agent and /dashboard/billing routes deep-link to the matching section.
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

  // Mobile nav drawer. Open state is "opened at this pathname" — navigating anywhere
  // (tab, thread, credits pill) changes the pathname and the drawer closes by derivation,
  // no effect needed. Clicking a nav link on the SAME path closes it explicitly.
  const [navOpenAt, setNavOpenAt] = useState<string | null>(null);
  const mobileNavOpen = navOpenAt !== null && navOpenAt === pathname;
  const closeMobileNav = () => setNavOpenAt(null);

  // Chat/Files mount lazily on first open, then stay mounted (just hidden) so drafts, streams,
  // current directories, and scroll survive tab switches without paying their initial fetches on
  // dashboards where the student never opens them. Latched during render rather than in an effect,
  // so the mount lands in the same pass as the switch.
  const [chatOpened, setChatOpened] = useState(isChat);
  if (isChat && !chatOpened) setChatOpened(true);
  const [filesOpened, setFilesOpened] = useState(false);
  if (isFiles && !filesOpened) setFilesOpened(true);

  // Everything below the logo in the sidebar — shared between the fixed desktop rail and
  // the mobile drawer so the two can't drift. Clicking any nav link closes the drawer
  // (harmless no-op on desktop).
  const sidebarBody = (
    <>
      {/* Agent identity: the intake avatar (or default mascot) + name, upper left under the
          logo, so the rail opens with the agent the student built, not just navigation. */}
      {hasAgent && (
        <div className="mt-4 flex items-center gap-2.5 px-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-background">
            {avatarUrl ? (
              // Storage URLs aren't in next/image's remote list — plain img, as elsewhere.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <Image
                src="/thecollegeagent.png"
                alt=""
                width={36}
                height={36}
                className="h-full w-full object-contain p-0.5"
              />
            )}
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-foreground">
              {agentName?.trim() || "Your agent"}
            </div>
            {agentName?.trim() && <div className="text-xs text-muted-foreground">Your agent</div>}
          </div>
        </div>
      )}

      {tabs.length > 0 && (
        <nav
          className="mt-5 flex flex-col gap-1"
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a")) closeMobileNav();
          }}
        >
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
              />
            );
          })}
        </nav>
      )}

      {/* Keep the thread rail visible across dashboard tabs; selecting a thread returns to Chat. */}
      {hasAgent && <ChatSidebar />}

      <div className="mt-auto space-y-2 pt-4">
        {hasAgent && <CreditsPill />}
        <div className="truncate px-3 text-xs text-muted-foreground">{userEmail}</div>
        <Button variant="ghost" className="w-full justify-start" onClick={signOut}>
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </>
  );

  const shell = (
    <div className="flex h-dvh flex-col">
      {/* Mobile top bar — the sidebar is hidden on phones and lives behind this menu. */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b bg-background px-4 md:hidden">
        {/* Sized by WIDTH so the wordmark keeps its 10:1 aspect — forcing a height inside
            a flex row squeezed and distorted it. */}
        <Image
          src="/logo-college-agent.svg"
          alt="The College Agent"
          width={310}
          height={30}
          priority
          className="h-auto w-full max-w-[290px]"
        />
        <button
          type="button"
          onClick={() => setNavOpenAt(pathname)}
          aria-label="Open menu"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-64 shrink-0 flex-col border-r bg-background p-4 md:flex">
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
          {sidebarBody}
        </aside>

        <main className="min-w-0 flex-1 overflow-hidden">
        {/* Chat owns its full height (scrolling messages + pinned composer) — no page padding.
            It stays MOUNTED (just hidden) across tab switches so an in-flight first turn, the
            composer draft, and the model selection survive leaving and returning to the tab. */}
        {hasAgent && chatOpened && (
          <div className={cn("h-full", !isChat && "hidden")}>
            <ChatView firstName={firstName} classes={classes} accent={schoolAccent} avatarUrl={avatarUrl} agentName={agentName} intake={intake} />
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
              {hasAgent && active === "credits" ? (
                // Credits is its own tab: balance, top-ups, auto-recharge, alerts, usage,
                // and the referral program in one place.
                <div className="mx-auto max-w-xl space-y-8">
                  <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Credits</h1>
                    <p className="text-sm text-muted-foreground">
                      Fund your agent&apos;s AI usage: balance, top-ups, and auto-recharge.
                    </p>
                  </div>
                  <CreditsView />
                </div>
              ) : hasAgent && active === "refer" ? (
                // Refer & Earn — its own tab so the referral link isn't buried at the
                // bottom of another page.
                <div className="mx-auto max-w-xl space-y-6">
                  <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Refer &amp; Earn</h1>
                    <p className="text-sm text-muted-foreground">
                      Share your link. Give a friend their first month free, and earn a free month
                      yourself, no limit.
                    </p>
                  </div>
                  <ReferralCard />
                </div>
              ) : active === "settings" ||
                (paid && (active === "billing" || active === "agent" || active === "agents")) ? (
                // One hub for Settings + Your Agent + Subscription. Keyed by route so deep
                // links (/dashboard/billing, /dashboard/agent) open on the right section
                // even when the hub is already mounted on another one.
                <SettingsHub
                  key={active}
                  initialSection={
                    active === "billing"
                      ? "subscription"
                      : active === "agent" || active === "agents"
                        ? "agent"
                        : "general"
                  }
                  hasAgent={hasAgent}
                  paid={paid}
                  firstName={firstName}
                  onOpenChat={() => openDashboardTab("chat")}
                />
              ) : active === "integrations" && agentId ? (
                <IntegrationsView agentId={agentId} />
              ) : active === "checklist" && hasAgent ? (
                <ChecklistView userId={userId} firstName={firstName} intake={intake} />
              ) : (active === "start-here" || active === "welcome" || active === "now-what" || active === "shortcuts") && paid ? (
                // Start Here: onboarding (pre-agent), then greeting + first moves + example
                // prompts (post-agent). Old /welcome, /now-what, /shortcuts links land here.
                <StartHereView
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
              ) : provisioning || provisionFailed ? (
                <Provisioning failed={provisionFailed} onRetry={provision} />
              ) : !hasAgent ? (
                <StepsView onboardDone={onboardDone} setupDone={setupDone} onCreate={provision} />
              ) : (
                <SettingsHub
                  hasAgent={hasAgent}
                  paid={paid}
                  firstName={firstName}
                  onOpenChat={() => openDashboardTab("chat")}
                />
              )}
            </div>
          </div>
        )}
        </main>
      </div>

      {/* Mobile nav drawer: backdrop + the same sidebar content as the desktop rail. */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/40"
            onClick={closeMobileNav}
          />
          <div className="absolute left-0 top-0 flex h-full w-72 max-w-[85vw] flex-col overflow-y-auto border-r bg-background p-4 shadow-xl">
            <div className="flex items-center justify-between gap-3 px-1 py-1">
              {/* Width-sized (see the top bar note) and modest — the drawer is narrow and
                  the big top-bar logo is already visible behind the backdrop. */}
              <Image
                src="/logo-college-agent.svg"
                alt="The College Agent"
                width={310}
                height={30}
                className="h-auto w-44"
              />
              <button
                type="button"
                onClick={closeMobileNav}
                aria-label="Close menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {sidebarBody}
          </div>
        </div>
      )}
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
}: {
  Icon: typeof Bot;
  label: string;
  isActive: boolean;
  href: string;
  onClick?: () => void;
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
        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-secondary text-foreground"
          : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="flex-1 text-left">{label}</span>
    </Link>
  );
}

// Ambient credits indicator at the bottom of the sidebar: green when healthy, amber under
// $5, red under $1. Clicking lands on Settings -> Billing where top-ups live. Hidden for
// BYO accounts (their AI spend isn't ours to show) and while the balance hasn't loaded.
function CreditsPill() {
  const [remainingMicros, setRemainingMicros] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<{ byo: unknown; credits: { remaining_micros: number } | null }>("/api/billing/credits")
      .then((d) => {
        if (!cancelled && !d.byo && d.credits) setRemainingMicros(d.credits.remaining_micros);
      })
      .catch(() => {}); // ambient chrome, never toast over a balance hiccup
    return () => {
      cancelled = true;
    };
  }, []);

  if (remainingMicros === null) return null;
  const dollars = remainingMicros / 1_000_000;
  const low = dollars < 5;
  const critical = dollars < 1;
  const href = dashboardPath("credits");

  return (
    <Link
      href={href}
      prefetch={false}
      scroll={false}
      onNavigate={(e) => {
        e.preventDefault();
        updateDashboardHistory(href, "push");
      }}
      className={cn(
        "flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors hover:bg-secondary/60",
        critical
          ? "text-destructive"
          : low
            ? "text-amber-700 dark:text-amber-400"
            : "text-muted-foreground"
      )}
      title={low ? "Credits are running low. Tap to top up." : "AI credits. Tap to manage."}
    >
      <span className="flex items-center gap-2">
        <Coins
          className={cn(
            "h-3.5 w-3.5",
            critical ? "text-destructive" : low ? "text-amber-600 dark:text-amber-400" : "text-primary"
          )}
        />
        {low ? "Credits low" : "AI credits"}
      </span>
      <span className="tabular-nums">{usd(remainingMicros)}</span>
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
  // Files was removed from the sidebar but stays reachable by URL so students can
  // browse and download everything their agent keeps for them.
  if (requestedTab === "files" && hasAgent) return "files";
  // Usage Credits lives inside Settings; the sidebar pill and chat top-up links
  // deep-link here.
  if (requestedTab === "credits" && hasAgent) return "credits";
  // Old orientation routes now live under "Start Here".
  if (requestedTab === "welcome" || requestedTab === "now-what" || requestedTab === "shortcuts") {
    if (tabs.some((t) => t.id === "start-here")) return "start-here";
  }
  if (requestedTab && tabs.some((t) => t.id === requestedTab)) return requestedTab;
  // Start Here is the default whenever it's available (every paid student) — it covers
  // both the conversational onboarding (pre-agent) and the greeting (post-agent).
  if (tabs.some((t) => t.id === "start-here")) return "start-here";
  return hasAgent ? "chat" : "agents";
}

function BuildCta() {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Let&apos;s build your agent</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Configure your personal AI agent and choose your plan. Once you&apos;re set up, your
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
              <Link href="/dashboard/welcome">Get started</Link>
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
          <h1 className="mt-4 text-xl font-semibold">Setting up your agent…</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We&apos;re provisioning your agent and connecting it to Telegram. This takes about a minute.
          </p>
        </>
      )}
    </div>
  );
}
