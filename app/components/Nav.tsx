"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// Top nav: the pages a prospect reaches for first, as a flat row (no dropdown). The
// audience/use-case pages not listed here (High School, Study, Internships, About) stay
// reachable from the full sitemap in the footer.
const NAV_LINKS = [
  { label: "For Students", href: "/for-students" },
  { label: "For Parents", href: "/for-parents" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Demo", href: "/demo" },
  { label: "Blog", href: "/blog" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "https://apolloclaw.ai/contact" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);

  // Swap the "Log In" affordance for "Dashboard" once we know the visitor already has a
  // session. Starts false so the first client render matches the static SSR'd markup
  // (no hydration mismatch); the browser session resolves a tick later and flips it.
  const [authed, setAuthed] = useState(false);
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) =>
      setAuthed(!!session)
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  const accountHref = authed ? "/dashboard" : "/login";
  const accountLabel = authed ? "Dashboard" : "Log In";

  // External links (e.g. Contact -> apolloclaw.ai) open in a new tab.
  const extProps = (href: string) =>
    href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {};

  return (
    <>
      <nav className="site-nav" style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "#fff", borderBottom: "1px solid rgba(11,23,41,.08)",
        boxShadow: "0 1px 4px rgba(11,23,41,.06)",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          height: 72, maxWidth: 1400, margin: "0 auto", padding: "0 48px",
        }}>
          {/* Logo */}
          <Link href="/">
            <Image
              src="/logo-college-agent.svg"
              alt="The College [Agent]"
              width={310}
              height={30}
              priority
              style={{ width: "clamp(170px, 18vw, 240px)", height: "auto", display: "block" }}
            />
          </Link>

          {/* Desktop links */}
          <div className="nav-links-desktop">
            {NAV_LINKS.map(l => (
              <a key={l.href} href={l.href} className="nav-link" {...extProps(l.href)}>{l.label}</a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="nav-cta-desktop">
            <a href={accountHref} className="nav-login-btn">
              {accountLabel}
            </a>
            <a href="/build" className="btn-purple" style={{ fontSize: 12, padding: "10px 22px" }}>
              Build My Agent
            </a>
          </div>

          {/* Hamburger */}
          <button
            className="nav-hamburger"
            onClick={() => setOpen(o => !o)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            <span className={`ham-bar ${open ? "ham-bar-1-open" : ""}`} />
            <span className={`ham-bar ${open ? "ham-bar-2-open" : ""}`} />
            <span className={`ham-bar ${open ? "ham-bar-3-open" : ""}`} />
          </button>
        </div>

        {/* Mobile drawer */}
        {open && (
          <div className="nav-mobile-drawer">
            {NAV_LINKS.map(l => (
              <a key={l.href} href={l.href} className="nav-mobile-link" onClick={() => setOpen(false)} {...extProps(l.href)}>
                {l.label}
              </a>
            ))}
            <a href="/build" className="btn-purple nav-mobile-cta" onClick={() => setOpen(false)}>
              Build My Agent
            </a>
            <a href={accountHref} className="nav-mobile-login" onClick={() => setOpen(false)}>
              {accountLabel}
            </a>
          </div>
        )}
      </nav>

      <style>{`
        .nav-links-desktop {
          display: flex; align-items: center; gap: 28px;
        }
        .nav-link {
          font-family: var(--font-mono); font-size: 12px; font-weight: 600;
          letter-spacing: .08em; text-transform: uppercase;
          color: rgba(11,23,41,.8); transition: color .15s; white-space: nowrap;
        }
        .nav-link:hover { color: var(--green); }

        .nav-cta-desktop {
          display: flex; align-items: center; gap: 20px;
        }
        .nav-login-btn {
          font-family: var(--font-mono); font-size: 11px; font-weight: 600;
          letter-spacing: .06em; color: rgba(11,23,41,.6);
          border: 1.5px solid rgba(11,23,41,.2); border-radius: 4px;
          padding: 8px 18px; transition: border-color .15s, color .15s; white-space: nowrap;
        }
        .nav-login-btn:hover { border-color: var(--green); color: var(--green); }
        .nav-hamburger {
          display: none; flex-direction: column; justify-content: center;
          gap: 5px; background: none; border: none; cursor: pointer;
          padding: 4px; width: 36px; height: 36px;
        }
        .ham-bar {
          display: block; width: 22px; height: 2px;
          background: var(--navy); border-radius: 2px;
          transition: transform .2s, opacity .2s;
          transform-origin: center;
        }
        .ham-bar-1-open { transform: translateY(7px) rotate(45deg); }
        .ham-bar-2-open { opacity: 0; }
        .ham-bar-3-open { transform: translateY(-7px) rotate(-45deg); }

        .nav-mobile-drawer {
          background: #fff; border-top: 1px solid rgba(11,23,41,.07);
          padding: 20px 24px 28px; display: flex; flex-direction: column; gap: 4px;
        }
        .nav-mobile-link {
          font-family: var(--font-mono); font-size: 12px; font-weight: 600;
          letter-spacing: .08em; text-transform: uppercase;
          color: rgba(11,23,41,.85); padding: 12px 0;
          border-bottom: 1px solid rgba(11,23,41,.06);
          transition: color .15s;
        }
        .nav-mobile-link:hover { color: var(--green); }
        .nav-mobile-cta {
          margin-top: 16px; width: 100%; text-align: center;
          font-size: 13px; padding: 14px 0;
        }
        .nav-mobile-powered {
          font-family: var(--font-mono); font-size: 10px;
          color: rgba(11,23,41,.3); letter-spacing: .06em;
          text-align: center; margin-top: 12px;
        }
        .nav-mobile-login {
          font-family: var(--font-mono); font-size: 12px; font-weight: 600;
          letter-spacing: .06em; color: rgba(11,23,41,.55);
          text-align: center; margin-top: 8px; padding: 10px 0;
        }

        /* iPad portrait + all mobile: use hamburger */
        @media (max-width: 1000px) {
          .nav-links-desktop { display: none; }
          .nav-cta-desktop { display: none; }
          .nav-hamburger { display: flex; }
        }

        /* Tablet/laptop (1001-1200px): tighten spacing so the seven links don't crowd */
        @media (min-width: 1001px) and (max-width: 1200px) {
          .site-nav > div { padding-left: 24px !important; padding-right: 24px !important; }
          .nav-links-desktop { gap: 16px; }
          .nav-link { font-size: 11px; letter-spacing: .05em; }
          .nav-cta-desktop { gap: 10px; }
          .btn-purple { font-size: 11px !important; padding: 9px 16px !important; }
        }
      `}</style>
    </>
  );
}
