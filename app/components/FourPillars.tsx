/* eslint-disable @next/next/no-img-element */

// "The Four Pillars" — what makes an agent an agent (Memory, Context, Judgment,
// Execution). Shared by the What Is an Agent page and the homepage so they stay in sync.

const PILLARS = [
  {
    guy: "/avatars/guy-04.webp",
    title: "Memory",
    desc: "Reminds you of your classes, projects, deadlines, relationships, preferences, and previous conversations.",
  },
  {
    guy: "/avatars/guy-10.webp",
    title: "Context",
    desc: "Understands everything happening across your schedule, coursework, commitments, and connected applications.",
  },
  {
    guy: "/avatars/guy-08.webp",
    title: "Judgment",
    desc: "Learns how you make decisions, communicate, prioritize, and solve problems—so its recommendations feel like your own.",
  },
  {
    guy: "/avatars/guy-12.webp",
    title: "Execution",
    desc: "Organizes, plans, drafts, tracks, schedules, and completes tasks across your connected tools, rather than simply generating responses.",
  },
];

export function FourPillars({ background = "var(--cream2)" }: { background?: string }) {
  return (
    <section style={{ background, padding: "72px 0" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 46 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--green)", marginBottom: 14, display: "block" }}>
            What Makes It an Agent
          </span>
          <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, color: "var(--navy)", letterSpacing: "-.025em", margin: 0 }}>
            The Four Pillars
          </h2>
        </div>
        <div className="pillar-grid">
          {PILLARS.map(({ guy, title, desc }) => (
            <div key={title} className="pillar-card">
              <img src={guy} alt="" loading="lazy" />
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .pillar-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; }
        .pillar-card {
          background: #fff; border: 1px solid rgba(11,23,41,.07); border-radius: 18px;
          padding: 32px 28px; box-shadow: 0 8px 28px rgba(11,23,41,.04); text-align: center;
        }
        .pillar-card img { width: 92px; height: auto; margin: 0 auto 6px; display: block; filter: drop-shadow(0 10px 18px rgba(27,94,42,.2)); }
        .pillar-card h3 { font-size: 19px; font-weight: 800; color: var(--navy); margin: 0 0 8px; letter-spacing: -.015em; }
        .pillar-card p { font-size: 14.5px; line-height: 1.65; color: rgba(11,23,41,.66); margin: 0; }
        @media (max-width: 1000px) { .pillar-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 560px) { .pillar-grid { grid-template-columns: 1fr; } }
      `}</style>
    </section>
  );
}
