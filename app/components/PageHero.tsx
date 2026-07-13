// The standard marketing page header: dark section, hero text on the left, the robot
// mascot flush to the text on the right, sentence-case headline at the shared (smaller)
// hero size. One component so every page header stays identical. The mascot rotates from
// the agent cast (pickMascot) so different pages show different agents; pass `mascot` to
// pin a specific one.

import { pickMascot } from "@/lib/mascots";

type Cta = { label: string; href: string };

export function PageHero({
  label,
  title,
  sub,
  primary,
  secondary,
  mascot,
  titleSize,
  largeMascot,
}: {
  label: string;
  title: string;
  sub: string;
  primary?: Cta;
  secondary?: Cta;
  mascot?: string;
  titleSize?: string;
  // The compact avatar Guys (e.g. crossed-arms guy-09) render smaller than the tall
  // agent poses; set this to scale them up so the hero feels the same size.
  largeMascot?: boolean;
}) {
  const mascotSrc = mascot ?? pickMascot(label);
  return (
    <section className="ph-hero" style={{ padding: "64px 0 60px", overflow: "hidden", position: "relative" }}>
      <div className="ph-glow" />
      <div className="ph-row" style={{ position: "relative", zIndex: 1, maxWidth: 1160, margin: "0 auto", padding: "0 24px", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
        <div style={{ flex: "1 1 480px", minWidth: 0 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,.5)", marginBottom: 16, display: "block" }}>
            {label}
          </span>
          <h1 style={{ fontSize: titleSize ?? "clamp(26px, 3.2vw, 42px)", fontWeight: 800, color: "#fff", lineHeight: 1.1, letterSpacing: "-.03em", marginBottom: 18 }}>
            {title}
          </h1>
          <p style={{ fontSize: "clamp(15px, 1.3vw, 17px)", lineHeight: 1.7, color: "rgba(255,255,255,.65)", maxWidth: 560, margin: `0 0 ${primary || secondary ? "32px" : "0"}` }}>
            {sub}
          </p>
          {(primary || secondary) && (
            <div className="ph-cta" style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              {primary && <a href={primary.href} className="ph-btn">{primary.label}</a>}
              {secondary && <a href={secondary.href} className="ph-btn-outline">{secondary.label}</a>}
            </div>
          )}
        </div>
        <div className="ph-mascot-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mascotSrc} alt="The College Agent mascot" className={`ph-mascot${largeMascot ? " ph-mascot--lg" : ""}`} />
        </div>
      </div>

      <style>{`
        /* Blueprint grid over the navy hero: subtle squares that brighten toward the
           center and dissolve at the edges. Shared by every marketing page header. */
        .ph-hero {
          background:
            radial-gradient(130% 130% at 50% 38%, rgba(11,23,41,0) 0%, rgba(11,23,41,0) 52%, var(--navy, #0b1729) 93%),
            linear-gradient(rgba(255,255,255,.055) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.055) 1px, transparent 1px),
            var(--navy, #0b1729);
          background-size: 100% 100%, 84px 84px, 84px 84px, auto;
        }
        .ph-glow {
          position: absolute; top: -20%; left: 50%; transform: translateX(-50%);
          width: 70%; height: 120%;
          background: radial-gradient(ellipse at center, rgba(61,139,61,.12) 0%, transparent 60%);
          pointer-events: none;
        }
        .ph-row { display: flex; }
        /* Agent sits flush to the text on its left, not floating in the middle of its column. */
        .ph-mascot-wrap { flex: 0 0 300px; display: flex; align-items: center; justify-content: flex-start; }
        .ph-mascot {
          width: 100%; max-width: 340px; height: auto;
          filter: drop-shadow(0 24px 48px rgba(0,0,0,.35));
        }
        /* Compact avatar Guys scaled up to match the visual weight of the tall poses. */
        .ph-mascot--lg { max-width: 460px; }
        .ph-btn {
          display: inline-flex; align-items: center; justify-content: center;
          background: var(--green); color: #fff; font-size: 13px; font-weight: 700;
          letter-spacing: .08em; text-transform: uppercase; padding: 14px 30px;
          border-radius: 4px; box-shadow: 0 8px 24px rgba(61,139,61,.3);
          transition: filter .15s; border: none; cursor: pointer; text-decoration: none;
        }
        .ph-btn:hover { filter: brightness(1.1); }
        .ph-btn-outline {
          display: inline-flex; align-items: center; justify-content: center;
          background: transparent; color: #fff; font-size: 13px; font-weight: 700;
          letter-spacing: .08em; text-transform: uppercase; padding: 13px 30px;
          border-radius: 4px; border: 1.5px solid rgba(255,255,255,.35);
          transition: border-color .15s, background .15s; cursor: pointer; text-decoration: none;
        }
        .ph-btn-outline:hover { border-color: #fff; background: rgba(255,255,255,.07); }
        @media (max-width: 900px) {
          .ph-mascot-wrap { flex: 0 0 240px; }
          .ph-mascot { max-width: 240px; }
          .ph-mascot--lg { max-width: 300px; }
        }
        @media (max-width: 640px) {
          .ph-row { flex-direction: column; gap: 26px; text-align: center; }
          .ph-cta { justify-content: center; }
          .ph-mascot-wrap { flex: 0 0 auto; order: -1; margin: 0 auto; }
          .ph-mascot { max-width: 170px; }
          .ph-mascot--lg { max-width: 210px; }
        }
      `}</style>
    </section>
  );
}
