"use client";

import Image from "next/image";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

// Standalone chrome for the admin god-view — deliberately NOT the workspace-scoped
// DashboardShell (no workspace switcher / per-workspace nav). Just a top bar identifying
// the admin area and the signed-in operator, with the full-width content below.
export function AdminShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b bg-card px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <Image
            src="/logo-college-agent.svg"
            alt="The College Agent"
            width={366}
            height={80}
            priority
            className="h-16 w-auto md:h-[4.5rem]"
          />
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
            Admin
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden truncate text-xs text-muted-foreground sm:inline">{email}</span>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </header>

      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-7xl p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
