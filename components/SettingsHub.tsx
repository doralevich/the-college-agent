"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { AgentsView } from "@/components/AgentsView";
import { BillingView } from "@/components/BillingView";
import { SettingsView } from "@/components/SettingsView";
import { ChecklistView } from "@/components/ChecklistView";

// Settings hosts the workspace settings (General), Your Agent, and Subscription
// (plan + hosting + invoices). Usage Credits graduated to its own sidebar tab
// (/dashboard/credits); deep links to /dashboard/billing and /dashboard/agent still
// work because DashboardClient maps those routes to the matching initialSection here.

export type SettingsSection = "general" | "agent" | "subscription" | "intake";

export function SettingsHub({
  initialSection = "general",
  hasAgent,
  paid,
  firstName,
  onOpenChat,
  userId,
  intake,
}: {
  initialSection?: SettingsSection;
  hasAgent: boolean;
  paid: boolean;
  firstName: string | null;
  onOpenChat: () => void;
  // Needed by the intake section, which moved here off the Checklist page.
  userId: string;
  intake: Record<string, unknown> | null;
}) {
  const [section, setSection] = useState<SettingsSection>(initialSection);

  const sections: { id: SettingsSection; label: string; show: boolean }[] = [
    { id: "general", label: "General", show: true },
    { id: "agent", label: "Your Agent", show: hasAgent },
    { id: "subscription", label: "Subscription", show: paid },
    // The intake answers used to be the body of the Checklist page. They are reference
    // material - what the student told us at signup - not something they act on day to day,
    // so they read better here than beside the setup they actually have to complete.
    { id: "intake", label: "Your intake", show: hasAgent },
  ];
  const visible = sections.filter((s) => s.show);
  // If the requested section isn't available (e.g. billing before paying), fall back.
  const active = visible.some((s) => s.id === section) ? section : "general";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Your workspace, your agent, and your subscription.
        </p>
      </div>

      {visible.length > 1 && (
        // Long labels don't fit one pill row on a phone (they used to wrap mid-pill) —
        // mobile gets a tidy grid, sm+ keeps the iOS-style segmented row.
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-secondary p-1 sm:inline-flex sm:rounded-full">
          {visible.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSection(s.id)}
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-2 text-center text-sm font-medium transition-colors sm:px-4 sm:py-1.5",
                active === s.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {active === "agent" && hasAgent ? (
        <AgentsView firstName={firstName} onOpenChat={onOpenChat} />
      ) : active === "subscription" && paid ? (
        <BillingView />
      ) : active === "intake" && hasAgent ? (
        <ChecklistView userId={userId} firstName={firstName} intake={intake} />
      ) : (
        <SettingsView />
      )}
    </div>
  );
}
