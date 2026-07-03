"use client";

import { useEffect, useState } from "react";
import { Check, PlusSquare, Share, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

// "Put your agent on your phone" card. Android (and desktop Chrome) get the real
// install prompt via beforeinstallprompt; iOS has no install API, so it gets the
// two-tap Share > Add to Home Screen guide. Hidden entirely when already running
// as an installed app.

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function AddToPhone({ agentName }: { agentName?: string | null }) {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    setStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
        // iOS Safari's non-standard flag for home-screen launches.
        ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true)
    );
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // Already running from the home screen: nothing to sell.
  if (standalone) return null;

  const name = agentName?.trim() || "your agent";

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Smartphone className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold">Put {name} on your phone</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Add The College Agent to your home screen and it opens like an app, one tap away.
          </p>

          {installed ? (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <Check className="h-4 w-4" /> Added to your home screen
            </p>
          ) : installEvent ? (
            <Button
              className="mt-3"
              onClick={() => {
                installEvent.prompt();
                installEvent.userChoice.then((choice) => {
                  if (choice.outcome === "accepted") setInstalled(true);
                });
              }}
            >
              Add to home screen
            </Button>
          ) : isIOS ? (
            <ol className="mt-3 space-y-2 text-sm text-foreground/90">
              <li className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 select-none items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                  1
                </span>
                <span>
                  Tap the <Share className="inline h-4 w-4 align-[-2px] text-primary" aria-label="Share" />{" "}
                  <span className="font-medium">Share</span> button in Safari
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 select-none items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                  2
                </span>
                <span>
                  Scroll down and tap{" "}
                  <PlusSquare className="inline h-4 w-4 align-[-2px] text-primary" aria-hidden />{" "}
                  <span className="font-medium">Add to Home Screen</span>
                </span>
              </li>
            </ol>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              On your phone, open <span className="font-medium text-foreground">thecollegeagent.ai</span> in
              Safari or Chrome. iPhone: tap Share, then Add to Home Screen. Android: tap the menu, then Add
              to Home screen.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
