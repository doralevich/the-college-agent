"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { CHANNELS, type ChannelId } from "@/config/channels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Where the agent answers you: Telegram, Slack, WhatsApp.
//
// Lifted out of SetupPanel so the post-intake walkthrough and the Checklist render the SAME
// cards rather than two drifting copies of a 130-line block. Driven entirely by
// config/channels.ts - adding a fourth chat app is a config entry, a lib and a receiver, with
// nothing to change in here.
//
// None of this is Composio or OAuth. Every channel connects by pasting a credential the
// student created in their own account, and delivers to a webhook in this app.

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

// Getting from "no Telegram" to "a bot token on the clipboard", with as little to get wrong as we
// can manage. Ported from ApolloClaw's BotFatherHelp so the two products walk students through
// the same thing.
//
// Telegram has no API for creating a bot and no way to pre-fill a message to BotFather, so the
// student really does have to have that conversation. What this removes is the three places they
// get stuck: not having Telegram at all, finding the real BotFather (there are impersonators),
// and the username - which must be unique across all of Telegram and end in "bot", so the first
// few anyone tries are taken and a non-technical student decides the product is broken.
function TelegramHelp({ agentName, seed }: { agentName?: string | null; seed: string }) {
  // Telegram's rules: 5-32 characters, letters digits and underscores, ending in "bot". A short
  // tail because the clean form of any name is usually taken already. DERIVED from the agent id
  // rather than random: Math.random() would differ between server and client render and change
  // on every re-render, which is no way to treat a value someone is about to copy.
  const suggestion = useMemo(() => {
    const base = (agentName || "college").replace(/[^a-zA-Z0-9]/g, "").slice(0, 18) || "college";
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    const tail = h.toString(36).slice(0, 4).padStart(4, "0");
    return `${base}_${tail}_bot`;
  }, [agentName, seed]);

  // Controls only, in the order the steps above use them - no paragraph restating the steps.
  // Same layout as ApolloClaw's BotFatherHelp.
  return (
    <div className="space-y-3 rounded-xl border bg-muted/30 p-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {/* ?start= is not decoration: a bare t.me/BotFather often opens a landing page or a chat
            list on desktop. The payload makes it open the BotFather chat with a START button. */}
        <Button asChild size="sm">
          <a href="https://t.me/BotFather?start=newbot" target="_blank" rel="noopener noreferrer">
            Open BotFather in Telegram
          </a>
        </Button>
        {/* For someone without Telegram, the button above lands on a "get the app" page.
            telegram.org/dl picks the right store for the device it is opened on. */}
        <span className="text-xs text-muted-foreground">
          No Telegram yet?{" "}
          <a
            href="https://telegram.org/dl"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground underline underline-offset-2"
          >
            Get it here
          </a>
        </span>
      </div>
      <CopyRow label="Send it this" value="/newbot" />
      <CopyRow label="Then this username" value={suggestion} />
    </div>
  );
}

/** A t.me link that opens the student's own bot and sends /start, or null if we can't build one.
 *
 * connectTelegram stores the bot's @username from getMe as `account`. The ?start payload makes
 * Telegram reliably show a START button, and the receiver treats /start as the bind-and-greet
 * handshake rather than a question for the agent. */
function telegramStartUrl(account: string | null): string | null {
  return account?.startsWith("@") ? `https://t.me/${account.slice(1)}?start=setup` : null;
}

export function ChannelCards({
  agentId,
  agentName,
  onLinkedChange,
}: {
  agentId: string;
  /** Seeds the suggested Telegram bot username. Optional - it falls back to a generic base. */
  agentName?: string | null;
  /** Reports whether any channel has somewhere to send, for callers that gate on it. */
  onLinkedChange?: (anyLinked: boolean) => void;
}) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<ChannelId | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiFetch<{ channels: Channel[] }>(`/api/agents/${agentId}/channels/telegram`)
      .then((ch) => {
        if (cancelled) return;
        setChannels(ch.channels);
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

  useEffect(() => {
    onLinkedChange?.(anyLinked);
  }, [anyLinked, onLinkedChange]);

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

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border p-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading…
      </div>
    );
  }

  return (
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
                      {/* Telegram is the one channel where we hold enough to build the link -
                          the bot's @username from getMe - so it gets a button rather than a
                          sentence. The copyable link is for a student whose Telegram is on
                          their phone while this page is open on a laptop. */}
                      {needsFirstMessage &&
                        def.id === "telegram" &&
                        (() => {
                          const url = telegramStartUrl(ch.account);
                          return url ? (
                            <div className="space-y-2">
                              <Button asChild size="sm">
                                <a href={url} target="_blank" rel="noopener noreferrer">
                                  Open {ch.account} in Telegram
                                </a>
                              </Button>
                              <CopyRow label="Or send yourself this link" value={url} />
                            </div>
                          ) : null;
                        })()}
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
                      {def.id === "telegram" && <TelegramHelp agentName={agentName} seed={agentId} />}
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
  );
}
