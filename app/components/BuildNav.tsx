import Image from "next/image";
import Link from "next/link";

// The checkout flow's header: same navy utility strip as the marketing nav (26px) over a
// 46px logo row, so the total stays the 72px the build pages offset for. Deliberately no
// menu links (checkout keeps focus), but with weight: guarantee up top, trust badge right.
export default function BuildNav() {
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: "#fff", borderBottom: "1px solid rgba(11,23,41,.08)",
      boxShadow: "0 1px 4px rgba(11,23,41,.06)",
    }}>
      <div style={{ background: "var(--navy, #0b1729)" }}>
        <div style={{
          maxWidth: 1400, margin: "0 auto", padding: "0 24px", height: 26,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-mono)", fontSize: 10.5, fontWeight: 600,
          letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,.85)",
        }}>
          7-day money-back guarantee&nbsp;&middot;&nbsp;Live in 30 minutes
        </div>
      </div>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 46, maxWidth: 1400, margin: "0 auto", padding: "0 24px", gap: 16,
      }}>
        <Link href="/">
          <Image
            src="/logo-college-agent.svg"
            alt="The College [Agent]"
            width={310}
            height={30}
            priority
            style={{ width: "min(220px, 52vw)", height: "auto", display: "block" }}
          />
        </Link>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600,
          letterSpacing: ".06em", color: "rgba(11,23,41,.6)", whiteSpace: "nowrap",
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
            <rect x="4" y="10" width="16" height="11" rx="2.5" stroke="currentColor" strokeWidth="2.2" />
            <path d="M8 10V7a4 4 0 1 1 8 0v3" stroke="currentColor" strokeWidth="2.2" />
          </svg>
          Secure checkout by Stripe
        </span>
      </div>
    </nav>
  );
}
