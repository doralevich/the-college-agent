import { NewsletterSignup } from "./NewsletterSignup";

// The site-wide dark footer: newsletter signup, brand, links, copyright. Self-contained
// styling (no dependence on per-page .dark-section rules) so it renders identically on
// every marketing page.

const CALENDLY = "https://calendly.com/therealdaveo/apolloai";

const LINKS = [
  { label: "Try the Demo", href: "/demo" },
  { label: "Book a Consultation", href: CALENDLY },
  { label: "Blog", href: "/blog" },
  { label: "Ambassador Program", href: "/ambassador" },
  { label: "Contact", href: "https://apolloclaw.ai/contact" },
  { label: "Apollo[Claw]", href: "https://apolloclaw.ai" },
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
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
        <div>
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
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          {LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.href.startsWith("http") ? "_blank" : undefined}
              rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
              style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(255,255,255,.65)", letterSpacing: ".04em", transition: "color .15s", textDecoration: "none" }}
            >
              {link.label}
            </a>
          ))}
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(255,255,255,.4)", width: "100%", marginTop: 20, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,.06)" }}>
          &copy; 2026 Apollo[Claw]. All rights reserved. &nbsp;&middot;&nbsp; thecollegeagent.ai
        </div>
      </div>
    </footer>
  );
}
