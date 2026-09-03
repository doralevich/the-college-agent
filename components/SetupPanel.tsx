"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, Clock, Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { detectTimezone } from "@/lib/client-locale";
import { CHANNELS, type ChannelId } from "@/config/channels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// "Getting set up", in the dashboard rather than on a separate page.
//
// This replaced /setup, a standalone page in the marketing layout: a student had to leave their
// dashboard to configure the agent they were looking at, and had no way back but the browser
// button. Everything here is about one agent, so it belongs beside it.
//
// Two things live here, matching how ApolloClaw does it: where the agent reaches you, and when
// it messages you first. The channel cards are driven entirely by config/channels.ts - adding a
// fourth chat app is a config entry, a lib and a receiver, with nothing to change in here.

type Channel = {
  channel: ChannelId;
  state: "connected" | "error" | "disconnected";
  account: string | null;
  message: string | null;
  /** False until they have actually messaged it — until then we have no address. */
  linked: boolean;
  /** WhatsApp only, and deliberately readable: Meta's console asks the student for it. */
  verifyToken: string | null;
};

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

/** A value the student has to paste into someone else's console. Shown, not hidden. */
function CopyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-md border bg-muted/50 px-2 py-1.5 text-xs">
          {value}
        </code>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            void navigator.clipboard.writeText(value).then(
              () => toast.success(`${label} copied`),
              () => toast.error("Couldn't copy — select it and copy by hand.")
            )
          }
        >
          Copy
        </Button>
      </div>
    </div>
  );
}

export function SetupPanel({ agentId }: { agentId: string }) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<ChannelId | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  // Promise chain rather than an async body, and a cancelled flag rather than an abort: the same
  // shape ChecklistView uses, and the one react-hooks/set-state-in-effect accepts.
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiFetch<{ channels: Channel[] }>(`/api/agents/${agentId}/channels/telegram`),
      apiFetch<{ runs: Run[] }>(`/api/agents/${agentId}/checkin-schedule`),
    ])
      .then(([ch, sc]) => {
        if (cancelled) return;
        setChannels(ch.channels);
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

  const byId = new Map(channels.map((c) => [c.channel, c]));
  const anyLinked = channels.some((c) => c.linked);

  async function connect(id: ChannelId) {
    setBusy(true);
    try {
      const { channel } = await apiFetch<{ channel: Channel }>(
        `/api/agents/${agentId}/channels/${id}`,
        { method: "POST", body: JSON.stringify(fields) }
      );
      setChannels((prev) => [...prev.filter((c) => c.channel !== id), channel]);
      setFields({});
      toast.success("Connected — now send it a message so it knows it's you.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function disconnect(id: ChannelId) {
    setBusy(true);
    try {
      await apiFetch(`/api/agents/${agentId}/channels/${id}`, { method: "DELETE" });
      setChannels((prev) => prev.filter((c) => c.channel !== id));
      toast.success("Disconnected");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // Saves ONE run. The whole current row goes up, not just the field that changed, because the
  // API stores a complete schedule per kind — sending only `enabled` would drop the hour.
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

      <div className="space-y-3">
        <h3 className="px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Where your agent answers you
        </h3>
        <p className="px-1 text-sm text-muted-foreground">
          Pick a chat app and your agent messages you there. Each takes a few steps in that
          app&apos;s own settings — open a card for the walkthrough.
        </p>

        {CHANNELS.map((def) => {
          const ch = byId.get(def.id);
          const open = openId === def.id;
          // Connected but never messaged: it exists and has nowhere to send. Its own state,
          // because "connected" with nothing arriving is otherwise indistinguishable from broken.
          const needsFirstMessage = ch?.state === "connected" && !ch.linked;
          const origin = typeof window === "undefined" ? "" : window.location.origin;
          const webhookUrl = `${origin}/api/channels/${def.id}/${agentId}`;

          return (
            <div key={def.id} className="rounded-2xl border">
              <button
                type="button"
                onClick={() => setOpenId(open ? null : def.id)}
                className="flex w-full items-center gap-3 p-4 text-left"
                aria-expanded={open}
              >
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{def.name}</span>
                    {ch?.state === "connected" && !needsFirstMessage && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                        <Check className="h-3 w-3" /> Connected
                      </span>
                    )}
                    {needsFirstMessage && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                        <TriangleAlert className="h-3 w-3" /> Needs attention
                      </span>
                    )}
                    {ch?.state === "error" && (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
                        Error
                      </span>
                    )}
                    {!ch && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        Not connected
                      </span>
                    )}
                    {def.recommended && !ch && (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium">
                        Easiest
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                    {needsFirstMessage
                      ? "Send it any message so it knows it's you"
                      : (ch?.account ?? def.tagline)}
                  </span>
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
                />
              </button>

              {open && (
                <div className="space-y-3 border-t p-4">
                  {ch ? (
                    <>
                      {ch.message && <p className="text-sm text-red-600">{ch.message}</p>}
                      <p className="text-sm text-muted-foreground">
                        {needsFirstMessage
                          ? `Open ${def.name}, find it, and send anything — that's how it learns which chat is yours.`
                          : def.connectedNote}
                      </p>
                      {/* Shown AFTER connecting, because both are per-agent values that don't
                          exist until then — and the setup can't be finished without them. */}
                      {def.showWebhookUrl && (
                        <CopyRow
                          label={def.id === "whatsapp" ? "Callback URL" : "Request URL"}
                          value={webhookUrl}
                        />
                      )}
                      {ch.verifyToken && <CopyRow label="Verify token" value={ch.verifyToken} />}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => disconnect(def.id)}
                        disabled={busy}
                      >
                        Disconnect
                      </Button>
                    </>
                  ) : (
                    <>
                      <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
                        {def.steps.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ol>
                      {def.fields.map((f) => (
                        <div key={f.key} className="space-y-2">
                          <Label htmlFor={`${def.id}-${f.key}`}>{f.label}</Label>
                          <Input
                            id={`${def.id}-${f.key}`}
                            type="password"
                            autoComplete="off"
                            placeholder={f.placeholder}
                            value={fields[f.key] ?? ""}
                            onChange={(e) =>
                              setFields((prev) => ({ ...prev, [f.key]: e.target.value }))
                            }
                          />
                        </div>
                      ))}
                      <Button size="sm" onClick={() => connect(def.id)} disabled={busy}>
                        {busy ? "Connecting…" : `Connect ${def.name}`}
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

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
