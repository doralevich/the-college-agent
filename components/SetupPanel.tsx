"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, Clock, Loader2, Send, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { detectTimezone } from "@/lib/client-locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// "Getting set up", in the dashboard rather than on a separate page.
//
// This replaces /setup, a standalone page in the marketing layout. Sending a student out of
// their dashboard to a differently-shaped page to connect a chat app - and giving them no way
// back except the browser button - is the part David objected to, and he's right: everything
// here is about THIS agent, so it belongs beside it.
//
// Two things live here, matching how ApolloClaw does it: where the agent reaches you, and when
// it messages you first.

type Channel = {
  channel: "telegram";
  state: "connected" | "error" | "disconnected";
  account: string | null;
  message: string | null;
  /** False until they have actually messaged the bot — until then we have no address. */
  linked: boolean;
};

type Schedule = {
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

export function SetupPanel({ agentId }: { agentId: string }) {
  const [channel, setChannel] = useState<Channel | null>(null);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);

  // Promise chain rather than an async body, and a cancelled flag rather than an abort: the
  // same shape ChecklistView uses, and the one react-hooks/set-state-in-effect accepts, since
  // nothing here sets state before the first tick.
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiFetch<{ channel: Channel | null }>(`/api/agents/${agentId}/channels/telegram`),
      apiFetch<{ schedule: Schedule | null }>(`/api/agents/${agentId}/checkin-schedule`),
    ])
      .then(([ch, sc]) => {
        if (cancelled) return;
        setChannel(ch.channel);
        setSchedule(sc.schedule);
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

  async function connect() {
    if (!token.trim()) return toast.error("Paste your bot token first.");
    setBusy(true);
    try {
      const { channel: next } = await apiFetch<{ channel: Channel }>(
        `/api/agents/${agentId}/channels/telegram`,
        { method: "POST", body: JSON.stringify({ botToken: token.trim() }) }
      );
      setChannel(next);
      setToken("");
      toast.success("Telegram connected — now send your bot a message so it knows it's you.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    setBusy(true);
    try {
      await apiFetch(`/api/agents/${agentId}/channels/telegram`, { method: "DELETE" });
      setChannel(null);
      toast.success("Telegram disconnected");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function saveSchedule(patch: Partial<Schedule>) {
    const next = {
      enabled: patch.enabled ?? schedule?.enabled ?? true,
      hour: patch.hour ?? schedule?.hour ?? 8,
      days: patch.days ?? schedule?.days ?? "daily",
    };
    setBusy(true);
    try {
      const { schedule: saved } = await apiFetch<{ schedule: Schedule }>(
        `/api/agents/${agentId}/checkin-schedule`,
        {
          method: "PUT",
          // The browser's zone rides along so a student who moved (or never had one captured)
          // gets it set from the machine they're sitting at, rather than being told no.
          body: JSON.stringify({ ...next, timezone: detectTimezone() }),
        }
      );
      setSchedule(saved);
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

  // Connected but never messaged: the bot exists and has nowhere to send. Worth its own state,
  // because "connected" with no check-ins arriving is otherwise indistinguishable from broken.
  const needsFirstMessage = channel?.state === "connected" && !channel.linked;

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

        <div className="rounded-2xl border">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex w-full items-center gap-3 p-4 text-left"
            aria-expanded={open}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600">
              <Send className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-medium">Telegram</span>
                {channel?.state === "connected" && !needsFirstMessage && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                    <Check className="h-3 w-3" /> Connected
                  </span>
                )}
                {needsFirstMessage && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                    <TriangleAlert className="h-3 w-3" /> Needs attention
                  </span>
                )}
                {channel?.state === "error" && (
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
                    Error
                  </span>
                )}
                {!channel && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    Not connected
                  </span>
                )}
              </span>
              <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                {needsFirstMessage
                  ? "Send your bot any message so it knows it's you"
                  : (channel?.account ?? "Your own private bot")}
              </span>
            </span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
            />
          </button>

          {open && (
            <div className="space-y-3 border-t p-4">
              {channel ? (
                <>
                  {channel.message && (
                    <p className="text-sm text-red-600">{channel.message}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {needsFirstMessage
                      ? "Open Telegram, find your bot, and send it anything — that's how it learns which chat is yours."
                      : "Your agent is answering you in Telegram."}
                  </p>
                  <Button variant="outline" size="sm" onClick={disconnect} disabled={busy}>
                    Disconnect
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    In Telegram, message <strong>@BotFather</strong>, send <strong>/newbot</strong>,
                    and paste the token it gives you. Then send your new bot a message.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="tg-token">Bot token</Label>
                    <Input
                      id="tg-token"
                      type="password"
                      autoComplete="off"
                      placeholder="123456789:ABCdef..."
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                    />
                  </div>
                  <Button size="sm" onClick={connect} disabled={busy}>
                    {busy ? "Connecting…" : "Connect Telegram"}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-3 px-1">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border">
            <Clock className="h-4 w-4 text-muted-foreground" />
          </span>
          <div>
            <h3 className="font-semibold leading-tight">On a schedule</h3>
            <p className="text-sm text-muted-foreground">
              Have your agent message you first. Arrives in Telegram once it&apos;s connected.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium">Check-in</p>
              <p className="text-sm text-muted-foreground">
                What&apos;s due, what slipped, and what to focus on next.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => saveSchedule({ enabled: !(schedule?.enabled ?? false) })}
            >
              {schedule?.enabled ? "Turn off" : "Turn on"}
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">Send at</span>
            <select
              className="rounded-md border bg-background px-2 py-1.5"
              value={schedule?.hour ?? 8}
              disabled={busy}
              onChange={(e) => saveSchedule({ hour: Number(e.target.value) })}
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {hourLabel(h)}
                </option>
              ))}
            </select>
            <select
              className="rounded-md border bg-background px-2 py-1.5"
              value={schedule?.days ?? "daily"}
              disabled={busy}
              onChange={(e) => saveSchedule({ days: e.target.value })}
            >
              <option value="daily">Every day</option>
              <option value="weekdays">Weekdays</option>
              <option value="monday">Mondays</option>
              <option value="monday,thursday">Mon &amp; Thu</option>
            </select>
            {/* The zone is shown, never chosen: it comes from the machine they are on. A
                dropdown of 400 zones is one more thing to get wrong. */}
            <span className="text-muted-foreground">
              {schedule?.timezone ?? detectTimezone() ?? ""}
            </span>
          </div>

          {schedule?.lastRunOn && (
            <p className="mt-2 text-xs text-muted-foreground">
              Last sent {schedule.lastRunOn}
              {schedule.lastStatus ? ` (${schedule.lastStatus})` : ""}.
            </p>
          )}
          {schedule?.enabled && !channel?.linked && (
            <p className="mt-2 text-xs text-amber-700">
              Connect Telegram above, or this has nowhere to arrive.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
