"use client";

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { usd } from "@/lib/format";

// Operator-only earnings strip at the top of /admin: how much the hidden credit markup has
// made this month. Reads /api/admin/markup, which sums this month's managed spend (the
// Agent37 bill) across every instance and takes our cut. Students never see any of this;
// their balances render at face value.

type Markup = {
  period: string;
  rate: number;
  agents: number;
  usage_micros: number;
  markup_micros: number;
};

// "2026-07" -> "July 2026" (UTC-parsed so the label can't slip a month).
function periodLabel(period: string): string {
  const [y, m] = period.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function MarkupEarnings() {
  const [data, setData] = useState<Markup | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiFetch<Markup>("/api/admin/markup")
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) return null; // supplementary — never block the workspaces god-view

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" />
            Markup earned · {data ? periodLabel(data.period) : "this month"}
          </div>
          <div className="mt-1.5 text-3xl font-semibold tabular-nums">
            {data ? usd(data.markup_micros) : "—"}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {data ? (
              <>
                {(data.rate * 100).toFixed(0)}% of {usd(data.usage_micros)} of AI usage across {data.agents}{" "}
                agent{data.agents === 1 ? "" : "s"}. Grows as students spend; students see face-value credits.
              </>
            ) : (
              "Loading…"
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
