"use client";

import { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";

// Client half of the ambassador dashboard: live stats from /api/ambassador/me,
// copyable code + link, a QR for flyers/tabling, payout rail settings, and the toolkit.

type Me = {
  ambassador: {
    full_name: string;
    status: string;
    code: string | null;
    slug: string | null;
    cleared_count: number;
    w9_on_file: boolean;
    payout_method: string | null;
    payout_handle: string | null;
  };
  stats: { pendingCount: number; clearedUnpaidCents: number; unappliedAdjCents: number; paidCents: number };
  payouts: Array<{ run_date: string; total_cents: number; status: string }>;
  signups: Array<{ when: string; who: string; status: string; bounty_cents: number | null }>;
};

const usd = (cents: number) =>
  "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 });

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid rgba(11,23,41,.08)",
  borderRadius: 16,
  padding: "26px 28px",
  marginBottom: 20,
};

export function AmbassadorDashboard() {
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [method, setMethod] = useState<"paypal" | "venmo">("paypal");
  const [handle, setHandle] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/ambassador/me");
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message ?? "load failed");
      setMe(body as Me);
      const m = (body as Me).ambassador;
      if (m.payout_method === "venmo" || m.payout_method === "paypal") setMethod(m.payout_method);
      if (m.payout_handle) setHandle(m.payout_handle);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const link = me?.ambassador.slug ? `https://thecollegeagent.ai/r/${me.ambassador.slug}` : null;

  useEffect(() => {
    if (!link) return;
    QRCode.toDataURL(link, { width: 480, margin: 1, color: { dark: "#0b1729", light: "#ffffff" } })
      .then(setQr)
      .catch(() => {});
  }, [link]);

  function copy(text: string, tag: string) {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(tag);
      setTimeout(() => setCopied(null), 1600);
    });
  }

  async function savePayout() {
    setSaving(true);
    try {
      const res = await fetch("/api/ambassador/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, handle }),
      });
      if (!res.ok) throw new Error("save failed");
      await load();
    } catch {
      setError("Couldn't save your payout details. Try again.");
    } finally {
      setSaving(false);
    }
  }

  if (error) return <div style={card}>Something went wrong: {error}</div>;
  if (!me) return <div style={card}>Loading your dashboard…</div>;

  const a = me.ambassador;
  const s = me.stats;
  const netUnpaid = s.clearedUnpaidCents + s.unappliedAdjCents;
  const tier = a.cleared_count >= 10 ? "$100 per sale" : "$75 per sale";
  const toTier2 = Math.max(0, 10 - a.cleared_count);

  return (
    <div>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--green)" }}>
        Ambassador Dashboard
      </span>
      <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--navy)", margin: "8px 0 24px" }}>
        Welcome back, {a.full_name.split(" ")[0]}.
      </h1>

      {/* W-9 gate banner */}
      {!a.w9_on_file && netUnpaid > 0 && (
        <div style={{ ...card, background: "#FEF3C7", border: "1px solid #F59E0B" }}>
          <strong style={{ color: "#78350F" }}>One step before we can pay you:</strong>{" "}
          <span style={{ color: "#78350F" }}>
            you have {usd(netUnpaid)} cleared, and we need a completed W-9 on file before any payout
            is released. Email it to{" "}
            <a href="mailto:hello@thecollegeagent.ai" style={{ color: "#78350F", textDecoration: "underline" }}>
              hello@thecollegeagent.ai
            </a>{" "}
            and we&apos;ll flip the switch.
          </span>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 20 }}>
        {[
          { label: "In the 7-day window", value: String(s.pendingCount) },
          { label: "Cleared, next payout", value: usd(Math.max(netUnpaid, 0)) },
          { label: "Paid to date", value: usd(s.paidCents) },
          { label: "Lifetime cleared", value: String(a.cleared_count) },
        ].map((t) => (
          <div key={t.label} style={{ background: "#fff", border: "1px solid rgba(11,23,41,.08)", borderRadius: 14, padding: "18px 20px" }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: "var(--navy)" }}>{t.value}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".07em", color: "rgba(11,23,41,.5)", marginTop: 4 }}>
              {t.label}
            </div>
          </div>
        ))}
      </div>

      {/* Code + link + QR */}
      <div style={card}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--navy)", marginBottom: 4 }}>Your code and link</h2>
        <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "rgba(11,23,41,.6)", marginBottom: 16 }}>
          Your code gives friends <strong>$50 off</strong> and credits the sale to you. Current tier: <strong>{tier}</strong>
          {toTier2 > 0 ? ` (${toTier2} more cleared sale${toTier2 === 1 ? "" : "s"} to reach $100 per sale)` : ""}.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 18, alignItems: "center" }}>
          <div style={{ flex: "1 1 280px", minWidth: 0 }}>
            <button
              type="button"
              onClick={() => a.code && copy(a.code, "code")}
              style={{ width: "100%", textAlign: "left", background: "rgba(61,139,61,.08)", border: "1.5px dashed var(--green)", borderRadius: 12, padding: "14px 16px", cursor: "pointer", marginBottom: 10 }}
            >
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700, color: "var(--green)" }}>{a.code}</span>
              <span style={{ float: "right", fontSize: 11, color: "rgba(11,23,41,.45)", marginTop: 8 }}>
                {copied === "code" ? "Copied!" : "Tap to copy"}
              </span>
            </button>
            {link && (
              <button
                type="button"
                onClick={() => copy(link, "link")}
                style={{ width: "100%", textAlign: "left", background: "#fff", border: "1px solid rgba(11,23,41,.12)", borderRadius: 12, padding: "12px 16px", cursor: "pointer" }}
              >
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--navy)", wordBreak: "break-all" }}>{link}</span>
                <span style={{ display: "block", fontSize: 11, color: "rgba(11,23,41,.45)", marginTop: 4 }}>
                  {copied === "link" ? "Copied!" : "Tap to copy your share link"}
                </span>
              </button>
            )}
          </div>
          {qr && (
            <div style={{ textAlign: "center" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="Your ambassador QR code" style={{ width: 132, height: 132, borderRadius: 10, border: "1px solid rgba(11,23,41,.1)" }} />
              <a href={qr} download={`college-agent-${a.slug}.png`} style={{ display: "block", fontSize: 11.5, color: "var(--green)", textDecoration: "underline", marginTop: 6 }}>
                Download QR
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Who signed up */}
      <div style={card}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--navy)", marginBottom: 4 }}>Your signups</h2>
        <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "rgba(11,23,41,.6)", marginBottom: 12 }}>
          Every sale credited to your code or link, newest first. A sale clears 7 days after
          purchase, then it counts toward your next payout.
        </p>
        {me.signups.length === 0 ? (
          <p style={{ fontSize: 14, color: "rgba(11,23,41,.55)", margin: 0 }}>
            No signups yet. Share your link and this list fills itself.
          </p>
        ) : (
          me.signups.map((s, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "9px 0", borderBottom: "1px solid rgba(11,23,41,.06)", fontSize: 14 }}>
              <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--navy)" }}>
                {new Date(s.when).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {s.who}
              </span>
              <span style={{ flexShrink: 0, fontWeight: 600, color: s.status === "cleared" || s.status === "paid" ? "var(--green)" : "rgba(11,23,41,.5)" }}>
                {s.status === "pending" ? "clearing" : s.status}
                {s.bounty_cents ? ` · ${usd(s.bounty_cents)}` : ""}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Payout settings */}
      <div style={card}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--navy)", marginBottom: 4 }}>How you get paid</h2>
        <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "rgba(11,23,41,.6)", marginBottom: 14 }}>
          Payouts run every other Friday: $75 for each of your first 10 cleared sales, $100 for every
          one after, once each sale clears the 7-day window. PayPal or Venmo only.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          {(["paypal", "venmo"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              style={{
                padding: "9px 18px", borderRadius: 999, fontSize: 13.5, fontWeight: 600, cursor: "pointer",
                border: `1.5px solid ${method === m ? "var(--green)" : "rgba(11,23,41,.15)"}`,
                background: method === m ? "var(--green)" : "#fff",
                color: method === m ? "#fff" : "var(--navy)",
              }}
            >
              {m === "paypal" ? "PayPal" : "Venmo"}
            </button>
          ))}
          <input
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder={method === "paypal" ? "you@email.com" : "@your-venmo"}
            style={{ flex: "1 1 200px", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(11,23,41,.15)", fontSize: 14 }}
          />
          <button
            type="button"
            onClick={savePayout}
            disabled={saving || !handle.trim()}
            style={{ padding: "10px 22px", borderRadius: 10, border: "none", background: "var(--green)", color: "#fff", fontSize: 13.5, fontWeight: 700, cursor: "pointer", opacity: saving || !handle.trim() ? 0.6 : 1 }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {/* Payout history */}
      {me.payouts.length > 0 && (
        <div style={card}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--navy)", marginBottom: 12 }}>Payout history</h2>
          {me.payouts.map((p, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(11,23,41,.06)", fontSize: 14 }}>
              <span style={{ color: "rgba(11,23,41,.65)" }}>{p.run_date}</span>
              <span style={{ fontWeight: 600, color: "var(--navy)" }}>
                {usd(p.total_cents)} · {p.status === "held_no_w9" ? "held (W-9 needed)" : p.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Toolkit */}
      <div style={card}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--navy)", marginBottom: 4 }}>Your toolkit</h2>
        <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "rgba(11,23,41,.6)", marginBottom: 14 }}>
          Brand assets and the playbook. One rule that keeps everyone safe: when you post about The
          College Agent, disclose the relationship (a simple <strong>#ad</strong> or &ldquo;I earn a
          commission&rdquo; works). It&apos;s an FTC requirement and part of your ambassador terms.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
          <a href="/ambassador/dashboard/flyer" style={{ background: "var(--green)", color: "#fff", fontSize: 13, fontWeight: 700, padding: "10px 18px", borderRadius: 9, textDecoration: "none" }}>Print your QR flyer</a>
          <a href="/ambassador/playbook" style={{ background: "#fff", color: "var(--green)", border: "1.5px solid var(--green)", fontSize: 13, fontWeight: 700, padding: "9px 18px", borderRadius: 9, textDecoration: "none" }}>Open the playbook</a>
        </div>

        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "rgba(11,23,41,.5)", marginBottom: 8 }}>Downloads</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 10, marginBottom: 18 }}>
          {[
            { src: "/thecollegeagent.png", label: "Mascot" },
            { src: "/mascot-left.png", label: "Mascot 2" },
            { src: "/avatars/preset-11.webp", label: "Bot 1" },
            { src: "/avatars/preset-13.webp", label: "Bot 2" },
            { src: "/avatars/preset-14.webp", label: "Bot 3" },
            { src: "/logo-college-agent.png", label: "Logo" },
            { src: "/logo-college-agent-white.png", label: "Logo (white)" },
            { src: "/og-image.jpg", label: "Social card" },
          ].map((a2) => (
            <a key={a2.src} href={a2.src} download style={{ textDecoration: "none", textAlign: "center" }}>
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 76, background: a2.label === "Logo (white)" ? "var(--navy)" : "rgba(11,23,41,.04)", border: "1px solid rgba(11,23,41,.08)", borderRadius: 10, overflow: "hidden", padding: 8 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a2.src} alt={a2.label} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
              </span>
              <span style={{ display: "block", fontSize: 11, color: "rgba(11,23,41,.6)", marginTop: 4 }}>{a2.label}</span>
            </a>
          ))}
        </div>

        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "rgba(11,23,41,.5)", marginBottom: 8 }}>Ready-to-post captions (tap to copy)</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            `My AI agent literally plans my week, tracks every deadline, and quizzes me before tests. Try the free demo: ${link ?? "thecollegeagent.ai/demo"} (code ${a.code} = $50 off) #ad`,
            `I stopped missing deadlines. My College Agent turns syllabi into calendars, builds study plans, even drafts emails to professors. Free demo: ${link ?? "thecollegeagent.ai/demo"} · my code ${a.code} takes $50 off #ad`,
            `POV: an AI that actually knows YOUR classes. Free demo: ${link ?? "thecollegeagent.ai/demo"} · ${a.code} saves $50 #ad`,
          ].map((cap, i) => (
            <button
              key={i}
              type="button"
              onClick={() => copy(cap, `cap${i}`)}
              style={{ textAlign: "left", background: "rgba(11,23,41,.03)", border: "1px solid rgba(11,23,41,.08)", borderRadius: 10, padding: "11px 14px", fontSize: 13, lineHeight: 1.55, color: "var(--navy)", cursor: "pointer" }}
            >
              {cap}
              <span style={{ display: "block", fontSize: 11, color: copied === `cap${i}` ? "var(--green)" : "rgba(11,23,41,.4)", marginTop: 4, fontWeight: 600 }}>
                {copied === `cap${i}` ? "Copied!" : "Tap to copy"}
              </span>
            </button>
          ))}
        </div>
        <p style={{ fontSize: 12, color: "rgba(11,23,41,.5)", marginTop: 12, marginBottom: 0 }}>
          Brand green: <span style={{ fontFamily: "var(--font-mono)" }}>#2D7A3A</span> · Keep the #ad on every post (FTC rule, and it&apos;s in your terms).
        </p>
      </div>
    </div>
  );
}
