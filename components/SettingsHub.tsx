"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { AgentsView } from "@/components/AgentsView";
import { BillingView } from "@/components/BillingView";
import { SettingsView } from "@/components/SettingsView";

// Settings now hosts the surfaces that used to be their own sidebar tabs: the
// workspace settings (General), Your Agent, and Billing. The sidebar links only
// to Settings; deep links to /dashboard/billing and /dashboard/agent still work
// because DashboardClient maps those routes to the matching initialSection here.

export type SettingsSection = "general" | "agent" | "billing";

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
    { id: "billing", label: "Billing", show: paid },
  ];
  const visible = sections.filter((s) => s.show);
  // If the requested section isn't available (e.g. billing before paying), fall back.
  const active = visible.some((s) => s.id === section) ? section : "general";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Your workspace, your agent, and your billing in one place.
        </p>
      </div>

      {visible.length > 1 && (
        <div className="flex gap-1 border-b">
          {visible.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSection(s.id)}
              className={cn(
                "-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                active === s.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {active === "agent" && hasAgent ? (
        <AgentsView firstName={firstName} onOpenChat={onOpenChat} />
      ) : active === "billing" && paid ? (
        <BillingView />
      ) : (
        <SettingsView />
      )}
    </div>
  );
}
