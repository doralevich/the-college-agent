"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// Top nav: the pages a prospect reaches for first. Most are flat links; "Resources"
// is a dropdown grouping the read-more pages. Audience/use-case pages not listed here
// (High School, Study, Internships, About) stay reachable from the footer sitemap.
type NavChild = { label: string; href: string };
type NavItem = { label: string; href?: string; children?: NavChild[] };
const NAV_LINKS: NavItem[] = [
  { label: "Students", href: "/for-students" },
  { label: "Parents", href: "/for-parents" },
  { label: "Athletics", href: "/for-athletics" },
  { label: "Administration", href: "/for-administration" },
  { label: "How It Works", href: "/how-it-works" },
  {
    label: "Resources",
    children: [
      { label: "Blog", href: "/blog" },
      { label: "What Is an Agent?", href: "/what-is-an-agent" },
      { label: "Become an Ambassador", href: "/ambassador" },
    ],
  },
  { label: "Contact", href: "/contact" },
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

  // "My Dashboard" dropdown in the utility bar: Open Dashboard / Log Out when signed
  // in, Log In when not. Closes on outside click.
  const [acctOpen, setAcctOpen] = useState(false);
  const acctRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (acctRef.current && !acctRef.current.contains(e.target as Node)) setAcctOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  async function logout() {
    try {
      await createClient().auth.signOut();
    } catch {
      /* signOut is best-effort; the redirect resets UI state regardless */
    }
    window.location.assign("/");
  }

  // External links open in a new tab.
  const extProps = (href: string) =>
    href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {};

  return (
    <>
      <nav className="site-nav" style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "#fff", borderBottom: "1px solid rgba(11,23,41,.08)",
        boxShadow: "0 1px 4px rgba(11,23,41,.06)",
      }}>
        {/* Utility bar (40px: 26 + 7 top/bottom) + main row (logo with 25px above and
            below) — pages offset with paddingTop: 114 to clear the fixed header. */}
        <div className="nav-topbar" style={{ background: "var(--navy, #0b1729)", padding: "7px 0" }}>
          <div className="nav-topbar-inner">
            <a href="mailto:hello@thecollegeagent.ai" className="nav-topbar-link" style={{ marginRight: "auto" }}>
              hello@thecollegeagent.ai
            </a>
            <div ref={acctRef} style={{ position: "relative" }}>
              <button
                type="button"
                className="nav-topbar-link"
                aria-haspopup="menu"
                aria-expanded={acctOpen}
                onClick={() => setAcctOpen((o) => !o)}
              >
                My Dashboard <span aria-hidden style={{ fontSize: 9 }}>&#9662;</span>
              </button>
              {acctOpen && (
                <div className="nav-topbar-menu" role="menu">
                  {authed ? (
                    <>
                      <Link href="/dashboard" className="nav-topbar-item" role="menuitem">Open Dashboard</Link>
                      <button type="button" className="nav-topbar-item" role="menuitem" onClick={logout}>
                        Log Out
                      </button>
                    </>
                  ) : (
                    <a href="/login" className="nav-topbar-item" role="menuitem">Log In</a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          maxWidth: 1400, margin: "0 auto", padding: "25px 48px",
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
            {NAV_LINKS.map(l => l.children ? (
              <div key={l.label} className="nav-dropdown">
                <button type="button" className="nav-dropdown-trigger" aria-haspopup="menu">
                  {l.label} <span aria-hidden style={{ fontSize: 9 }}>&#9662;</span>
                </button>
                <div className="nav-dropdown-menu" role="menu">
                  {l.children.map(c => (
                    <a key={c.href} href={c.href} className="nav-dropdown-item" role="menuitem" {...extProps(c.href)}>{c.label}</a>
                  ))}
                </div>
              </div>
            ) : (
              <a key={l.href} href={l.href} className="nav-link" {...extProps(l.href!)}>{l.label}</a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="nav-cta-desktop">
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
            {NAV_LINKS.map(l => l.children ? (
              <div key={l.label} className="nav-mobile-group">
                <div className="nav-mobile-grouplabel">{l.label}</div>
                {l.children.map(c => (
                  <a key={c.href} href={c.href} className="nav-mobile-link nav-mobile-sublink" onClick={() => setOpen(false)} {...extProps(c.href)}>
                    {c.label}
                  </a>
                ))}
              </div>
            ) : (
              <a key={l.href} href={l.href!} className="nav-mobile-link" onClick={() => setOpen(false)} {...extProps(l.href!)}>
                {l.label}
              </a>
            ))}
            <a href="/build" className="btn-purple nav-mobile-cta" onClick={() => setOpen(false)}>
              Build My Agent
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

        /* Resources dropdown (desktop): opens on hover/focus; a transparent bridge over
           the gap keeps it open while the cursor travels from trigger to menu. */
        .nav-dropdown { position: relative; display: inline-flex; }
        .nav-dropdown-trigger {
          font-family: var(--font-mono); font-size: 12px; font-weight: 600;
          letter-spacing: .08em; text-transform: uppercase; color: rgba(11,23,41,.8);
          background: none; border: none; cursor: pointer; padding: 0;
          display: inline-flex; align-items: center; gap: 5px; white-space: nowrap;
          transition: color .15s;
        }
        .nav-dropdown-trigger:hover { color: var(--green); }
        .nav-dropdown::after {
          content: ""; position: absolute; top: 100%; left: -8px; right: -8px; height: 16px;
        }
        .nav-dropdown-menu {
          position: absolute; left: 50%; transform: translateX(-50%); top: calc(100% + 14px);
          background: #fff; border: 1px solid rgba(11,23,41,.1); border-radius: 10px;
          box-shadow: 0 12px 32px rgba(11,23,41,.16); min-width: 210px; padding: 8px;
          display: none; flex-direction: column; z-index: 120;
        }
        .nav-dropdown:hover .nav-dropdown-menu,
        .nav-dropdown:focus-within .nav-dropdown-menu { display: flex; }
        .nav-dropdown-item {
          font-family: var(--font-mono); font-size: 11px; font-weight: 600;
          letter-spacing: .06em; text-transform: uppercase; color: rgba(11,23,41,.8);
          padding: 10px 12px; border-radius: 6px; transition: background .12s, color .12s;
          white-space: nowrap; text-decoration: none;
        }
        .nav-dropdown-item:hover { background: rgba(61,139,61,.08); color: var(--green); }

        .nav-cta-desktop {
          display: flex; align-items: center; gap: 20px;
        }
        .nav-topbar-inner {
          max-width: 1400px; margin: 0 auto; padding: 0 48px;
          height: 26px; display: flex; align-items: center; justify-content: flex-end;
        }
        .nav-topbar-link {
          font-family: var(--font-mono); font-size: 11px; font-weight: 600;
          letter-spacing: .08em; text-transform: none; color: rgba(255,255,255,.85);
          transition: color .15s; white-space: nowrap;
          background: none; border: none; cursor: pointer; padding: 0;
          display: inline-flex; align-items: center; gap: 5px;
        }
        .nav-topbar-link:hover { color: var(--green); }
        .nav-topbar-menu {
          position: absolute; right: 0; top: calc(100% + 8px); z-index: 120;
          background: #fff; border: 1px solid rgba(11,23,41,.1); border-radius: 8px;
          box-shadow: 0 12px 32px rgba(11,23,41,.16); min-width: 170px; padding: 6px;
          display: flex; flex-direction: column;
        }
        .nav-topbar-item {
          display: block; width: 100%; text-align: left;
          font-family: var(--font-mono); font-size: 11px; font-weight: 600;
          letter-spacing: .06em; text-transform: uppercase; color: rgba(11,23,41,.8);
          background: none; border: none; cursor: pointer;
          padding: 9px 12px; border-radius: 6px; transition: background .12s, color .12s;
          text-decoration: none;
        }
        .nav-topbar-item:hover { background: rgba(61,139,61,.08); color: var(--green); }
        @media (max-width: 1000px) {
          .nav-topbar-inner { padding: 0 24px; }
        }
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
        .nav-mobile-grouplabel {
          font-family: var(--font-mono); font-size: 11px; font-weight: 700;
          letter-spacing: .1em; text-transform: uppercase; color: rgba(11,23,41,.38);
          padding: 14px 0 2px;
        }
        .nav-mobile-sublink { padding-left: 14px; }
        .nav-mobile-cta {
          margin-top: 16px; width: 100%; text-align: center;
          font-size: 13px; padding: 14px 0;
        }
        .nav-mobile-powered {
          font-family: var(--font-mono); font-size: 10px;
          color: rgba(11,23,41,.3); letter-spacing: .06em;
          text-align: center; margin-top: 12px;
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
          .nav-link, .nav-dropdown-trigger { font-size: 11px; letter-spacing: .05em; }
          .nav-cta-desktop { gap: 10px; }
          .btn-purple { font-size: 11px !important; padding: 9px 16px !important; }
        }
      `}</style>
    </>
  );
}
