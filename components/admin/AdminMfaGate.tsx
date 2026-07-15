"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Loader2 } from "lucide-react";
import { createClient, signOut } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// The step-up screen the admin god-view renders until the operator's session reaches
// `aal2`. A first-time admin (no verified factor) is walked through TOTP enrollment —
// scan the QR / copy the secret, then confirm a code. A returning admin (already enrolled,
// but this session is only `aal1`) sees just the code challenge. On success the session is
// promoted to `aal2` and written to cookies; we refresh the server layout, which then
// renders the actual tools. Enroll/challenge/verify talk straight to Supabase Auth — not
// through our admin API routes — so this never trips the aal2 gate on those routes.
export function AdminMfaGate({ needsEnrollment }: { needsEnrollment: boolean }) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [ready, setReady] = useState(false);
  const [enrolling, setEnrolling] = useState(needsEnrollment);
  const [factorId, setFactorId] = useState("");
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Prepare the flow: a returning admin uses their existing verified factor; a new admin
  // gets a fresh TOTP factor. We clear any half-finished (unverified) factors first so
  // enroll() can't collide with an abandoned attempt. State is only touched after the
  // first await, so this is safe to kick off from an effect on mount.
  const prepare = useCallback(async () => {
    try {
      const { data: factors, error: listErr } = await supabase.auth.mfa.listFactors();
      if (listErr) throw listErr;

      const verified = factors.totp.find((f) => f.status === "verified");
      if (verified) {
        setEnrolling(false);
        setFactorId(verified.id);
        setReady(true);
        return;
      }

      const stale = (factors.all ?? []).filter(
        (f) => f.factor_type === "totp" && f.status !== "verified"
      );
      for (const f of stale) await supabase.auth.mfa.unenroll({ factorId: f.id });

      const { data, error: enrollErr } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "The College Agent (admin)",
      });
      if (enrollErr) throw enrollErr;
      setEnrolling(true);
      setFactorId(data.id);
      setQr(data.totp.qr_code);
      setSecret(data.totp.secret);
      setReady(true);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not start two-factor setup. Try again, or sign out and back in."
      );
      setReady(true);
    }
  }, [supabase]);

  useEffect(() => {
    // Async IIFE keeps the setState inside prepare() off the synchronous effect path.
    void (async () => {
      await prepare();
    })();
  }, [prepare]);

  // "Start over": reset the visible state (event handler, not an effect) then re-run.
  function restart() {
    setError("");
    setReady(false);
    setCode("");
    setQr("");
    void prepare();
  }

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    const clean = code.replace(/\D/g, "");
    if (clean.length !== 6 || !factorId || busy) return;
    setBusy(true);
    setError("");
    try {
      const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({ factorId });
      if (chErr) throw chErr;
      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: clean,
      });
      if (vErr) throw vErr;
      toast.success("Two-factor verified.");
      // Session is now aal2 in cookies — re-run the server layout so the tools render.
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That code didn't work. Try again.");
      setCode("");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-12">
      <div className="w-full space-y-6 rounded-lg border bg-card p-6 shadow-sm">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div className="space-y-1">
            <h1 className="text-lg font-semibold">
              {enrolling ? "Set up two-factor authentication" : "Two-factor authentication"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {enrolling
                ? "Admin access requires a second factor. Scan the code with an authenticator app (1Password, Authy, Google Authenticator), then enter the 6-digit code it shows."
                : "Enter the current 6-digit code from your authenticator app to continue."}
            </p>
          </div>
        </div>

        {!ready ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <>
            {enrolling && qr && (
              <div className="flex flex-col items-center gap-3">
                <div className="rounded-lg border bg-white p-3">
                  {/* Supabase returns the QR as an inline SVG data URL. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qr} alt="Two-factor QR code" className="h-44 w-44" />
                </div>
                <div className="w-full space-y-1 text-center">
                  <p className="text-xs text-muted-foreground">Can&apos;t scan? Enter this key manually:</p>
                  <code className="block break-all rounded-md bg-muted px-3 py-2 text-xs font-medium">
                    {secret}
                  </code>
                </div>
              </div>
            )}

            <form onSubmit={onVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mfa-code">6-digit code</Label>
                <Input
                  id="mfa-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  placeholder="123456"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="text-center text-lg tracking-[0.3em]"
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" disabled={busy || code.length !== 6}>
                {busy ? "Verifying..." : enrolling ? "Verify & enable" : "Verify"}
              </Button>
            </form>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <button
                type="button"
                onClick={restart}
                className="hover:text-foreground"
                disabled={busy}
              >
                Start over
              </button>
              <button type="button" onClick={signOut} className="hover:text-foreground">
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
