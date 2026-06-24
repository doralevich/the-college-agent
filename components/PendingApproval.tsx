"use client";

import { signOut } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { branding } from "@/config/branding";

// Shown to a signed-in user whose email isn't on the allowlist (no active
// entitlement). They have a valid session but no access yet — and importantly,
// no workspace is created for them. Stripe later replaces "allowlisted" with
// "active subscription" without touching this screen.
export function PendingApproval({ email }: { email: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md space-y-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{branding.appName}</h1>
        <div className="space-y-3 rounded-2xl border bg-card p-8">
          <p className="text-lg font-medium">You&apos;re on the list 🎉</p>
          <p className="text-sm text-muted-foreground">
            Thanks for signing in{email ? ` as ${email}` : ""}. Your account is pending
            approval. We&apos;ll email you the moment your agent access is switched on.
          </p>
        </div>
        <Button variant="outline" onClick={signOut}>
          Sign out
        </Button>
      </div>
    </main>
  );
}
