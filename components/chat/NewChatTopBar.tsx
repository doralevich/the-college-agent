"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Blocks,
  CalendarDays,
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  ListChecks,
  MapPin,
  Sun,
  Square,
  type LucideIcon,
} from "lucide-react";

// The New Chat "worth at the top" bar: local weather (from the browser's geolocation),
// a live date/time, and a short actionable checklist of things the student should keep
// their agent current on. The checklist rows either seed the composer with a starter
// message ("let me know your quiz/test schedule…") or link to the tab that owns the data
// (Integrations for connecting tools). Rendered only on the empty New Chat state.

type ClassInfo = { name: string; days: string; time: string };

// Rows that drop a first-person starter into the composer so the student can just fill in
// the details and send. Kept conversational — this is "tell your agent", not a form.
const SEED_TASKS: { label: string; hint: string; seed: string }[] = [
  {
    label: "Update your class schedule",
    hint: "Keep your classes, days, and times current",
    seed: "Let's update my class schedule. Here are my classes, with the days and times:\n",
  },
  {
    label: "Share your notes & textbooks",
    hint: "So I can help you study straight from them",
    seed: "I'd like to add my notes and textbooks so you can help me study. Here's what I'm working with:\n",
  },
  {
    label: "Add your quiz, lab & test dates",
    hint: "I'll track them and plan study time around them",
    seed: "Here's my quiz, lab, and test schedule so you can keep me ahead of it:\n",
  },
];

// Map a WMO weather code (what Open-Meteo returns) to a short label + icon.
function describeWeather(code: number): { label: string; Icon: LucideIcon } {
  if (code === 0) return { label: "Clear", Icon: Sun };
  if (code === 1 || code === 2) return { label: "Partly cloudy", Icon: CloudSun };
  if (code === 3) return { label: "Overcast", Icon: Cloud };
  if (code === 45 || code === 48) return { label: "Foggy", Icon: CloudFog };
  if (code >= 51 && code <= 57) return { label: "Drizzle", Icon: CloudDrizzle };
  if (code >= 61 && code <= 67) return { label: "Rain", Icon: CloudRain };
  if (code >= 71 && code <= 77) return { label: "Snow", Icon: CloudSnow };
  if (code >= 80 && code <= 82) return { label: "Showers", Icon: CloudRain };
  if (code === 85 || code === 86) return { label: "Snow showers", Icon: CloudSnow };
  if (code >= 95) return { label: "Thunderstorms", Icon: CloudLightning };
  return { label: "Weather", Icon: Cloud };
}

type WeatherState =
  | { state: "idle" } // permission not yet granted — show an enable button
  | { state: "loading" }
  | { state: "ok"; tempF: number; code: number }
  | { state: "denied" }
  | { state: "unavailable" };

