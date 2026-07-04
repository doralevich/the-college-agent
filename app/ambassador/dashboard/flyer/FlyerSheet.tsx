"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

// Print-ready flyer. Screen shows a preview + print button; @media print strips the
// chrome so what comes out of the printer is just the flyer.

export function FlyerSheet({ code, slug }: { code: string; slug: string }) {
  const link = `https://thecollegeagent.ai/r/${slug}`;
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(link, { width: 900, margin: 1, color: { dark: "#0b1729", light: "#ffffff" } })
      .then(setQr)
      .catch(() => {});
  }, [link]);

  return (
    <div style={{ background: "#e9e7df", minHeight: "100vh", padding: "30px 16px" }}>
      <div className="flyer-toolbar" style={{ maxWidth: 640, margin: "0 auto 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <a href="/ambassador/dashboard" style={{ fontSize: 13, color: "#0b1729", textDecoration: "underline" }}>
          &larr; Back to dashboard
        </a>
        <button
          type="button"
          onClick={() => window.print()}
          style={{ background: "#2D7A3A", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
        >
          Print flyer
        </button>
      </div>

      <div className="flyer-sheet">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/thecollegeagent.png" alt="The College Agent" style={{ width: 170, height: "auto", margin: "0 auto 18px", display: "block" }} />
        <h1 style={{ fontSize: 40, fontWeight: 800, color: "#0b1729", textAlign: "center", lineHeight: 1.1, margin: "0 0 10px", letterSpacing: "-.02em" }}>
          Your own AI agent.
          <br />
          For all of college.
        </h1>
        <p style={{ fontSize: 17, lineHeight: 1.6, color: "#3d4a5c", textAlign: "center", maxWidth: 420, margin: "0 auto 22px" }}>
          It knows your classes, tracks every deadline, plans your studying, drafts your emails,
          and never sleeps. Live in 30 minutes.
        </p>
        {qr && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qr} alt="Scan to try the demo" style={{ width: 230, height: 230, display: "block", margin: "0 auto 16px", border: "1px solid #d8d5ca", borderRadius: 12 }} />
        )}
        <p style={{ textAlign: "center", fontSize: 14, color: "#3d4a5c", margin: "0 0 18px" }}>
          Scan to try the free demo, or visit <strong>thecollegeagent.ai/r/{slug}</strong>
        </p>
        <div style={{ background: "#2D7A3A", borderRadius: 14, padding: "16px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "rgba(255,255,255,.8)", marginBottom: 4 }}>
            $50 off with code
          </div>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 34, fontWeight: 800, color: "#fff", letterSpacing: ".04em" }}>{code}</div>
        </div>
        <p style={{ textAlign: "center", fontSize: 11, color: "#8a8778", marginTop: 16 }}>
          The College Agent, a division of Apollo Claw &middot; 7-day money-back guarantee
        </p>
      </div>

      <style>{`
        .flyer-sheet {
          background: #fff; max-width: 640px; margin: 0 auto; padding: 46px 44px;
          border-radius: 18px; box-shadow: 0 18px 50px rgba(11,23,41,.14);
        }
        @media print {
          .flyer-toolbar { display: none !important; }
          body { background: #fff !important; }
          .flyer-sheet { box-shadow: none; border-radius: 0; max-width: none; padding: 24px; }
        }
      `}</style>
    </div>
  );
}
