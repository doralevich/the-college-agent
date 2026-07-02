"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { usd } from "@/lib/format";
import { formatUSD } from "@/lib/pricing";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Settings -> Usage Credits. Credits pay for the agent's AI usage (model calls, search,
// tools): live balance and month spend from the agent's budget, preset top-up buttons
// (hosted Stripe Checkout), and the credit ledger. Students on their own API key see a
// pointer to their provider console instead — we neither bill nor meter that usage.

type CreditsData = {
  byo: { provider: "anthropic" | "openai" } | null;
  credits: {
    remaining_micros: number;
    spent_micros: number;
    llm_micros: number;
    search_micros: number;
    tools_micros: number;
  } | null;
  transactions: { id: string; amount_cents: number; type: string; status: string; created_at: string }[];
  autoRecharge: { enabled: boolean; threshold_cents: number; amount_cents: number } | null;
};

const TOPUP_PRESETS_CENTS = [1000, 2500, 5000];

const TX_LABELS: Record<string, string> = {
  starter: "Starter credits, included with your plan",
  topup: "Credits top-up",
  auto_recharge: "Auto recharge",
  refund: "Refund",
};

export function CreditsView() {
  const [data, setData] = useState<CreditsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<CreditsData>("/api/billing/credits")
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) toast.error((e as Error).message || "Couldn't load your credits.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // Returning from a successful top-up checkout: confirm, then tidy the URL so a
    // refresh doesn't re-toast.
    const params = new URLSearchParams(window.location.search);
    if (params.get("topup") === "success") {
      toast.success("Payment received. Credits are added to your agent within a minute.");
      params.delete("topup");
      const qs = params.toString();
      window.history.replaceState(null, "", window.location.pathname + (qs ? `?${qs}` : ""));
    }

    return () => {
      cancelled = true;
    };
  }, []);

  async function buy(amountCents: number) {
    setBuying(amountCents);
    try {
      const { url } = await apiFetch<{ url: string }>("/api/billing/topup", {
        method: "POST",
        body: JSON.stringify({ amount_cents: amountCents }),
      });
      window.location.assign(url); // hosted Stripe Checkout; returns to /dashboard/credits
    } catch (e) {
      toast.error((e as Error).message || "Couldn't start the top-up.");
      setBuying(null);
    }
  }

  return (
    <div className="max-w-xl space-y-8">
      <div>
        <h2 className="text-lg font-medium">Usage Credits</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Credits pay for what your agent does: model calls, search, and tools. Your plan
          included $20 to start.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading credits…
        </div>
      ) : !data ? null : data.byo ? (
        <ByoCard provider={data.byo.provider} />
      ) : (
        <>
          <div className="rounded-2xl border">
            <div className="grid grid-cols-2 divide-x border-b">
              <div className="p-6">
                <div className="text-xs text-muted-foreground">Balance</div>
                <div className="mt-1 text-2xl font-semibold tabular-nums">
                  {data.credits ? usd(data.credits.remaining_micros) : "—"}
                </div>
              </div>
              <div className="p-6">
                <div className="text-xs text-muted-foreground">Spent this month</div>
                <div className="mt-1 text-2xl font-semibold tabular-nums">
                  {data.credits ? usd(data.credits.spent_micros) : "—"}
                </div>
                {data.credits && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    AI {usd(data.credits.llm_micros)} · Search {usd(data.credits.search_micros)} · Tools{" "}
                    {usd(data.credits.tools_micros)}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6">
              <div className="text-sm font-medium">Add credits</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {TOPUP_PRESETS_CENTS.map((cents) => (
                  <Button key={cents} variant="outline" disabled={buying !== null} onClick={() => buy(cents)}>
                    {buying === cents && <Loader2 className="h-4 w-4 animate-spin" />}
                    {formatUSD(cents)}
                  </Button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Secure checkout by Stripe. Credits are added to your agent within a minute.
              </p>
            </div>
          </div>

          {data.autoRecharge && <AutoRechargeCard initial={data.autoRecharge} />}

          {data.transactions.length > 0 && (
            <div className="rounded-2xl border p-6">
              <div className="text-sm font-medium">History</div>
              <ul className="mt-3 space-y-2">
                {data.transactions.map((tx) => (
                  <li key={tx.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate text-muted-foreground">
                      {new Date(tx.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      {" · "}
                      {TX_LABELS[tx.type] ?? tx.type}
                    </span>
                    <span className="flex shrink-0 items-center gap-2 tabular-nums">
                      {tx.status === "pending" && (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-medium",
                            "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                          )}
                        >
                          Processing
                        </span>
                      )}
                      {tx.status === "failed" && (
                        <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                          Failed
                        </span>
                      )}
                      {tx.type === "refund" ? "-" : "+"}
                      {formatUSD(Math.abs(tx.amount_cents))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const THRESHOLD_PRESETS_CENTS = [500, 1000, 1500];
const AMOUNT_PRESETS_CENTS = [1000, 2500, 5000];

// Set-and-forget refills: when the balance drops below the threshold, the hourly sweep
// charges the card saved with the subscription and adds the chosen amount.
function AutoRechargeCard({
  initial,
}: {
  initial: { enabled: boolean; threshold_cents: number; amount_cents: number };
}) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const [threshold, setThreshold] = useState(initial.threshold_cents);
  const [amount, setAmount] = useState(initial.amount_cents);
  const [saving, setSaving] = useState(false);

  async function save(next: { enabled: boolean; threshold_cents: number; amount_cents: number }) {
    setSaving(true);
    try {
      await apiFetch("/api/billing/auto-recharge", {
        method: "POST",
        body: JSON.stringify(next),
      });
      setEnabled(next.enabled);
      setThreshold(next.threshold_cents);
      setAmount(next.amount_cents);
      toast.success(next.enabled ? "Auto-recharge is on." : "Auto-recharge is off.");
    } catch (e) {
      toast.error((e as Error).message || "Couldn't update auto-recharge.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-medium">Auto-recharge</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {enabled
              ? `On. When your balance drops below ${formatUSD(threshold)}, we add ${formatUSD(amount)} automatically.`
              : "Never run dry: we top you up automatically when your balance gets low."}
          </p>
        </div>
        <Button
          variant={enabled ? "outline" : "default"}
          size="sm"
          disabled={saving}
          onClick={() => save({ enabled: !enabled, threshold_cents: threshold, amount_cents: amount })}
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {enabled ? "Turn off" : "Turn on"}
        </Button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <PresetPicker
          label="When balance drops below"
          value={threshold}
          options={THRESHOLD_PRESETS_CENTS}
          disabled={saving}
          onChange={(v) => {
            if (enabled) save({ enabled, threshold_cents: v, amount_cents: amount });
            else setThreshold(v);
          }}
        />
        <PresetPicker
          label="Add"
          value={amount}
          options={AMOUNT_PRESETS_CENTS}
          disabled={saving}
          onChange={(v) => {
            if (enabled) save({ enabled, threshold_cents: threshold, amount_cents: v });
            else setAmount(v);
          }}
        />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Charges the card saved with your subscription. Turns itself off after three failed
        charges.
      </p>
    </div>
  );
}

function PresetPicker({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  options: number[];
  disabled: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-1.5 inline-flex gap-1 rounded-full bg-secondary p-1">
        {options.map((cents) => (
          <button
            key={cents}
            type="button"
            disabled={disabled}
            onClick={() => onChange(cents)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              value === cents
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {formatUSD(cents)}
          </button>
        ))}
      </div>
    </div>
  );
}

function ByoCard({ provider }: { provider: "anthropic" | "openai" }) {
  const anthropic = provider === "anthropic";
  const providerName = anthropic ? "Anthropic" : "OpenAI";
  const consoleUrl = anthropic
    ? "https://console.anthropic.com/settings/billing"
    : "https://platform.openai.com/usage";
  return (
    <div className="rounded-2xl border p-6">
      <h3 className="text-base font-medium">AI usage</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Your agent runs on your own {providerName} API key, so we don&apos;t bill or track your
        AI usage. Manage spending and limits in your {providerName} console.
      </p>
      <Button asChild variant="outline" className="mt-4">
        <a href={consoleUrl} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="h-4 w-4" />
          Open {providerName} console
        </a>
      </Button>
    </div>
  );
}
