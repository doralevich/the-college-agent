"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bot, Check, Loader2, LogOut, Settings2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { signOut } from "@/lib/supabase/client";
import { branding } from "@/config/branding";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AgentsView } from "@/components/AgentsView";

type Props = {
  paid: boolean;
  onboardDone: boolean;
  setupDone: boolean;
  hasAgent: boolean;
};

type TabId = "onboard" | "setup" | "agent";

export function DashboardClient({ paid, onboardDone, setupDone, hasAgent }: Props) {
  const { userEmail } = useWorkspace();
  const router = useRouter();

  const provisioningState = paid && !hasAgent && onboardDone && setupDone;

  const [provisionFailed, setProvisionFailed] = useState(false);
  const started = useRef(false);

  async function provision() {
    setProvisionFailed(false);
    try {
      await apiFetch("/api/provision", { method: "POST", body: JSON.stringify({}) });
      router.refresh(); // page re-renders → hasAgent flips → AgentsView
    } catch (e) {
      setProvisionFailed(true);
      toast.error((e as Error).message || "Provisioning failed. You can retry.");
    }
  }

  useEffect(() => {
    if (provisioningState && !started.current) {
      started.current = true;
      void provision();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provisioningState]);

  // Sidebar tabs depend on state. Unpaid → no tabs (just the build CTA).
  const tabs: { id: TabId; label: string; icon: typeof Bot; done?: boolean }[] = hasAgent
    ? [{ id: "agent", label: "Your Agent", icon: Bot }]
    : paid
    ? [
        { id: "onboard", label: "Tell the agent about you", icon: UserRound, done: onboardDone },
        { id: "setup", label: "Technical setup", icon: Settings2, done: setupDone },
      ]
    : [];

  const [active, setActive] = useState<TabId>(hasAgent ? "agent" : "onboard");

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
                  {t.done && <Check className="h-4 w-4 text-primary" />}
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
        <div className="mx-auto w-full max-w-4xl p-6 md:p-10">
          {hasAgent ? (
            <AgentsView />
          ) : !paid ? (
            <BuildCta />
          ) : provisioningState ? (
            <Provisioning failed={provisionFailed} onRetry={provision} />
          ) : active === "setup" ? (
            <StepCard
              title="Technical setup"
              desc="Connect your Telegram bot so you can chat with your agent. Takes about two minutes."
              done={setupDone}
              href="/setup"
              cta={setupDone ? "Review Telegram setup" : "Connect Telegram"}
            />
          ) : (
            <StepCard
              title="Tell the agent about you"
              desc="A few questions about your classes, schedule, and goals so your agent is built around you."
              done={onboardDone}
              href="/onboard"
              cta={onboardDone ? "Review your answers" : "Start onboarding"}
            />
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

function StepCard({
  title,
  desc,
  done,
  href,
  cta,
}: {
  title: string;
  desc: string;
  done: boolean;
  href: string;
  cta: string;
}) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Finish setting up your agent</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete both steps and your Hermes agent goes live automatically. You can do them in any order.
        </p>
      </div>
      <div className="rounded-xl border p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">{title}</h2>
          {done ? (
            <span className="flex items-center gap-1 text-sm font-medium text-primary">
              <Check className="h-4 w-4" /> Done
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">Not started</span>
          )}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
        <Button asChild className="mt-5" variant={done ? "outline" : "default"}>
          <Link href={href}>{cta}</Link>
        </Button>
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
