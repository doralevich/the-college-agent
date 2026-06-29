"use client";

import { useEffect } from "react";
import Image from "next/image";

// First-run landing on the student dashboard. Greets as Frankenstein (the agent's
// persona), lists the three things to do, and offers one big button into Chat.
// Brand tokens, copy, and behavior come from the build brief — keep it tight to
// that spec; the only dynamic bit is the student's first name.

const t = {
  green: "#2D7A3A",
  greenDeep: "#1B5E2A",
  greenSoft: "#E8F1E6",
  paper: "#F6F8F3",
  card: "#FFFFFF",
  ink: "#1A2421",
  inkSoft: "#5C6660",
  line: "#DEE6DA",
};

const FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=DM+Sans:wght@400;500;600;700&display=swap";

const steps = [
  {
    title: "Tell me about you",
    body:
      "Your major and minor, the classes you're juggling, what your days look like, family, friends, whatever you want me to know. The more I get your world, the more useful I can be.",
  },
  {
    title: "Connect your tools",
    body:
      "Head to the Integrations tab in the sidebar and link the apps you already live in: email, Google Docs, Outlook, Dropbox, Canvas, Blackbaud, and thousands more. Search, click a couple times, you're set.",
  },
  {
    title: "Ask me something",
    body:
      'Once your email or calendar is connected, try "What\'s on my calendar this week?" and watch me go.',
  },
];

export function WelcomeView({
  firstName,
  onOpenChat,
}: {
  firstName: string | null;
  // agentName comes from the parent but we intentionally don't render it —
  // the welcome speaks as "Frankenstein" per the brief, regardless of the row.
  agentName?: string | null;
  onOpenChat: () => void;
}) {
  const name = firstName?.trim() || "there";

  // Inject Fraunces + DM Sans on mount so we don't have to wire them into the
  // app's font config; cleaned up on unmount to avoid duplicates on navigation.
  useEffect(() => {
    const links: HTMLLinkElement[] = [];
    const add = (attrs: Record<string, string>) => {
      const el = document.createElement("link");
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
      document.head.appendChild(el);
      links.push(el);
    };
    add({ rel: "preconnect", href: "https://fonts.googleapis.com" });
    add({ rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" });
    add({ rel: "stylesheet", href: FONTS_HREF });
    return () => links.forEach((el) => el.remove());
  }, []);

  return (
    <div
      style={{
        minHeight: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 4px",
        background: `radial-gradient(120% 80% at 50% -10%, ${t.greenSoft} 0%, transparent 55%), ${t.paper}`,
        fontFamily: "'DM Sans', system-ui, sans-serif",
        color: t.ink,
        margin: "-16px",
      }}
    >
      <div
        style={{
          background: t.card,
          width: "100%",
          maxWidth: 620,
          border: `1px solid ${t.line}`,
          borderRadius: 24,
          padding: "48px 44px 40px",
          boxShadow: "0 1px 2px rgba(26,36,33,.04), 0 24px 60px -28px rgba(27,94,42,.28)",
        }}
        className="ca-welcome-card"
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 26 }}>
          <Image
            src="/thecollegeagent.png"
            alt="Frankenstein, your College Agent"
            width={150}
            height={150}
            className="ca-mascot"
            style={{ height: 150, width: "auto", objectFit: "contain" }}
            priority
          />
        </div>

        <h1
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: 34,
            lineHeight: 1.12,
            fontWeight: 600,
            letterSpacing: "-.01em",
            textAlign: "center",
            margin: "0 0 14px",
            color: t.ink,
          }}
        >
          Hey <span style={{ color: t.green }}>{name}</span>, I&apos;m Frankenstein.
        </h1>

        <p
          style={{
            textAlign: "center",
            fontSize: 17,
            lineHeight: 1.6,
            color: t.inkSoft,
            maxWidth: 480,
            margin: "0 auto 36px",
          }}
        >
          Think of me as your sidekick for everything college throws at you, from your first
          syllabus all the way to graduation and whatever comes after.
        </p>

        <ol
          style={{
            listStyle: "none",
            borderTop: `1px solid ${t.line}`,
            margin: "0 0 34px",
            padding: 0,
          }}
        >
          {steps.map((s, i) => (
            <li
              key={s.title}
              style={{
                display: "flex",
                gap: 18,
                padding: "22px 0",
                borderBottom: `1px solid ${t.line}`,
              }}
            >
              <span
                style={{
                  flex: "0 0 auto",
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: t.greenSoft,
                  color: t.greenDeep,
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontWeight: 600,
                  fontSize: 15,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 1,
                }}
              >
                {i + 1}
              </span>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 4px", color: t.ink }}>
                  {s.title}
                </h3>
                <p style={{ fontSize: 15, lineHeight: 1.55, color: t.inkSoft, margin: 0 }}>{s.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div style={{ textAlign: "center" }}>
          <button
            type="button"
            onClick={onOpenChat}
            className="ca-cta"
            style={{
              border: "none",
              cursor: "pointer",
              fontFamily: "'DM Sans', system-ui, sans-serif",
              fontSize: 16,
              fontWeight: 600,
              color: "#fff",
              background: t.green,
              padding: "15px 40px",
              borderRadius: 12,
              boxShadow: "0 8px 20px -8px rgba(45,122,58,.6)",
            }}
          >
            Open Chat
          </button>
          <p style={{ marginTop: 14, fontSize: 13, color: t.inkSoft }}>
            Takes about two minutes to get rolling.
          </p>
        </div>
      </div>

      <style>{`
        .ca-mascot {
          animation: ca-bob 4.5s ease-in-out infinite;
          transform-origin: center bottom;
        }
        @keyframes ca-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-7px); }
        }
        .ca-cta { transition: background .18s ease, transform .18s ease; }
        .ca-cta:hover { background: ${t.greenDeep}; transform: translateY(-1px); }
        .ca-cta:active { transform: translateY(0); }
        .ca-cta:focus-visible { outline: 3px solid ${t.greenSoft}; outline-offset: 3px; }
        @media (max-width: 560px) {
          .ca-welcome-card { padding: 36px 22px 32px !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ca-mascot { animation: none; }
        }
      `}</style>
    </div>
  );
}
