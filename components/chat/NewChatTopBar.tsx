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
  Moon,
  NotebookPen,
  Sun,
  type LucideIcon,
} from "lucide-react";

// The New Chat "worth at the top" panel: an interactive local-weather forecast (current
// conditions, an hourly strip, and a what-to-wear tip, all from the browser's geolocation)
// plus a compact 2-across set of quick-start cards that seed the composer or link to the tab
// that owns the data. Rendered only on the empty New Chat state.

type ClassInfo = { name: string; days: string; time: string };

export type WeatherData = {
  city?: string;
  tempF: number;
  feelsF: number;
  code: number;
  isDay: boolean;
  hiF: number;
  loF: number;
  hours: { label: string; tempF: number; code: number }[];
};

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
    label: "Class schedule",
    hint: "Keep classes, days & times current",
    tint: "#3d8b3d",
    Icon: CalendarClock,
    seed: "Let's update my class schedule. Here are my classes, with the days and times:\n",
  },
  {
    key: "notes",
    label: "Notes & textbooks",
    hint: "So I can help you study from them",
    tint: "#2563eb",
    Icon: NotebookPen,
    seed: "I'd like to add my notes and textbooks so you can help me study. Here's what I'm working with:\n",
  },
  {
    key: "tests",
    label: "Quiz, lab & test dates",
    hint: "I'll plan study time around them",
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
function describeWeather(code: number, isDay = true): { label: string; Icon: LucideIcon } {
  if (code === 0) return { label: "Clear", Icon: isDay ? Sun : Moon };
  if (code === 1 || code === 2) return { label: "Partly cloudy", Icon: CloudSun };
  if (code === 3) return { label: "Overcast", Icon: Cloud };
  if (code === 45 || code === 48) return { label: "Foggy", Icon: CloudFog };
  if (code >= 51 && code <= 57) return { label: "Drizzle", Icon: CloudDrizzle };
  if (code >= 61 && code <= 67) return { label: "Rain", Icon: CloudRain };
  if (code >= 71 && code <= 77) return { label: "Snow", Icon: CloudSnow };
  if (code >= 80 && code <= 82) return { label: "Showers", Icon: CloudRain };
  if (code === 85 || code === 86) return { label: "Snow showers", Icon: CloudSnow };
  if (code >= 95) return { label: "Storms", Icon: CloudLightning };
  return { label: "Weather", Icon: Cloud };
}

// A short "what to wear" tip from the feels-like temp and conditions.
function whatToWear(feelsF: number, code: number): string {
  const rainy = (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95;
  const snowy = (code >= 71 && code <= 77) || code === 85 || code === 86;
  if (snowy) return "Boots and a warm coat, it's snowing";
  let base: string;
  if (feelsF < 33) base = "Heavy coat, hat and gloves";
  else if (feelsF < 48) base = "A warm jacket";
  else if (feelsF < 60) base = "A light jacket or hoodie";
  else if (feelsF < 72) base = "Long sleeves, comfortable out";
  else if (feelsF < 84) base = "T-shirt weather";
  else base = "Stay cool, light layers and water";
  return rainy ? `${base}, grab an umbrella` : base;
}

// A subtle condition/time tint layered over the card so the weather feels alive.
function weatherSkin(code: number, isDay: boolean): string {
  const cloud = code === 2 || code === 3 || code === 45 || code === 48;
  const rain = (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95;
  const snow = (code >= 71 && code <= 77) || code === 85 || code === 86;
  if (!isDay) return "linear-gradient(135deg, rgba(30,41,59,.14), rgba(99,102,241,.10))";
  if (rain) return "linear-gradient(135deg, rgba(100,116,139,.14), rgba(56,189,248,.12))";
  if (snow) return "linear-gradient(135deg, rgba(147,197,253,.16), rgba(224,242,254,.22))";
  if (cloud) return "linear-gradient(135deg, rgba(148,163,184,.12), rgba(203,213,225,.16))";
  return "linear-gradient(135deg, rgba(252,211,77,.18), rgba(56,189,248,.14))";
}

type WeatherState =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "ok"; data: WeatherData }
  | { state: "denied" }
  | { state: "unavailable" };

function useWeather(demo?: WeatherData) {
  const [wx, setWx] = useState<WeatherState>(demo ? { state: "ok", data: demo } : { state: "loading" });

  const load = useCallback(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setWx({ state: "unavailable" });
      return;
    }
    setWx({ state: "loading" });
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: la, longitude: lo } = pos.coords;
          const url =
            `https://api.open-meteo.com/v1/forecast?latitude=${la.toFixed(3)}&longitude=${lo.toFixed(3)}` +
            `&current=temperature_2m,apparent_temperature,weather_code,is_day` +
            `&hourly=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min` +
            `&forecast_days=1&temperature_unit=fahrenheit&timezone=auto`;
          const [wxRes, city] = await Promise.all([
            fetch(url).then((r) => r.json()),
            fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${la.toFixed(
                3
              )}&longitude=${lo.toFixed(3)}&localityLanguage=en`
            )
              .then((r) => r.json())
              .then((g) => g.city || g.locality || g.principalSubdivision || undefined)
              .catch(() => undefined),
          ]);

          const cur = wxRes?.current;
          if (!cur || !Number.isFinite(cur.temperature_2m)) {
            setWx({ state: "unavailable" });
            return;
          }

          // Build the next few hourly slots starting from the current hour.
          const times: string[] = wxRes.hourly?.time ?? [];
          const temps: number[] = wxRes.hourly?.temperature_2m ?? [];
          const codes: number[] = wxRes.hourly?.weather_code ?? [];
          const prefix = String(cur.time ?? "").slice(0, 13);
          let start = times.findIndex((t) => t.slice(0, 13) === prefix);
          if (start < 0) start = 0;
          const hours: WeatherData["hours"] = [];
          for (let i = start; i < start + 6 && i < times.length; i++) {
            const h = parseInt(times[i].slice(11, 13), 10);
            const label = i === start ? "Now" : `${((h + 11) % 12) + 1}${h < 12 ? "a" : "p"}`;
            hours.push({ label, tempF: Math.round(temps[i]), code: codes[i] });
          }

          setWx({
            state: "ok",
            data: {
              city,
              tempF: Math.round(cur.temperature_2m),
              feelsF: Math.round(cur.apparent_temperature ?? cur.temperature_2m),
              code: Number(cur.weather_code ?? 0),
              isDay: Number(cur.is_day ?? 1) === 1,
              hiF: Math.round(wxRes.daily?.temperature_2m_max?.[0] ?? cur.temperature_2m),
              loF: Math.round(wxRes.daily?.temperature_2m_min?.[0] ?? cur.temperature_2m),
              hours,
            },
          });
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
    if (demo) return;
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
  }, [demo, load]);

  return { wx, load };
}

function DateStamp() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  const weekday = now?.toLocaleDateString(undefined, { weekday: "long" }) ?? "";
  const date = now?.toLocaleDateString(undefined, { month: "short", day: "numeric" }) ?? "";
  const time = now?.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) ?? "";
  return (
    <div className="text-right leading-tight">
      <div className="text-xs font-semibold text-foreground">{weekday || "Today"}</div>
      <div className="text-[11px] text-muted-foreground">{now ? `${date} · ${time}` : "—"}</div>
    </div>
  );
}

function WeatherCard({ accent, demo }: { accent?: string; demo?: WeatherData }) {
  const { wx, load } = useWeather(demo);

  const baseCard =
    "rounded-2xl border border-border/70 p-4 shadow-sm transition-colors";
  const cardStyle = (skin?: string) => ({
    background: skin ? `${skin}, var(--card)` : "var(--card)",
  });

  if (wx.state === "ok") {
    const d = wx.data;
    const cur = describeWeather(d.code, d.isDay);
    return (
      <div className={baseCard} style={cardStyle(weatherSkin(d.code, d.isDay))}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <cur.Icon className="h-11 w-11 shrink-0" style={{ color: accent ?? "var(--primary)" }} strokeWidth={1.6} />
            <div className="leading-tight">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[28px] font-semibold text-foreground">{d.tempF}&deg;</span>
                <span className="text-sm font-medium text-foreground/80">{cur.label}</span>
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                {d.city && (
                  <>
                    <MapPin className="h-3 w-3" />
                    <span className="font-medium text-foreground/70">{d.city}</span>
                    <span aria-hidden>·</span>
                  </>
                )}
                <span>
                  H {d.hiF}&deg; / L {d.loF}&deg;
                </span>
              </div>
            </div>
          </div>
          <DateStamp />
        </div>

        <div className="mt-3 flex items-baseline gap-1.5 rounded-lg bg-foreground/[0.04] px-3 py-1.5 text-xs text-foreground/75">
          <span className="shrink-0 whitespace-nowrap font-semibold text-foreground/80">What to wear</span>
          <span aria-hidden className="shrink-0">·</span>
          <span className="min-w-0">{whatToWear(d.feelsF, d.code)}</span>
        </div>

        {d.hours.length > 0 && (
          <div className="mt-3 flex gap-1 overflow-x-auto pb-0.5">
            {d.hours.map((h, i) => {
              const hv = describeWeather(h.code, d.isDay);
              return (
                <div
                  key={i}
                  className="flex min-w-[50px] flex-col items-center gap-1 rounded-xl px-2 py-2 transition-colors hover:bg-foreground/[0.04]"
                >
                  <span className="text-[10px] font-medium text-muted-foreground">{h.label}</span>
                  <hv.Icon className="h-4 w-4 text-foreground/70" />
                  <span className="text-xs font-semibold text-foreground">{h.tempF}&deg;</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Non-ok compact states.
  return (
    <div className={`${baseCard} flex items-center justify-between gap-3`} style={cardStyle()}>
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MapPin className="h-[18px] w-[18px]" />
        </span>
        <div className="leading-tight">
          <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Local weather
          </div>
          {wx.state === "loading" ? (
            <div className="text-sm text-muted-foreground">Checking…</div>
          ) : wx.state === "idle" ? (
            <button type="button" onClick={load} className="text-sm font-semibold text-primary hover:underline">
              Turn on your local forecast
            </button>
          ) : (
            <div className="text-sm text-muted-foreground">Weather unavailable</div>
          )}
        </div>
      </div>
      <DateStamp />
    </div>
  );
}

export function NewChatTopBar({
  classes = [],
  accent,
  onSeed,
  demoWeather,
}: {
  classes?: ClassInfo[];
  accent?: string;
  // Drop a starter message into the composer and focus it.
  onSeed: (text: string) => void;
  // Preview-only: force the weather card into its rendered state with sample data.
  demoWeather?: WeatherData;
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
      <WeatherCard accent={accent} demo={demoWeather} />

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

      <div className="mt-2 grid grid-cols-2 gap-2.5">
        {ACTIONS.map((a) => {
          const inner = (
            <>
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ background: `linear-gradient(135deg, ${a.tint}26, ${a.tint}0d)`, color: a.tint }}
              >
                <a.Icon className="h-[17px] w-[17px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold leading-tight text-foreground">{a.label}</span>
                <span className="mt-0.5 hidden truncate text-[11px] text-muted-foreground sm:block">{a.hint}</span>
              </span>
            </>
          );
          const cls =
            "group flex items-center gap-2.5 rounded-2xl border border-border/70 bg-card p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-md";
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
