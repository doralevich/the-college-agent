"use client";

import { useEffect, useState } from "react";
import { Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { ChannelCards } from "@/components/ChannelCards";
import { detectTimezone } from "@/lib/client-locale";
import { Button } from "@/components/ui/button";

// "Getting set up", in the dashboard rather than on a separate page.
//
// This replaced /setup, a standalone page in the marketing layout: a student had to leave their
// dashboard to configure the agent they were looking at, and had no way back but the browser
// button. Everything here is about one agent, so it belongs beside it.
//
// Two things live here, matching how ApolloClaw does it: where the agent reaches you, and when
// it messages you first. The channel cards are driven entirely by config/channels.ts - adding a
// fourth chat app is a config entry, a lib and a receiver, with nothing to change in here.

// One per entry in config/scheduled-runs.ts. The API returns every registry entry whether or not
// the student has ever turned it on, so this list is the registry — nothing here is hardcoded and
// a fourth run appears the moment it is added there.
type Run = {
  kind: string;
  name: string;
  description: string;
  enabled: boolean;
  hour: number;
  days: string;
  timezone: string | null;
  lastRunOn: string | null;
  lastStatus: string | null;
};

const HOURS = Array.from({ length: 24 }, (_, h) => h);

function hourLabel(h: number): string {
  const suffix = h < 12 ? "AM" : "PM";
  const twelve = h % 12 === 0 ? 12 : h % 12;
  return `${twelve}:00 ${suffix}`;
}

export function SetupPanel({ agentId, agentName }: { agentId: string; agentName?: string | null }) {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Promise chain rather than an async body, and a cancelled flag rather than an abort: the same
  // shape ChecklistView uses, and the one react-hooks/set-state-in-effect accepts.
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiFetch<{ runs: Run[] }>(`/api/agents/${agentId}/checkin-schedule`),
    ])
      .then(([sc]) => {
        if (cancelled) return;
        setRuns(sc.runs);
      })
      .catch((e: Error) => {
        if (!cancelled) toast.error(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [agentId]);

  const [anyLinked, setAnyLinked] = useState(false);

  async function saveRun(run: Run, patch: Partial<Run>) {
    const next = { ...run, ...patch };
    setBusy(true);
    try {
      const { run: saved } = await apiFetch<{ run: Run }>(
        `/api/agents/${agentId}/checkin-schedule`,
        {
          method: "PUT",
          // The browser's zone rides along so a student who moved (or never had one captured)
          // gets it set from the machine they're sitting at, rather than being told no.
          body: JSON.stringify({
            kind: next.kind,
            enabled: next.enabled,
            hour: next.hour,
            days: next.days,
            timezone: detectTimezone(),
          }),
        }
      );
      setRuns((prev) => prev.map((r) => (r.kind === saved.kind ? saved : r)));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border p-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading your setup…
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border p-5">
        <h2 className="text-base font-semibold">Getting set up</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Set up where your agent reaches you, and when it runs.
        </p>
      </div>

      <ChannelCards agentId={agentId} agentName={agentName} onLinkedChange={setAnyLinked} />

      <div className="space-y-3">
        <div className="flex items-start gap-3 px-1">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border">
            <Clock className="h-4 w-4 text-muted-foreground" />
          </span>
          <div>
            <h3 className="font-semibold leading-tight">On a schedule</h3>
            <p className="text-sm text-muted-foreground">
              Have your agent message you first. Arrives in whichever chat app you connected above.
            </p>
          </div>
        </div>

        {runs.map((run) => (
          <div key={run.kind} className="rounded-2xl border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium">{run.name}</p>
                <p className="text-sm text-muted-foreground">{run.description}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => saveRun(run, { enabled: !run.enabled })}
              >
                {run.enabled ? "Turn off" : "Turn on"}
              </Button>
            </div>

            {/* Time and days only once it's on. An off run showing pickers invites someone to
                set a time and walk away thinking they turned it on. */}
            {run.enabled && (
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-muted-foreground">Send at</span>
                <select
                  className="rounded-md border bg-background px-2 py-1.5"
                  value={run.hour}
                  disabled={busy}
                  onChange={(e) => saveRun(run, { hour: Number(e.target.value) })}
                >
                  {HOURS.map((h) => (
                    <option key={h} value={h}>
                      {hourLabel(h)}
                    </option>
                  ))}
                </select>
                <select
                  className="rounded-md border bg-background px-2 py-1.5"
                  value={run.days}
                  disabled={busy}
                  onChange={(e) => saveRun(run, { days: e.target.value })}
                >
                  <option value="daily">Every day</option>
                  <option value="weekdays">Weekdays</option>
                  <option value="monday">Mondays</option>
                  <option value="sunday">Sundays</option>
                  <option value="monday,thursday">Mon &amp; Thu</option>
                </select>
                {/* The zone is shown, never chosen: it comes from the machine they are on. A
                    dropdown of 400 zones is one more thing to get wrong. */}
                <span className="text-muted-foreground">
                  {run.timezone ?? detectTimezone() ?? ""}
                </span>
              </div>
            )}

            {run.lastRunOn && (
              <p className="mt-2 text-xs text-muted-foreground">
                Last sent {run.lastRunOn}
                {run.lastStatus ? ` (${run.lastStatus})` : ""}.
              </p>
            )}
            {run.enabled && !anyLinked && (
              <p className="mt-2 text-xs text-amber-700">
                Connect a chat app above, or this has nowhere to arrive.
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
