"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { composioLogoUrl } from "@/lib/integration-catalog";
import { Button } from "@/components/ui/button";
import type { IntegrationConnection, IntegrationConnectionsResult } from "@/lib/types";

// The two connections worth walking a student through by hand, right after the intake:
// email, then calendar. Everything else they can browse for later on the Integrations tab.
//
// This is ONLY a guided path over machinery that already exists — the same
// /integrations/connect/redirect route and the same /integrations/connections poll the
// Integrations tab uses. Composio owns the token exchange; no OAuth callback lives in this
// app and no token ever reaches our database or the agent's box.
//
// NOTHING HERE GATES CHAT. Every step can be skipped, and the whole panel can be dismissed:
// an agent with no email connected still answers questions from the moment it is running, and
// a student who wants to start talking should never be held behind a consent screen.

const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 22; // ~45s, matching the Integrations tab

type Provider = { slug: string; label: string; note?: string };

type Step = {
  id: "email" | "calendar";
  title: string;
  blurb: string;
  providers: Provider[];
  /** Slugs that satisfy this step. Outlook is in both — see below. */
  satisfiedBy: string[];
};

// Outlook is one OAuth grant covering mail AND calendar, so connecting it on the email step
// completes the calendar step too. Google splits them: Gmail and Google Calendar are separate
// grants and a student on Google has to approve both.
const STEPS: Step[] = [
  {
    id: "email",
    title: "Let's connect your email",
    blurb:
      "So I can read what's landing in your inbox, flag what needs a reply, and draft responses in your voice.",
    providers: [
      { slug: "gmail", label: "Gmail" },
      { slug: "outlook", label: "Outlook", note: "Covers your calendar too" },
    ],
    satisfiedBy: ["gmail", "outlook"],
  },
  {
    id: "calendar",
    title: "Now your calendar",
    blurb:
      "So I know where you have to be, what's due, and when you actually have time to work on it.",
    providers: [
      { slug: "googlecalendar", label: "Google Calendar" },
      { slug: "outlook", label: "Outlook", note: "Mail and calendar in one" },
    ],
    satisfiedBy: ["googlecalendar", "outlook"],
  },
];

function isActive(c: IntegrationConnection): boolean {
  return (c.status || "").toUpperCase() === "ACTIVE";
}

function connectedSlugs(conns: IntegrationConnection[]): Set<string> {
  return new Set(conns.filter(isActive).map((c) => (c.toolkitSlug || "").toLowerCase()));
}

export function ConnectSteps({
  agentId,
  onDone,
}: {
  agentId: string;
  onDone: () => void;
}) {
  const [connected, setConnected] = useState<Set<string>>(new Set());
  const [stepIdx, setStepIdx] = useState(0);
  const [pending, setPending] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Promise chain rather than an async effect body, and a cancelled flag rather than an
  // abort — the shape react-hooks/set-state-in-effect accepts, same as SetupPanel.
  useEffect(() => {
    let cancelled = false;
    apiFetch<IntegrationConnectionsResult>(`/api/agents/${agentId}/integrations/connections`)
      .then((res) => {
        if (cancelled) return;
        const slugs = connectedSlugs(res.connections);
        setConnected(slugs);
        // Land them on the first step they have not already satisfied. A student who
        // connected Outlook from the Integrations tab before reaching here skips both.
        const first = STEPS.findIndex((s) => !s.satisfiedBy.some((k) => slugs.has(k)));
        setStepIdx(first === -1 ? STEPS.length : first);
      })
      .catch(() => {
        // A failed read must not strand them on a blank panel; start at the top and let the
        // connect attempt surface any real problem.
        if (!cancelled) setStepIdx(0);
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

  function connect(slug: string) {
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
          advance(slugs);
          return;
        }
      } catch {
        // transient; keep polling to the attempt cap
      }
      if (attempts >= POLL_MAX_ATTEMPTS) stopPolling();
    }, POLL_INTERVAL_MS);
  }

  /** Move to the next step this student has not already satisfied, or finish. */
  function advance(slugs: Set<string>) {
    const next = STEPS.findIndex(
      (s, i) => i > stepIdx && !s.satisfiedBy.some((k) => slugs.has(k))
    );
    if (next === -1) onDone();
    else setStepIdx(next);
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-xl items-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        One moment…
      </div>
    );
  }

  const step = STEPS[stepIdx];
  if (!step) {
    onDone();
    return null;
  }

  return (
    <div className="mx-auto max-w-xl py-10">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Step {stepIdx + 1} of {STEPS.length}
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{step.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{step.blurb}</p>

      <div className="mt-8 space-y-3">
        {step.providers.map((p) => {
          const already = connected.has(p.slug.toLowerCase());
          const waiting = pending === p.slug;
          return (
            <button
              key={p.slug}
              type="button"
              disabled={already || waiting}
              onClick={() => connect(p.slug)}
              className="flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors hover:bg-muted/40 disabled:cursor-default disabled:opacity-70"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={composioLogoUrl(p.slug)} alt="" className="h-8 w-8 rounded" />
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{p.label}</span>
                {p.note && (
                  <span className="block text-xs text-muted-foreground">{p.note}</span>
                )}
              </span>
              {already ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : waiting ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          );
        })}
      </div>

      {pending && (
        <p className="mt-4 text-xs text-muted-foreground">
          Finish signing in on the tab that just opened. This updates on its own.
        </p>
      )}

      <div className="mt-8 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => advance(connected)}>
          Skip for now
        </Button>
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onDone}>
          I&apos;ll do this later
        </Button>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        You can connect these any time from Integrations. Your agent works either way.
      </p>
    </div>
  );
}
