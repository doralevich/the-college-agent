"use client";

import { useSyncExternalStore } from "react";

// Cookie / tracking consent for GDPR & CCPA. Analytics and the Meta Pixel (GoogleAnalytics.tsx,
// MetaPixel.tsx) render their scripts ONLY when consent === "accepted", so no tracker loads until a
// visitor opts in. Choice is remembered in localStorage. This is the strict (opt-in) model; to run
// a lighter opt-out model instead, default the trackers to load and treat "declined" as the only
// blocking state.

const KEY = "cookie-consent"; // stored value: "accepted" | "declined"
const EVENT = "cookie-consent-change";

export type Consent = "accepted" | "declined" | null;

function readStore(): Consent {
  const v = window.localStorage.getItem(KEY);
  return v === "accepted" || v === "declined" ? v : null;
}

// Subscribe to consent changes — same tab (custom event) and across tabs (storage event).
function subscribe(onChange: () => void): () => void {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function getConsent(): Consent {
  return typeof window === "undefined" ? null : readStore();
}

// Live consent state via useSyncExternalStore: null on the server and until the visitor chooses,
// then "accepted"/"declined". Reading localStorage through the store keeps SSR/hydration correct.
export function useConsent(): Consent {
  return useSyncExternalStore(
    subscribe,
    readStore, // client snapshot
    () => null // server snapshot
  );
}

function choose(value: "accepted" | "declined") {
  window.localStorage.setItem(KEY, value);
  window.dispatchEvent(new Event(EVENT));
}

export default function CookieConsent() {
  const consent = useConsent();

  // Hidden once the visitor has chosen (and on the server, where consent reads null → shown after mount).
  if (consent !== null) return null;

  return (
    <div className="cc-banner" role="dialog" aria-live="polite" aria-label="Cookie consent">
      <p className="cc-text">
        We use cookies for analytics and advertising to improve The College Agent. You can accept or
        decline. See our <a href="/privacy">Privacy Policy</a>.
      </p>
      <div className="cc-actions">
        <button className="cc-btn cc-decline" onClick={() => choose("declined")}>Decline</button>
        <button className="cc-btn cc-accept" onClick={() => choose("accepted")}>Accept</button>
      </div>

      <style>{`
        .cc-banner {
          position: fixed; left: 20px; bottom: 20px; z-index: 9997;
          width: min(400px, calc(100vw - 40px));
          background: #fff; color: #16202e;
          border: 1px solid rgba(11,23,41,.12); border-radius: 14px;
          box-shadow: 0 18px 50px rgba(11,23,41,.18);
          padding: 18px 20px; font-family: var(--font-inter, Inter, system-ui, sans-serif);
          animation: cc-in .25s ease;
        }
        @keyframes cc-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .cc-text { margin: 0 0 14px; font-size: 13.5px; line-height: 1.55; color: #37475c; }
        .cc-text a { color: #2f7d32; text-decoration: underline; }
        .cc-actions { display: flex; gap: 10px; justify-content: flex-end; }
        .cc-btn {
          font-size: 13px; font-weight: 600; padding: 9px 18px; border-radius: 8px;
          cursor: pointer; border: 1px solid transparent; font-family: inherit;
          transition: filter .15s, background .15s, border-color .15s;
        }
        .cc-decline { background: #fff; color: #47546a; border-color: rgba(11,23,41,.16); }
        .cc-decline:hover { background: #f5f7f4; }
        .cc-accept { background: #2f7d32; color: #fff; }
        .cc-accept:hover { filter: brightness(1.08); }
        .cc-btn:focus-visible { outline: 2px solid #2f7d32; outline-offset: 2px; }
        @media (prefers-color-scheme: dark) {
          .cc-banner { background: #111b2d; color: #eef2f7; border-color: rgba(255,255,255,.12); }
          .cc-text { color: #a6b3c5; }
          .cc-decline { background: transparent; color: #a6b3c5; border-color: rgba(255,255,255,.18); }
          .cc-decline:hover { background: rgba(255,255,255,.05); }
        }
        @media (max-width: 480px) {
          .cc-banner { left: 12px; right: 12px; bottom: 12px; width: auto; }
        }
      `}</style>
    </div>
  );
}
