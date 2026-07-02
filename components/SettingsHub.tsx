"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { AgentsView } from "@/components/AgentsView";
import { BillingView } from "@/components/BillingView";
import { CreditsView } from "@/components/CreditsView";
import { SettingsView } from "@/components/SettingsView";

// Settings hosts the surfaces that used to be their own sidebar tabs: the workspace
// settings (General), Your Agent, Subscription (plan + hosting + invoices), and Usage
// Credits (AI credits + top-ups). The sidebar links only to Settings; deep links to
// /dashboard/billing, /dashboard/credits, and /dashboard/agent still work because
// DashboardClient maps those routes to the matching initialSection here.

export type SettingsSection = "general" | "agent" | "subscription" | "credits";

export function SettingsHub({
  initialSection = "general",
  hasAgent,
  paid,
  firstName,
  onOpenChat,
}: {
  initialSection?: SettingsSection;
  hasAgent: boolean;
  paid: boolean;
  firstName: string | null;
  onOpenChat: () => void;
}) {
  const [section, setSection] = useState<SettingsSection>(initialSection);

  const sections: { id: SettingsSection; label: string; show: boolean }[] = [
    { id: "general", label: "General", show: true },
    { id: "agent", label: "Your Agent", show: hasAgent },
    { id: "subscription", label: "Subscription", show: paid },
    { id: "credits", label: "Usage Credits", show: hasAgent },
  ];
  const visible = sections.filter((s) => s.show);
  // If the requested section isn't available (e.g. billing before paying), fall back.
  const active = visible.some((s) => s.id === section) ? section : "general";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Your workspace, your agent, your subscription, and your credits.
        </p>
      </div>

      {visible.length > 1 && (
        // Four labels don't fit one pill row on a phone (they used to wrap mid-pill) —
        // mobile gets a tidy 2x2 grid, sm+ keeps the iOS-style segmented row.
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
      ) : active === "credits" && hasAgent ? (
        <CreditsView />
      ) : (
        <SettingsView />
      )}
    </div>
  );
}
