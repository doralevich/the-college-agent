"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { composioLogoUrl } from "@/lib/integration-catalog";
import { ChannelCards } from "@/components/ChannelCards";
import { Button } from "@/components/ui/button";
import type { IntegrationConnection, IntegrationConnectionsResult } from "@/lib/types";

// The post-intake walkthrough. Pick a vendor, connect what that vendor needs, then pick a chat
// app. Every stage is skippable.
//
//   1. Outlook or Google?
//   2. Mail, then calendar - both vendors, so the student is told about both either way.
//   3. Telegram / Slack / WhatsApp.
//
// Asking the vendor FIRST is the whole point. Offering "Gmail | Outlook" and then "Google
// Calendar | Outlook" shows a student both vendors twice and asks them to work out for
// themselves that picking Outlook the first time made the second question moot.
//
// Two different mechanisms sit behind this, and they are deliberately not merged:
//
//   * Mail and calendar are Composio OAuth brokered through Agent37's control plane. The same
//     /integrations/connect/redirect route and /integrations/connections poll the Integrations
//     tab uses. No OAuth callback lives in this app; no token reaches our database or the box.
//   * Channels are not an Agent37 capability at all. The student pastes a credential they made
//     in their own account, and messages arrive at a webhook in this app. That is ChannelCards,
//     shared with the Checklist so the two cannot drift.
//
// NOTHING HERE GATES CHAT. The agent answers from the moment it is running; all of this is
// capability layered on afterwards, in any order.

const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 22; // ~45s, matching the Integrations tab

type Vendor = "google" | "microsoft";
type Stage = "vendor" | "mail" | "calendar" | "channels";

// What each vendor needs connected, in order.
//
// Microsoft lists Outlook TWICE on purpose. It is one OAuth grant covering mail and calendar
// together, so the calendar step opens already satisfied - but a student who was only ever
// asked about email has no reason to believe their calendar is handled, and silence is a
// worse answer than a ticked box that says so. The step says it outright.
//
// We do not point that second step at a separate Microsoft-calendar toolkit, because our
// catalogue has exactly one Microsoft entry and guessing a slug is how the Blackboard tile
// ended up connecting to nothing.
const VENDOR_STEPS: Record<Vendor, { slug: string; label: string; stage: Stage }[]> = {
  google: [
    { slug: "gmail", label: "Gmail", stage: "mail" },
    { slug: "googlecalendar", label: "Google Calendar", stage: "calendar" },
  ],
  microsoft: [
    { slug: "outlook", label: "Outlook", stage: "mail" },
    { slug: "outlook", label: "Outlook Calendar", stage: "calendar" },
  ],
};

function isActive(c: IntegrationConnection): boolean {
  return (c.status || "").toUpperCase() === "ACTIVE";
}

function connectedSlugs(conns: IntegrationConnection[]): Set<string> {
  return new Set(conns.filter(isActive).map((c) => (c.toolkitSlug || "").toLowerCase()));
}

