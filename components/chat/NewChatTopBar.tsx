"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
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
  Sunrise,
  type LucideIcon,
} from "lucide-react";

// The New Chat "worth at the top" panel, split left/right so it stays compact: an interactive
// local-weather forecast on the left (current conditions, feels-like, high/low, sunrise, an
// hourly strip and a what-to-wear tip, all from the browser's geolocation) and a tidy column of
// quick-start actions on the right. Rendered only on the empty New Chat state.

type ClassInfo = { name: string; days: string; time: string };

export type WeatherData = {
  city?: string;
  tempF: number;
  feelsF: number;
  code: number;
  isDay: boolean;
  hiF: number;
  loF: number;
  sunrise?: string;
  hours: { label: string; tempF: number; code: number }[];
};

const ACTIONS: {
  key: string;
  label: string;
  tint: string;
  Icon: LucideIcon;
  seed?: string;
  href?: string;
}[] = [
  {
    key: "schedule",
    label: "Update class schedule",
    tint: "#3d8b3d",
    Icon: CalendarClock,
    seed: "Let's update my class schedule. Here are my classes, with the days and times:\n",
  },
  {
    key: "notes",
    label: "Add notes & textbooks",
    tint: "#2563eb",
    Icon: NotebookPen,
    seed: "I'd like to add my notes and textbooks so you can help me study. Here's what I'm working with:\n",
  },
  {
    key: "tests",
    label: "Quiz, lab & test dates",
    tint: "#7c3aed",
    Icon: FlaskConical,
    seed: "Here's my quiz, lab, and test schedule so you can keep me ahead of it:\n",
  },
  {
    key: "tools",
    label: "Connect your tools",
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

// A subtle condition/time tint layered over the card so the weather feels alive (kept light).
function weatherSkin(code: number, isDay: boolean): string {
  const cloud = code === 2 || code === 3 || code === 45 || code === 48;
  const rain = (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95;
  const snow = (code >= 71 && code <= 77) || code === 85 || code === 86;
  if (!isDay) return "linear-gradient(140deg, rgba(30,41,59,.12), rgba(99,102,241,.09))";
  if (rain) return "linear-gradient(140deg, rgba(100,116,139,.13), rgba(56,189,248,.12))";
  if (snow) return "linear-gradient(140deg, rgba(147,197,253,.16), rgba(224,242,254,.24))";
  if (cloud) return "linear-gradient(140deg, rgba(148,163,184,.12), rgba(203,213,225,.18))";
  return "linear-gradient(140deg, rgba(252,211,77,.20), rgba(56,189,248,.14))";
}

function fmtClock(iso?: string): string | undefined {
  if (!iso) return undefined;
  const h = parseInt(iso.slice(11, 13), 10);
  const m = iso.slice(14, 16);
  if (!Number.isFinite(h)) return undefined;
  return `${((h + 11) % 12) + 1}:${m} ${h < 12 ? "AM" : "PM"}`;
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
            `&hourly=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,sunrise` +
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
              sunrise: fmtClock(wxRes.daily?.sunrise?.[0]),
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

function useNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function WeatherCard({ accent, demo }: { accent?: string; demo?: WeatherData }) {
  const { wx, load } = useWeather(demo);
  const now = useNow();
  const weekday = now?.toLocaleDateString(undefined, { weekday: "long" }) ?? "Today";
  const dateLine =
    now?.toLocaleDateString(undefined, { month: "long", day: "numeric" }) +
    " · " +
    (now?.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) ?? "");

  const card = "flex h-full flex-col rounded-2xl border border-border/70 p-4 shadow-sm";

  if (wx.state !== "ok") {
    return (
      <div className={card} style={{ background: "var(--card)" }}>
        <div className="flex items-start justify-between">
          <div className="leading-tight">
            <div className="text-[15px] font-semibold text-foreground">{now ? weekday : "Today"}</div>
            <div className="text-xs text-muted-foreground">{now ? dateLine : "—"}</div>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MapPin className="h-[18px] w-[18px]" />
          </span>
        </div>
        <div className="mt-auto pt-4">
          {wx.state === "loading" ? (
            <div className="text-sm text-muted-foreground">Checking your local forecast…</div>
          ) : wx.state === "idle" ? (
            <button
              type="button"
              onClick={load}
              className="text-sm font-semibold text-primary hover:underline"
            >
              Turn on your local forecast
            </button>
          ) : (
            <div className="text-sm text-muted-foreground">Weather unavailable</div>
          )}
        </div>
      </div>
    );
  }

  const d = wx.data;
  const cur = describeWeather(d.code, d.isDay);
  return (
    <div className={card} style={{ background: `${weatherSkin(d.code, d.isDay)}, var(--card)` }}>
      <div className="flex items-start justify-between">
        <div className="leading-tight">
          <div className="text-[15px] font-semibold text-foreground">{weekday}</div>
          <div className="text-xs text-muted-foreground">{now ? dateLine : ""}</div>
        </div>
        <cur.Icon className="h-11 w-11 shrink-0" strokeWidth={1.6} style={{ color: accent ?? "var(--primary)" }} />
      </div>

      <div className="mt-1 flex items-end gap-2">
        <span className="text-[34px] font-semibold leading-none text-foreground">{d.tempF}&deg;</span>
        <span className="pb-1 text-sm font-medium text-foreground/80">{cur.label}</span>
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
        <span>Feels like {d.feelsF}&deg;</span>
        <span>
          H {d.hiF}&deg; · L {d.loF}&deg;
        </span>
        {d.city && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {d.city}
          </span>
        )}
        {d.sunrise && (
          <span className="inline-flex items-center gap-1">
            <Sunrise className="h-3 w-3" />
            {d.sunrise}
          </span>
        )}
      </div>

      <div className="mt-2.5 flex items-baseline gap-1.5 rounded-lg bg-foreground/[0.04] px-3 py-1.5 text-xs text-foreground/75">
        <span className="shrink-0 whitespace-nowrap font-semibold text-foreground/80">What to wear</span>
        <span aria-hidden className="shrink-0">·</span>
        <span className="min-w-0">{whatToWear(d.feelsF, d.code)}</span>
      </div>

      {d.hours.length > 0 && (
        <div className="mt-auto flex gap-1 overflow-x-auto pt-3">
          {d.hours.map((h, i) => {
            const hv = describeWeather(h.code, d.isDay);
            return (
              <div
                key={i}
                className="flex min-w-[46px] flex-col items-center gap-1 rounded-xl px-1.5 py-1.5 transition-colors hover:bg-foreground/[0.04]"
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

function ActionsColumn({
  classes,
  onSeed,
}: {
  classes: ClassInfo[];
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
    <div className="flex h-full flex-col">
      <div className="mb-2 px-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Keep your agent up to speed
      </div>
      {todaysClasses.length > 0 && (
        <div className="mb-2 truncate px-0.5 text-[11px] text-muted-foreground">
          Today: {todaysClasses.map((c) => (c.time ? `${c.name} at ${c.time}` : c.name)).join(" · ")}
        </div>
      )}
      <div className="grid flex-1 auto-rows-fr gap-2">
        {ACTIONS.map((a) => {
          const inner = (
            <>
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{ background: `linear-gradient(135deg, ${a.tint}26, ${a.tint}0d)`, color: a.tint }}
              >
                <a.Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1 text-[13px] font-semibold leading-tight text-foreground">
                {a.label}
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </>
          );
          const cls =
            "group flex items-center gap-2.5 rounded-xl border border-border/70 bg-card px-3 py-2 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-md";
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
  return (
    <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
      <WeatherCard accent={accent} demo={demoWeather} />
      <ActionsColumn classes={classes} onSeed={onSeed} />
    </div>
  );
}
