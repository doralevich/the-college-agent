import { NewsletterSignup } from "./NewsletterSignup";

// The site-wide dark footer: newsletter signup, brand, a compact Company link column, and
// copyright with Privacy/Terms. Self-contained styling (no dependence on per-page
// .dark-section rules) so it renders identically on every marketing page.

const CALENDLY = "https://calendly.com/therealdaveo/apolloai";

const FOOTER_COLUMNS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "Company",
    links: [
      { label: "FAQ", href: "/faq" },
      { label: "Ambassador Program", href: "/ambassador" },
      { label: "Schedule a Consultation", href: CALENDLY },
      { label: "Contact", href: "https://apolloclaw.ai/contact" },
    ],
  },
];

// Privacy + Terms live in the bottom bar opposite the copyright, not in a column.
const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms & Conditions", href: "/terms" },
];

export function Footer() {
  return (
    <footer style={{ background: "var(--navy, #0b1729)", padding: "48px 0" }}>
      <div style={{ maxWidth: 1160, margin: "0 auto 32px", padding: "0 24px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20, borderBottom: "1px solid rgba(255,255,255,.06)" }}>
        <div style={{ maxWidth: 420 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--green)", marginBottom: 8 }}>Newsletter</div>
          <p style={{ fontFamily: "var(--font-inter, Inter, sans-serif)", fontSize: 14, color: "rgba(255,255,255,.6)", margin: "0 0 4px", lineHeight: 1.5 }}>
            College tips, product updates, and what students are doing with their agents. No spam, unsubscribe anytime.
          </p>
        </div>
        <div style={{ flex: "1 1 320px", maxWidth: 420 }}>
          <NewsletterSignup />
        </div>
      </div>
      <div className="footer-grid" style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 40 }}>
        <div style={{ maxWidth: 260 }}>
          <div style={{ fontFamily: "var(--font-inter, Inter, sans-serif)", fontSize: 18, fontWeight: 800, letterSpacing: "-.02em", color: "#fff" }}>
            The College <span style={{ color: "var(--green)" }}>[Agent]</span>
          </div>
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(255,255,255,.45)", letterSpacing: ".06em" }}>
            Powered by
            <a href="https://apolloclaw.ai" target="_blank" rel="noopener noreferrer" aria-label="Apollo Claw" style={{ display: "inline-flex", alignItems: "center", borderRadius: 4, background: "#fff", padding: "4px 7px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/apollo-claw.svg" alt="Apollo Claw" style={{ height: 16, width: "auto" }} />
            </a>
          </div>
        </div>

        {FOOTER_COLUMNS.map((col) => (
          <div key={col.heading} className="footer-col">
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".12em", color: "rgba(255,255,255,.4)", marginBottom: 14 }}>
              {col.heading}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {col.links.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target={link.href.startsWith("http") ? "_blank" : undefined}
                  rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="footer-link"
                  style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(255,255,255,.65)", letterSpacing: ".04em", textDecoration: "none" }}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        ))}

        <div className="footer-bottom" style={{ width: "100%", marginTop: 20, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,.06)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(255,255,255,.4)", letterSpacing: ".04em" }}>
            &copy; 2026 Apollo[Claw]. All rights reserved. &nbsp;&middot;&nbsp; thecollegeagent.ai
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            {LEGAL_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="footer-link"
                style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(255,255,255,.55)", letterSpacing: ".04em", textDecoration: "none" }}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .footer-link:hover { color: var(--green) !important; }
        @media (max-width: 720px) {
          .footer-grid { gap: 28px !important; }
          .footer-col { flex: 1 1 40%; min-width: 140px; }
        }
      `}</style>
    </footer>
  );
}