export function ConnectSteps({
  agentId,
  agentName,
  onDone,
}: {
  agentId: string;
  agentName?: string | null;
  onDone: () => void;
}) {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [stage, setStage] = useState<Stage>("vendor");
  const [connected, setConnected] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Promise chain rather than an async effect body — the shape
  // react-hooks/set-state-in-effect accepts, same as SetupPanel.
  useEffect(() => {
    let cancelled = false;
    apiFetch<IntegrationConnectionsResult>(`/api/agents/${agentId}/integrations/connections`)
      .then((res) => {
        if (cancelled) return;
        const slugs = connectedSlugs(res.connections);
        setConnected(slugs);
        // Already connected something from the Integrations tab? Infer the vendor and pick up
        // where that leaves them, rather than asking a question they have answered in deed.
        if (slugs.has("outlook")) {
          // Outlook already covers both, so the calendar step is a confirmation rather than
          // work. Land there so they see it ticked instead of wondering.
          setVendor("microsoft");
          setStage("calendar");
        } else if (slugs.has("googlecalendar")) {
          setVendor("google");
          setStage("channels");
        } else if (slugs.has("gmail")) {
          setVendor("google");
          setStage("calendar");
        }
      })
      .catch(() => {
        // A failed read must not strand them on a blank panel; start at the top and let any
        // real problem surface on the connect attempt.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, [agentId]);

  function stopPolling() {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
    setPending(null);
  }

  /** The stage after this one for the chosen vendor. */
  function nextStage(v: Vendor, from: Stage): Stage {
    const steps = VENDOR_STEPS[v];
    const idx = steps.findIndex((s) => s.stage === from);
    const next = steps[idx + 1];
    return next ? next.stage : "channels";
  }

  function connect(slug: string, v: Vendor, from: Stage) {
    // New tab, so losing the consent screen does not lose the dashboard behind it.
    window.open(
      `/api/agents/${encodeURIComponent(agentId)}/integrations/connect/redirect?toolkit=${encodeURIComponent(slug)}`,
      "_blank",
      "noopener,noreferrer"
    );
    setPending(slug);
    let attempts = 0;
    if (pollTimer.current) clearInterval(pollTimer.current);
    pollTimer.current = setInterval(async () => {
      attempts += 1;
      try {
        const res = await apiFetch<IntegrationConnectionsResult>(
          `/api/agents/${agentId}/integrations/connections`
        );
        const slugs = connectedSlugs(res.connections);
        if (slugs.has(slug.toLowerCase())) {
          setConnected(slugs);
          stopPolling();
          toast.success("Connected");
          setStage(nextStage(v, from));
          return;
        }
      } catch {
        // transient; keep polling to the attempt cap
      }
      if (attempts >= POLL_MAX_ATTEMPTS) stopPolling();
    }, POLL_INTERVAL_MS);
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-xl items-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        One moment…
      </div>
    );
  }

  const stepNumber = stage === "vendor" ? 1 : stage === "channels" ? 3 : 2;

  return (
    <div className="mx-auto max-w-xl py-10">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Step {stepNumber} of 3
      </p>

      {stage === "vendor" && (
        <>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Which do you use for email?
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            So I can see what&apos;s landing in your inbox and what&apos;s on your calendar.
          </p>
          <div className="mt-8 space-y-3">
            <VendorButton
              slug="gmail"
              title="Google"
              note="Gmail and Google Calendar"
              onClick={() => {
                setVendor("google");
                setStage("mail");
              }}
            />
            <VendorButton
              slug="outlook"
              title="Microsoft"
              note="Outlook — mail and calendar together"
              onClick={() => {
                setVendor("microsoft");
                setStage("mail");
              }}
            />
          </div>
        </>
      )}

      {(stage === "mail" || stage === "calendar") && vendor && (
        <ConnectStage
          step={VENDOR_STEPS[vendor].find((s) => s.stage === stage)!}
          vendor={vendor}
          connected={connected}
          pending={pending}
          onConnect={connect}
        />
      )}

      {stage === "channels" && (
        <>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Where should I message you?
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Pick a chat app and your agent reaches you there. This is also where your scheduled
            check-ins arrive.
          </p>
          <div className="mt-8">
            <ChannelCards agentId={agentId} agentName={agentName} />
          </div>
        </>
      )}

      {pending && (
        <p className="mt-4 text-xs text-muted-foreground">
          Finish signing in on the tab that just opened. This updates on its own.
        </p>
      )}

      <div className="mt-8 flex items-center gap-3">
        {stage !== "channels" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (vendor && stage !== "vendor" ? setStage(nextStage(vendor, stage)) : setStage("channels"))}
          >
            Skip for now
          </Button>
        )}
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onDone}>
          {stage === "channels" ? "Done" : "I'll do this later"}
        </Button>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        You can set any of this up later from Integrations and the Checklist. Your agent works
        either way.
      </p>
    </div>
  );
}

function VendorButton({
  slug,
  title,
  note,
  onClick,
}: {
  slug: string;
  title: string;
  note: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors hover:bg-muted/40"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={composioLogoUrl(slug)} alt="" className="h-8 w-8 rounded" />
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{title}</span>
        <span className="block text-xs text-muted-foreground">{note}</span>
      </span>
    </button>
  );
}

function ConnectStage({
  step,
  vendor,
  connected,
  pending,
  onConnect,
}: {
  step: { slug: string; label: string; stage: Stage };
  vendor: Vendor;
  connected: Set<string>;
  pending: string | null;
  onConnect: (slug: string, vendor: Vendor, from: Stage) => void;
}) {
  const already = connected.has(step.slug.toLowerCase());
  const waiting = pending === step.slug;
  return (
    <>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Connect {step.label}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {step.stage === "calendar"
          ? "So I know where you have to be, what's due, and when you actually have time to work on it."
          : "So I can flag what needs a reply and draft responses in your voice."}
        {step.slug === "outlook" &&
          step.stage === "calendar" &&
          " Outlook covers this with the same sign-in you just did — nothing more to approve."}
      </p>
      <div className="mt-8">
        <button
          type="button"
          disabled={already || waiting}
          onClick={() => onConnect(step.slug, vendor, step.stage)}
          className="flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors hover:bg-muted/40 disabled:cursor-default disabled:opacity-70"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={composioLogoUrl(step.slug)} alt="" className="h-8 w-8 rounded" />
          <span className="min-w-0 flex-1 font-medium">{step.label}</span>
          {already ? (
            <Check className="h-4 w-4 text-emerald-600" />
          ) : waiting ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </div>
    </>
  );
}
