import { NewsletterSignup } from "./NewsletterSignup";

// The site-wide dark footer, stacked in three sections: brand (top), newsletter
// signup (middle), and copyright + legal (bottom). Self-contained styling (no
// dependence on per-page .dark-section rules) so it renders identically on every
// marketing page.

// Horizontal footer menu. "Schedule a Consultation" points at the /consultation landing
// page (which embeds Calendly and fires the Meta booking conversion) rather than jumping
// straight to Calendly, so every consultation funnels through the tracked page.
const MENU_LINKS = [
  { label: "For Athletics", href: "/for-athletics" },
  { label: "For Administration", href: "/for-administration" },
  { label: "FAQ", href: "/faq" },
  { label: "Ambassador Program", href: "/ambassador" },
  { label: "Demo", href: "/demo" },
  { label: "Schedule a Consultation", href: "/consultation" },
];

// Privacy + Terms live in the bottom bar opposite the copyright, not in a column.
const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms & Conditions", href: "/terms" },
];

export function Footer() {
  return (
    <footer style={{ background: "var(--navy, #0b1729)", padding: "48px 0" }}>
      {/* Brand + menu (top) */}
      <div className="footer-grid" style={{ maxWidth: 1160, margin: "0 auto 32px", padding: "0 24px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 24, borderBottom: "1px solid rgba(255,255,255,.06)" }}>
        <div style={{ maxWidth: 300 }}>
          <div style={{ fontFamily: "var(--font-inter, Inter, sans-serif)", fontSize: 18, fontWeight: 800, letterSpacing: "-.02em", color: "#fff" }}>
            The College <span style={{ color: "var(--green)" }}>[Agent]</span>
          </div>
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(255,255,255,.8)", letterSpacing: ".06em" }}>
            Powered by
            <a href="https://apolloclaw.ai" target="_blank" rel="noopener noreferrer" aria-label="Apollo Claw" style={{ display: "inline-flex", alignItems: "center" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/apollo-claw-white.svg" alt="Apollo Claw" style={{ height: 30, width: "auto" }} />
            </a>
          </div>
        </div>

        <nav className="footer-menu">
          {MENU_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.href.startsWith("http") ? "_blank" : undefined}
              rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="footer-link"
              style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#fff", letterSpacing: ".04em", textDecoration: "none", whiteSpace: "nowrap" }}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>

      {/* Newsletter (middle) */}
      <div style={{ maxWidth: 1160, margin: "0 auto 32px", padding: "0 24px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20, borderBottom: "1px solid rgba(255,255,255,.06)" }}>
        <div style={{ maxWidth: 420 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--green)", marginBottom: 8 }}>Newsletter</div>
          <p style={{ fontFamily: "var(--font-inter, Inter, sans-serif)", fontSize: 14, color: "rgba(255,255,255,.9)", margin: "0 0 4px", lineHeight: 1.5 }}>
            College tips, product updates, and what students are doing with their agents. No spam, unsubscribe anytime.
          </p>
        </div>
        <div style={{ flex: "1 1 320px", maxWidth: 420 }}>
          <NewsletterSignup />
        </div>
      </div>

      {/* Copyright + legal (bottom) */}
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(255,255,255,.95)", letterSpacing: ".04em" }}>
          &copy; 2026 Apollo[Claw]. All rights reserved. &nbsp;&middot;&nbsp;{" "}
          <a href="mailto:hello@thecollegeagent.ai" className="footer-link" style={{ color: "#fff", textDecoration: "none" }}>
            hello@thecollegeagent.ai
          </a>
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          {LEGAL_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="footer-link"
              style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#fff", letterSpacing: ".04em", textDecoration: "none" }}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>

      <style>{`
        .footer-link:hover { color: var(--green) !important; }
        .footer-menu { display: flex; align-items: center; flex-wrap: wrap; gap: 26px; }
        @media (max-width: 720px) {
          .footer-grid { gap: 22px !important; }
          .footer-menu { gap: 16px 20px; }
        }
      `}</style>
    </footer>
  );
}
