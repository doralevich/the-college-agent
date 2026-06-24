"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bot, Check, Loader2, LogOut, RotateCcw, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { signOut } from "@/lib/supabase/client";
import { branding } from "@/config/branding";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AgentsView } from "@/components/AgentsView";
import { SettingsView } from "@/components/SettingsView";

type Props = {
  paid: boolean;
  onboardDone: boolean;
  setupDone: boolean;
  hasAgent: boolean;
};

type TabId = "agents" | "agent" | "settings";

export function DashboardClient({ paid, onboardDone, setupDone, hasAgent }: Props) {
  const { userEmail } = useWorkspace();
  const router = useRouter();

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

  // Sidebar nav. Unpaid → nothing (just the build CTA). Once paid, Settings is always
  // present (workspace name/ID/delete don't need an agent); the other item swaps between
  // "Agents" (the setup checklist lives in that view) and "Your Agent".
  const tabs: { id: TabId; label: string; icon: typeof Bot }[] = !paid
    ? []
    : [
        hasAgent
          ? { id: "agent", label: "Your Agent", icon: Bot }
          : { id: "agents", label: "Agents", icon: Bot },
        { id: "settings", label: "Settings", icon: Settings2 },
      ];

  const [active, setActive] = useState<TabId>(hasAgent ? "agent" : "agents");

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 shrink-0 flex-col border-r bg-card p-4">
        <div className="flex items-center gap-2 px-2 py-1">
          {branding.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={branding.logoUrl} alt="" className="h-6 w-6 rounded" />
          ) : null}
          <span className="truncate font-semibold">{branding.appName}</span>
        </div>

        {tabs.length > 0 && (
          <nav className="mt-6 flex flex-col gap-1">
            {tabs.map((t) => {
              const Icon = t.icon;
              const isActive = active === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActive(t.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1 text-left">{t.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        <div className="mt-auto space-y-2 pt-4">
          <div className="truncate px-3 text-xs text-muted-foreground">{userEmail}</div>
          <Button variant="ghost" className="w-full justify-start" onClick={signOut}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-6xl p-6 md:px-10 md:py-8">
          {!paid ? (
            <BuildCta />
          ) : active === "settings" ? (
            <SettingsView />
          ) : hasAgent ? (
            <AgentsView />
          ) : provisioning || provisionFailed ? (
            <Provisioning failed={provisionFailed} onRetry={provision} />
          ) : (
            <StepsView onboardDone={onboardDone} setupDone={setupDone} onCreate={provision} />
          )}
        </div>
      </main>
    </div>
  );
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
