import type { Metadata } from "next";
import Nav from "../components/Nav";
import { PageHero } from "../components/PageHero";
import { Footer } from "../components/Footer";
import { CalendarDays, Plane, UserSearch, ShieldCheck, Mail, Trophy } from "lucide-react";

export const metadata: Metadata = {
  title: "AI Agents for College Administration & Athletics, The College Agent",
  description:
    "A professional AI agent for your office, program, or team. Scheduling, travel, recruiting coordination, compliance deadlines, communications, and game-day operations, handled. Built for college administration and athletic departments.",
  keywords: [
    "AI assistant for athletic departments",
    "AI for college administration",
    "athletic department operations software",
    "AI agent for coaches",
    "college staff AI assistant",
    "recruiting coordination AI",
  ],
  alternates: { canonical: "https://thecollegeagent.ai/for-athletics" },
  openGraph: {
    title: "AI Agents for College Administration & Athletics",
    description:
      "A professional AI agent for your office, program, or team. Scheduling, travel, recruiting, compliance, communications, and game-day operations, handled.",
    url: "https://thecollegeagent.ai/for-athletics",
    images: [{ url: "https://thecollegeagent.ai/og-image.png", width: 1200, height: 630, alt: "The College Agent" }],
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://thecollegeagent.ai" },
    { "@type": "ListItem", position: 2, name: "For Administration & Athletics", item: "https://thecollegeagent.ai/for-athletics" },
  ],
};

const CAPABILITIES = [
  {
    icon: CalendarDays,
    title: "Calendar & Scheduling",
    desc: "Practices, meetings, facilities, staff schedules, and the fifty small changes a week that come with them. Your agent keeps the calendar honest and everyone notified.",
  },
  {
    icon: Plane,
    title: "Team & Department Travel",
    desc: "Itineraries, rosters, hotel blocks, bus and flight times, meal stops, and the packet that has to reach everyone by Thursday. Planned, drafted, and tracked.",
  },
  {
    icon: UserSearch,
    title: "Recruiting Coordination",
    desc: "Visit schedules, follow-up emails, prospect notes, and reminders on contact windows, so no recruit slips because the week got busy.",
  },
  {
    icon: ShieldCheck,
    title: "Compliance & Deadlines",
    desc: "Eligibility paperwork, filing dates, required trainings, and renewal windows, surfaced before they're urgent, never after.",
  },
  {
    icon: Mail,
    title: "Communications",
    desc: "Emails to staff, athletes, parents, and campus partners, drafted in your voice and ready to send. Meeting notes and follow-ups captured while they're fresh.",
  },
  {
    icon: Trophy,
    title: "Event & Game-Day Operations",
    desc: "Run-of-show, staffing lists, vendor confirmations, and day-of checklists for games and events, organized in one place your whole staff can rely on.",
  },
];

