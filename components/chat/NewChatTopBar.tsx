"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Blocks,
  CalendarClock,
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  FlaskConical,
  MapPin,
  NotebookPen,
  Sun,
  type LucideIcon,
} from "lucide-react";

// The New Chat "worth at the top" panel: a slim live status strip (local weather from the
// browser's geolocation + date/time) and a set of quick-start action cards that either seed
// the composer with a first-person starter ("here's my quiz/test schedule…") or link to the
// tab that owns the data. Rendered only on the empty New Chat state.

type ClassInfo = { name: string; days: string; time: string };

// Quick-start cards. The first three drop a starter line into the composer; the last links
// to Integrations. Each carries a tint so the icon badge reads as a distinct, modern accent.
const ACTIONS: {
  key: string;
  label: string;
  hint: string;
  tint: string;
  Icon: LucideIcon;
  seed?: string;
  href?: string;
}[] = [
  {
    key: "schedule",
    label: "Update your class schedule",
    hint: "Keep classes, days, and times current",
    tint: "#3d8b3d",
    Icon: CalendarClock,
    seed: "Let's update my class schedule. Here are my classes, with the days and times:\n",
  },
  {
    key: "notes",
    label: "Add your notes & textbooks",
    hint: "So I can help you study from them",
    tint: "#2563eb",
    Icon: NotebookPen,
    seed: "I'd like to add my notes and textbooks so you can help me study. Here's what I'm working with:\n",
  },
  {
    key: "tests",
    label: "Quiz, lab & test dates",
    hint: "I'll plan your study time around them",
    tint: "#7c3aed",
    Icon: FlaskConical,
    seed: "Here's my quiz, lab, and test schedule so you can keep me ahead of it:\n",
  },
  {
    key: "tools",
    label: "Connect your tools",
    hint: "Email, Canvas, calendar & more",
    tint: "#d97706",
    Icon: Blocks,
    href: "/dashboard/integrations",
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
  | { state: "idle" } // permission not yet granted — show an enable link
  | { state: "loading" }
  | { state: "ok"; tempF: number; code: number }
  | { state: "denied" }
  | { state: "unavailable" };

function useWeather() {
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

  // Only auto-load when permission is already granted, so students aren't prompted for
  // location every time they open a new chat.
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

  return { wx, load };
}

function WeatherPiece() {
  const { wx, load } = useWeather();
  const view = wx.state === "ok" ? describeWeather(wx.code) : null;
  const Icon = view?.Icon ?? MapPin;

  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div className="leading-tight">
        <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Local weather
        </div>
        {wx.state === "ok" && view ? (
          <div className="text-sm font-semibold text-foreground">
            {wx.tempF}&deg; · {view.label}
          </div>
        ) : wx.state === "loading" ? (
          <div className="text-sm text-muted-foreground">Checking…</div>
        ) : wx.state === "idle" ? (
          <button
            type="button"
            onClick={load}
            className="text-sm font-semibold text-primary hover:underline"
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

function DatePiece() {
  // Null on the server / first paint to avoid a hydration mismatch; fills in on mount.
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
    <div className="text-right leading-tight">
      <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {weekday || "Today"}
      </div>
      <div className="text-sm font-semibold text-foreground">{now ? `${date} · ${time}` : "—"}</div>
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
      {/* Live status strip: weather · date/time */}
      <div
        className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-2xl border border-border/70 px-4 py-3 shadow-sm"
        style={{
          background: accent
            ? `linear-gradient(120deg, ${accent}12, transparent 70%), var(--card)`
            : "linear-gradient(120deg, hsl(var(--secondary)) 0%, var(--card) 70%)",
        }}
      >
        <WeatherPiece />
        <DatePiece />
      </div>

      {/* Quick-start cards */}
      <div className="mt-4 flex items-center justify-between px-0.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Keep your agent up to speed
        </span>
        {todaysClasses.length > 0 && (
          <span className="hidden truncate pl-3 text-xs text-muted-foreground sm:block">
            Today: {todaysClasses.map((c) => (c.time ? `${c.name} at ${c.time}` : c.name)).join(" · ")}
          </span>
        )}
      </div>

      <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {ACTIONS.map((a) => {
          const inner = (
            <>
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: `linear-gradient(135deg, ${a.tint}26, ${a.tint}0d)`, color: a.tint }}
              >
                <a.Icon className="h-[18px] w-[18px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">{a.label}</span>
                <span className="block text-xs text-muted-foreground">{a.hint}</span>
              </span>
            </>
          );
          const cls =
            "group flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3.5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-md";
          return a.href ? (
            <Link key={a.key} href={a.href} className={cls}>
              {inner}
            </Link>
          ) : (
            <button key={a.key} type="button" onClick={() => a.seed && onSeed(a.seed)} className={cls}>
              {inner}
            </button>
          );
        })}
      </div>
    </div>
  );
}