function WeatherCard({ accent }: { accent?: string }) {
  const [wx, setWx] = useState<WeatherState>({ state: "loading" });

  const load = useCallback(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setWx({ state: "unavailable" });
      return;
    }
    setWx({ state: "loading" });
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude.toFixed(
            3
          )}&longitude=${longitude.toFixed(3)}&current=temperature_2m,weather_code&temperature_unit=fahrenheit`;
          const res = await fetch(url);
          const data = await res.json();
          const tempF = Math.round(data?.current?.temperature_2m);
          const code = Number(data?.current?.weather_code ?? -1);
          if (Number.isFinite(tempF)) setWx({ state: "ok", tempF, code });
          else setWx({ state: "unavailable" });
        } catch {
          setWx({ state: "unavailable" });
        }
      },
      () => setWx({ state: "denied" }),
      { timeout: 8000, maximumAge: 30 * 60 * 1000 }
    );
  }, []);

  // Only auto-load when the browser already has permission, so students aren't hit with a
  // location prompt every time they open a new chat. Otherwise show an explicit opt-in.
  useEffect(() => {
    let cancelled = false;
    async function decide() {
      if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
        if (!cancelled) setWx({ state: "unavailable" });
        return;
      }
      try {
        const perm = await navigator.permissions?.query({ name: "geolocation" as PermissionName });
        if (cancelled) return;
        if (perm?.state === "granted") load();
        else if (perm?.state === "denied") setWx({ state: "denied" });
        else setWx({ state: "idle" });
      } catch {
        if (!cancelled) setWx({ state: "idle" });
      }
    }
    decide();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const wxView = wx.state === "ok" ? describeWeather(wx.code) : null;

  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-3.5">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
        style={{ background: accent ? `${accent}1f` : "rgba(61,139,61,.12)", color: accent ?? "var(--primary)" }}
      >
        {wxView ? <wxView.Icon className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
      </span>
      <div className="min-w-0">
        <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Local weather</div>
        {wx.state === "ok" && wxView ? (
          <div className="truncate text-sm font-semibold text-foreground">
            {wx.tempF}&deg; · {wxView.label}
          </div>
        ) : wx.state === "loading" ? (
          <div className="text-sm text-muted-foreground">Checking…</div>
        ) : wx.state === "idle" ? (
          <button
            type="button"
            onClick={load}
            className="text-sm font-medium text-foreground underline underline-offset-2 hover:opacity-80"
          >
            Turn on
          </button>
        ) : (
          <div className="text-sm text-muted-foreground">Unavailable</div>
        )}
      </div>
    </div>
  );
}

function DateCard() {
  // Null on the server / first paint to avoid a hydration mismatch; the clock fills in on
  // mount and ticks each minute.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const weekday = now?.toLocaleDateString(undefined, { weekday: "long" }) ?? "";
  const date = now?.toLocaleDateString(undefined, { month: "long", day: "numeric" }) ?? "";
  const time = now?.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) ?? "";

  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-3.5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground/70">
        <CalendarDays className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {weekday || "Today"}
        </div>
        <div className="truncate text-sm font-semibold text-foreground">
          {now ? `${date} · ${time}` : "—"}
        </div>
      </div>
    </div>
  );
}

export function NewChatTopBar({
  classes = [],
  accent,
  onSeed,
}: {
  classes?: ClassInfo[];
  accent?: string;
  // Drop a starter message into the composer and focus it.
  onSeed: (text: string) => void;
}) {
  // If we know today's classes from the intake, lead the schedule row with a live reminder.
  const todaysClasses = useMemo(() => {
    const tokensByDay = [
      ["sun", "sunday"],
      ["mon", "monday"],
      ["tue", "tues", "tuesday"],
      ["wed", "weds", "wednesday"],
      ["thu", "thur", "thurs", "thursday"],
      ["fri", "friday"],
      ["sat", "saturday"],
    ];
    const today = new Date().getDay();
    return classes.filter((c) => {
      if (!c.days) return false;
      const norm = c.days.toLowerCase();
      return tokensByDay[today].some((t) => new RegExp(`\\b${t}\\b`).test(norm));
    });
  }, [classes]);

  return (
    <div className="w-full max-w-2xl">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <WeatherCard accent={accent} />
        <DateCard />
      </div>

      <div className="mt-3 rounded-xl border bg-card p-4">
        <div className="mb-1 flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Keep your agent up to speed</h2>
        </div>
        {todaysClasses.length > 0 && (
          <p className="mb-2 text-xs text-muted-foreground">
            Today:{" "}
            {todaysClasses.map((c) => (c.time ? `${c.name} at ${c.time}` : c.name)).join(" · ")}
          </p>
        )}
        <ul className="-mx-1 divide-y divide-border/70">
          {SEED_TASKS.map((task) => (
            <li key={task.label}>
              <button
                type="button"
                onClick={() => onSeed(task.seed)}
                className="group flex w-full items-center gap-3 rounded-lg px-1 py-2.5 text-left transition-colors hover:bg-secondary/60"
              >
                <Square className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-foreground">{task.label}</span>
                  <span className="block text-xs text-muted-foreground">{task.hint}</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            </li>
          ))}
          <li>
            <Link
              href="/dashboard/integrations"
              className="group flex w-full items-center gap-3 rounded-lg px-1 py-2.5 text-left transition-colors hover:bg-secondary/60"
            >
              <Blocks className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">Connect your tools</span>
                <span className="block truncate text-xs text-muted-foreground">
                  Email, Canvas, calendar, and thousands more
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
