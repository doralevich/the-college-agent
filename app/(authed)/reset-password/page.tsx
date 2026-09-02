"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { branding } from "@/config/branding";
import { MIN_PASSWORD } from "@/config/auth";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  // null = still checking for the recovery session.
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [done, setDone] = useState(false);
  // First-run mode (?welcome=1). Post-checkout sends brand-new students here to choose
  // their FIRST password — accounts are created password-less — so the copy must not
  // talk about "resetting" something they never had.
  const [welcome, setWelcome] = useState(false);
  // Set when Supabase refuses the password change because the account has MFA enrolled and
  // this session is only aal1. Holds the TOTP factor to challenge; the form then asks for a
  // code, elevates the session, and retries — see onSubmit.
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");

  useEffect(() => {
    const isWelcome = new URLSearchParams(window.location.search).get("welcome") === "1";
    // The recovery link routes through /auth/callback, which establishes a session
    // before redirecting here. No user means the link was invalid, already used,
    // expired, or opened in a different browser than the one that requested it.
    // In welcome mode the session was already written by post-checkout's verifyOtp.
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        // Both land together, in the callback rather than the effect body: the first
        // non-loading paint already carries the right copy, with no extra render.
        setWelcome(isWelcome);
        setHasSession(!!data.user);
      });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < MIN_PASSWORD) {
      return toast.error(`Password must be at least ${MIN_PASSWORD} characters.`);
    }
    setLoading(true);
    const supabase = createClient();

    // An account with TOTP enrolled cannot change its password from an aal1 session; Supabase
    // answers "AAL2 session is required to update email or password when MFA is enabled."
    //
    // That is correct of it - a password reset link alone must not be enough to take over an
    // account someone deliberately put a second factor on - but the page used to print that
    // sentence as a toast and stop, which is a dead end: the one screen that can set a password
    // refused to, and offered no way through. Every admin hits it, and so does any student who
    // has enrolled a factor.
    //
    // So: ask for the code, elevate the session, and retry the same update.
    if (mfaFactorId) {
      const clean = code.replace(/\D/g, "");
      if (clean.length !== 6) {
        setLoading(false);
        return toast.error("Enter the 6-digit code from your authenticator app.");
      }
      const { error: mfaErr } = await supabase.auth.mfa.challengeAndVerify({
        factorId: mfaFactorId,
        code: clean,
      });
      if (mfaErr) {
        setLoading(false);
        return toast.error(mfaErr.message);
      }
      // Session is aal2 now; fall through to the update below.
    }

    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (!error) return setDone(true);

    // First refusal: find the verified factor and switch the form into code mode rather than
    // showing the raw message. Matched on the AAL2 wording because Supabase does not give this
    // its own error code.
    if (!mfaFactorId && /aal2|mfa/i.test(error.message)) {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totp = factors?.totp?.find((f) => f.status === "verified");
      if (totp) {
        setMfaFactorId(totp.id);
        return toast.info("Enter your authenticator code to confirm this change.");
      }
    }
    toast.error(error.message);
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">{branding.appName}</h1>
          {hasSession && !done && (
            <p className="text-sm text-muted-foreground">
              {welcome
                ? "Set a password so you can sign in anytime."
                : "Choose a new password."}
            </p>
          )}
        </div>

        {hasSession === null ? (
          <p className="text-center text-sm text-muted-foreground">Loading…</p>
        ) : done ? (
          <div className="space-y-4">
            <div className="rounded-lg border bg-card p-6 text-center text-sm">
              <p className="font-medium">{welcome ? "Password set" : "Password updated"}</p>
              <p className="mt-1 text-muted-foreground">
                {welcome
                  ? "You can now sign in with your email and password."
                  : "You're all set."}
              </p>
            </div>
            <Button className="w-full" onClick={() => (window.location.href = "/dashboard")}>
              Continue to dashboard
            </Button>
          </div>
        ) : !hasSession ? (
          <div className="space-y-4">
            <div className="rounded-lg border bg-card p-6 text-center text-sm">
              <p className="font-medium">
                {welcome ? "Your session expired" : "Reset link invalid or expired"}
              </p>
              <p className="mt-1 text-muted-foreground">
                {welcome
                  ? "Sign in to finish setting up your account."
                  : "Request a new password reset link to try again."}
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => (window.location.href = "/login")}
            >
              Back to sign in
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{welcome ? "Password" : "New password"}</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={MIN_PASSWORD}
                required
              />
            </div>
            {/* Only after Supabase has refused an aal1 password change. Rendered inline rather
                than on a separate screen so the password they already typed is preserved -
                sending them elsewhere to authenticate and back would lose it. */}
            {mfaFactorId && (
              <div className="space-y-2">
                <Label htmlFor="mfa-code">Authenticator code</Label>
                <Input
                  id="mfa-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  autoFocus
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This account has two-factor authentication on, so a code is needed to change
                  the password.
                </p>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? welcome
                  ? "Setting..."
                  : "Updating..."
                : mfaFactorId
                  ? "Confirm and set password"
                  : welcome
                    ? "Set password"
                    : "Update password"}
            </Button>
            {/* A stop, not a wall — a student who'd rather get to their agent first can
                still set a password later from "Forgot password?". */}
            {welcome && (
              <button
                type="button"
                onClick={() => (window.location.href = "/dashboard")}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
              >
                Skip for now
              </button>
            )}
          </form>
        )}
      </div>
    </main>
  );
}
