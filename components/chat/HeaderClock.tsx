"use client";

import { useSyncExternalStore } from "react";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import { detectLocation } from "@/lib/client-locale";

// Date, time, timezone and place in the chat header — the student's own, not the server's.
//
// The timezone is the part that earns its place. A college agent's whole job is deadlines, and
// a student looking at "due at midnight" needs to know which midnight. It is also the value we
// now push to the agent box (lib/hermes.ts), so showing it here means a student whose machine
// is set to the wrong zone can SEE that before their check-ins start arriving at odd hours.
//
// Rendered through useSyncExternalStore rather than an effect, for the reason every clock in a
// server-rendered app needs care: the server has no idea what time it is where the student is,
// so it renders nothing and the browser fills it in. A useState initializer would hydrate with
// the server's blank and never correct it; setting state in an effect would work but costs a
// second paint.
//
// A minute is the resolution shown, so a minute is roughly how often it ticks.

const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;
// Cached so the snapshot is referentially stable between ticks — React compares by value, and
// building a fresh object on every call would re-render forever.
let snapshot = "";

function compute(): string {
  const now = new Date();
  const date = now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const time = now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  // "3:04 PM EDT" -> "EDT". Locales that don't append one leave this empty, and the zone
  // simply isn't shown rather than printing a raw IANA name at someone.
  let zone = "";
  try {
    const withZone = now.toLocaleTimeString("en-US", { hour: "numeric", timeZoneName: "short" });
    const match = withZone.match(/\b([A-Z]{2,5}|GMT[+-]\d{1,2})$/);
    zone = match?.[1] ?? "";
  } catch {
    zone = "";
  }
  return [date, time, zone, detectLocation() ?? ""].join("|");
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  if (!timer) {
    snapshot = compute();
    timer = setInterval(() => {
      const next = compute();
      if (next === snapshot) return;
      snapshot = next;
      listeners.forEach((l) => l());
    }, 30_000);
  }
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

function getSnapshot(): string {
  if (!snapshot) snapshot = compute();
  return snapshot;
}

// Empty on the server: it cannot know, and a server-rendered time would hydrate wrong.
function getServerSnapshot(): string {
  return "";
}

export function HeaderClock() {
  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (!value) return null;

  const [date, time, zone, place] = value.split("|");

  return (
    // Hidden on narrow screens: a chat header on a phone has room for the thread name and the
    // one button, and this is the part nobody came for.
    <div className="hidden items-center gap-3 text-[13px] text-muted-foreground/80 lg:flex">
      {place && (
        <span className="inline-flex max-w-[14ch] items-center gap-1.5" title={place}>
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{place}</span>
        </span>
      )}
      <span className="inline-flex items-center gap-1.5">
        <CalendarDays className="h-3.5 w-3.5" />
        {date}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5" />
        {time}
        {zone && <span className="text-muted-foreground/60">{zone}</span>}
      </span>
    </div>
  );
}
