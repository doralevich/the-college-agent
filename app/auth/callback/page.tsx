"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Client landing for Supabase magic-link URLs. Supabase's default magic-link
// flow is implicit: the access + refresh tokens come back in the URL hash
// (#access_token=...&refresh_token=...&type=magiclink), which the server can't
// read. This page reads the hash on mount, calls supabase.auth.setSession to
// write the cookies via the browser client, and then router.push()es onto
// /dashboard (or whatever `next` param the link carried).
//
// Server-set cookies from the /api/auth/post-checkout route remain the
// preferred path; this is for paths that can't go through that route, namely
// the magic-link email students get after their account is auto-created.

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"working" | "error">("working");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash;
      const search = new URLSearchParams(window.location.search);
      const next = search.get("next") || "/dashboard";

      // Implicit flow puts tokens in the hash; PKCE puts a code in the query.
      // Handle both shapes so this callback works no matter what flow type the
      // Supabase project ends up configured for.
      const hashParams = new URLSearchParams(hash);
      const access_token = hashParams.get("access_token");
      const refresh_token = hashParams.get("refresh_token");
      const code = search.get("code");

      const supabase = createClient();
      try {
        if (code) {
          const { error: exchErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exchErr) throw exchErr;
        } else if (access_token && refresh_token) {
          const { error: setErr } = await supabase.auth.setSession({ access_token, refresh_token });
          if (setErr) throw setErr;
        } else {
          // No tokens, no code: nothing to do. Bounce to /login so the student
          // can request a fresh link.
          router.replace("/login");
          return;
        }
        // Strip the hash/query before navigating so a back-button never replays
        // the (now-consumed) tokens.
        window.history.replaceState(null, "", window.location.pathname);
        router.replace(next);
      } catch (e) {
        setError((e as Error).message);
        setStatus("error");
      }
    })();
  }, [router]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F6F8F3",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        color: "#1A2421",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 380, padding: "32px 24px" }}>
        {status === "working" ? (
          <>
            <div
              style={{
                width: 32,
                height: 32,
                margin: "0 auto 16px",
                border: "3px solid #DEE6DA",
                borderTopColor: "#2D7A3A",
                borderRadius: "50%",
                animation: "ca-spin .8s linear infinite",
              }}
            />
            <p style={{ fontSize: 15, color: "#5C6660", margin: 0 }}>Signing you in...</p>
          </>
        ) : (
          <>
            <p style={{ fontSize: 15, color: "#B23636", margin: "0 0 12px", fontWeight: 600 }}>
              Couldn&apos;t sign you in
            </p>
            <p style={{ fontSize: 13, color: "#5C6660", margin: "0 0 16px" }}>
              {error ?? "The sign-in link expired or was already used."}
            </p>
            <a
              href="/login"
              style={{
                color: "#2D7A3A",
                fontWeight: 600,
                textDecoration: "none",
                fontSize: 14,
              }}
            >
              Go to sign in →
            </a>
          </>
        )}
      </div>
      <style>{`@keyframes ca-spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  );
}