export default function ForAthleticsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Nav />
      <main style={{ paddingTop: 114, minHeight: "100vh" }}>

        {/* HERO — pinned to the crossed-arms Guy: the confident, game-ready pose. */}
        <PageHero
          label="For Athletic Departments"
          title="Your program's busywork, handled."
          sub="A professional AI agent built for your office, department, or team. It learns your role, your calendar, and your season, then runs the scheduling, travel, communications, and deadlines that eat your week. Live in 30 minutes."
          primary={{ label: "Build a Professional Agent", href: "/build?plan=pro" }}
          secondary={{ label: "Book a Consultation", href: "/consultation" }}
          mascot="/avatars/guy-09.webp"
        />

        {/* THE PROBLEM */}
        <section style={{ background: "#fff", padding: "72px 0" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--green)", marginBottom: 14, display: "block" }}>The Reality</span>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, color: "var(--navy)", marginBottom: 20, letterSpacing: "-.025em" }}>
              Your best people spend their days on logistics.
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(11,23,41,.7)", marginBottom: 16 }}>
              Coaches recruiting at 10 PM. Operations staff rebuilding a travel itinerary for the
              third time. Administrators chasing signatures and filing dates. The work that wins
              seasons and serves students gets squeezed by the work that just keeps the lights on.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(11,23,41,.7)" }}>
              The College Agent gives every staff member a professional AI agent that knows their
              role, their department, and their school, and takes the logistics off their plate.
            </p>
          </div>
        </section>

        {/* CAPABILITIES */}
        <section style={{ background: "var(--cream2)", padding: "72px 0" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--green)", marginBottom: 14, display: "block" }}>What It Handles</span>
              <h2 style={{ fontSize: "clamp(24px, 3vw, 38px)", fontWeight: 800, color: "var(--navy)", letterSpacing: "-.025em" }}>
                Built around how a department actually runs.
              </h2>
              <p style={{ maxWidth: 700, margin: "16px auto 0", fontSize: 16, lineHeight: 1.7, color: "rgba(11,23,41,.66)" }}>
                During setup, your agent learns your title, your team or office, and what you want
                off your plate. Then it gets to work.
              </p>
            </div>
            <div className="cap-grid">
              {CAPABILITIES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="cap-card">
                  <div className="cap-icon"><Icon size={26} strokeWidth={2.2} /></div>
                  <div className="cap-text">
                    <h3>{title}</h3>
                    <p>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section style={{ background: "#fff", padding: "72px 0" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--green)", marginBottom: 14, display: "block" }}>How It Works</span>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 34px)", fontWeight: 800, color: "var(--navy)", marginBottom: 24, letterSpacing: "-.025em" }}>
              Live before your next staff meeting.
            </h2>
            <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 18 }}>
              {[
                ["Purchase the professional build", "One checkout for your office or program. Need several agents or a department rollout? Book a consultation and we'll structure it."],
                ["A five-minute intake, geared to your role", "Pick Administration or Athletic Department, tell it your title and team, and choose what to take off your plate."],
                ["Your agent goes live in about 30 minutes", "Connected to your calendar and email if you want, checking in proactively, and getting smarter about your program every week."],
              ].map(([title, desc], i) => (
                <li key={title} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <span style={{ flex: "0 0 auto", width: 34, height: 34, borderRadius: "50%", background: "rgba(61,139,61,.1)", color: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15 }}>{i + 1}</span>
                  <div>
                    <h3 style={{ fontSize: 17, fontWeight: 800, color: "var(--navy)", marginBottom: 6 }}>{title}</h3>
                    <p style={{ fontSize: 15, lineHeight: 1.7, color: "rgba(11,23,41,.66)", margin: 0 }}>{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* FINAL CTA — the rollout + cross-link nudges live here, under the buttons,
            instead of in their own band. */}
        <section className="dark-section cta-grid-bg" style={{ padding: "76px 0" }}>
          <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px", textAlign: "center" }}>
            <h2 style={{ fontSize: "clamp(26px, 3.4vw, 40px)", fontWeight: 800, color: "#fff", letterSpacing: "-.025em", marginBottom: 16 }}>
              Give your staff their week back.
            </h2>
            <p style={{ fontSize: 17, lineHeight: 1.7, color: "rgba(255,255,255,.7)", maxWidth: 560, margin: "0 auto 30px" }}>
              The logistics don&apos;t stop in-season or out. Put an agent on them, and let your
              people do the work only they can do.
            </p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
              <a href="/build?plan=pro" className="btn-green">Build a Professional Agent</a>
              <a href="/consultation" className="btn-outline">Book a Consultation</a>
            </div>
            <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "rgba(255,255,255,.65)", margin: "28px auto 0" }}>
              Rolling out to a whole staff or department? <a href="/consultation" style={{ color: "var(--green)", textDecoration: "underline" }}>Book a consultation</a> and we&apos;ll build a plan for your program.
              <br />
              In admissions, advising, or another campus office? See <a href="/for-administration" style={{ color: "var(--green)", textDecoration: "underline" }}>The College Agent for Administration</a>.
            </p>
          </div>
        </section>

      </main>

      <Footer />

      <style>{`
        .dark-section { background: var(--navy, #0b1729); }
        /* Dark twin of the /build graph-paper arc: fine + major grid lines over navy,
           under a soft green glow that dissolves toward the bottom. */
        .cta-grid-bg {
          background:
            radial-gradient(125% 74% at 50% 0%, rgba(11,23,41,0) 0%, rgba(11,23,41,0) 30%, var(--navy, #0b1729) 62%, var(--navy, #0b1729) 100%),
            linear-gradient(rgba(255,255,255,.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.07) 1px, transparent 1px),
            linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px),
            radial-gradient(92% 48% at 50% 0%, rgba(61,139,61,.30) 0%, rgba(61,139,61,.10) 45%, rgba(11,23,41,0) 74%),
            var(--navy, #0b1729);
          background-size: 100% 100%, 64px 64px, 64px 64px, 16px 16px, 16px 16px, 100% 100%, auto;
        }
        .cap-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .cap-card {
          background: #fff; border: 1px solid rgba(11,23,41,.07); border-radius: 16px;
          padding: 28px; box-shadow: 0 8px 28px rgba(11,23,41,.04);
          display: flex; gap: 16px; align-items: flex-start;
        }
        /* Flat solid tiles: bold green square, white glyph, matching the student/parent pages. */
        .cap-icon {
          width: 54px; height: 54px; border-radius: 16px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: var(--green); color: #fff;
          box-shadow: 0 8px 18px rgba(61,139,61,.28);
        }
        .cap-text { flex: 1; min-width: 0; }
        .cap-card h3 { font-size: 16px; font-weight: 800; color: var(--navy); margin-bottom: 9px; letter-spacing: -.01em; }
        .cap-card p { font-size: 13px; line-height: 1.65; color: rgba(11,23,41,.62); }
        .btn-green {
          display: inline-flex; align-items: center; justify-content: center;
          background: var(--green); color: #fff; font-size: 13px; font-weight: 700;
          letter-spacing: .08em; text-transform: uppercase; padding: 14px 30px;
          border-radius: 4px; box-shadow: 0 8px 24px rgba(61,139,61,.3);
          transition: filter .15s; border: none; cursor: pointer; text-decoration: none;
        }
        .btn-green:hover { filter: brightness(1.1); }
        .btn-outline {
          display: inline-flex; align-items: center; justify-content: center;
          background: transparent; color: #fff; font-size: 13px; font-weight: 700;
          letter-spacing: .08em; text-transform: uppercase; padding: 13px 30px;
          border-radius: 4px; border: 1.5px solid rgba(255,255,255,.35);
          transition: border-color .15s, background .15s; cursor: pointer; text-decoration: none;
        }
        .btn-outline:hover { border-color: #fff; background: rgba(255,255,255,.07); }
        .btn-outline-dark {
          display: inline-flex; align-items: center; justify-content: center;
          background: transparent; color: var(--navy); font-size: 13px; font-weight: 700;
          letter-spacing: .08em; text-transform: uppercase; padding: 13px 30px;
          border-radius: 4px; border: 1.5px solid rgba(11,23,41,.25);
          transition: border-color .15s; cursor: pointer; text-decoration: none;
        }
        .btn-outline-dark:hover { border-color: var(--navy); }
        @media (max-width: 900px) { .cap-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .cap-grid { grid-template-columns: 1fr; } }
      `}</style>
    </>
  );
}
