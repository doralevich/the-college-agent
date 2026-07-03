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
  alerts: { threshold_cents: number } | null;
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
        <>
          <ByoCard provider={data.byo.provider} />
          <ByoSwitchCard mode="to-platform" />
        </>
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

            {!data.credits && (
              <div className="flex items-center justify-between gap-3 border-b p-4">
                <p className="text-sm text-muted-foreground">
                  We couldn&apos;t reach your agent&apos;s balance just now. It usually comes right
                  back.
                </p>
                <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                  Retry
                </Button>
              </div>
            )}

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

          <UsageHistoryCard />

          {data.alerts && <AlertsCard initial={data.alerts} />}

          {data.autoRecharge && <AutoRechargeCard initial={data.autoRecharge} />}

          <ByoSwitchCard mode="to-byo" />

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

type UsageMonth = { period: string; total_micros: number };

// "2026-07" -> "Jul". UTC-parsed so the label can't slip a month in western timezones.
function monthLabel(period: string): string {
  const [y, m] = period.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", {
    month: "short",
    timeZone: "UTC",
  });
}

// Six months of metered usage as a small bar chart. One series in the brand green
// (validated against both the light and dark surfaces); hovering a month reveals its
// dollar value; the baseline is the only axis chrome at this size.
function UsageHistoryCard() {
  const [months, setMonths] = useState<UsageMonth[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<{ months: UsageMonth[] }>("/api/billing/usage-history")
      .then((d) => {
        if (!cancelled) setMonths(d.months);
      })
      .catch(() => {}); // supplementary card — the balance figures above still stand alone
    return () => {
      cancelled = true;
    };
  }, []);

  if (!months || months.length === 0) return null;

  const max = Math.max(...months.map((m) => m.total_micros));
  const allZero = max === 0;

  return (
    <div className="rounded-2xl border p-6">
      <h3 className="text-base font-medium">Monthly usage</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        What your agent spent each month, over the last six months.
      </p>
      {allZero ? (
        <p className="mt-4 text-sm text-muted-foreground">
          No usage yet. Once you start chatting, months show up here.
        </p>
      ) : (
        <div role="img" aria-label="Bar chart of monthly AI usage for the last six months" className="mt-5">
          <div className="flex h-28 items-end gap-2 border-b">
            {months.map((m) => {
              const pct = max > 0 ? (m.total_micros / max) * 100 : 0;
              return (
                <div key={m.period} className="group relative flex h-full flex-1 items-end justify-center">
                  <span className="pointer-events-none absolute -top-1 hidden -translate-y-full rounded-md bg-foreground px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-background group-hover:block">
                    {usd(m.total_micros)}
                  </span>
                  <div
                    aria-label={`${monthLabel(m.period)}: ${usd(m.total_micros)}`}
                    className="w-full max-w-9 rounded-t-[4px] bg-primary transition-opacity group-hover:opacity-80"
                    style={{ height: `${Math.max(pct, m.total_micros > 0 ? 3 : 1.5)}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-1.5 flex gap-2">
            {months.map((m) => (
              <div key={m.period} className="flex-1 text-center text-[10px] font-medium text-muted-foreground">
                {monthLabel(m.period)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const ALERT_PRESETS_CENTS = [300, 500, 1000];

// "Warn me when my balance drops below" — one email + Telegram nudge when the balance
// crosses this line (the almost-empty warning at $1 always stays on).
function AlertsCard({ initial }: { initial: { threshold_cents: number } }) {
  const [threshold, setThreshold] = useState(initial.threshold_cents);
  const [saving, setSaving] = useState(false);

  async function save(cents: number) {
    setSaving(true);
    try {
      await apiFetch("/api/billing/alerts", {
        method: "POST",
        body: JSON.stringify({ threshold_cents: cents }),
      });
      setThreshold(cents);
      toast.success(`We'll warn you below ${formatUSD(cents)}.`);
    } catch (e) {
      toast.error((e as Error).message || "Couldn't update the alert.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border p-6">
      <h3 className="text-base font-medium">Low balance warning</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        We send you an email (and a Telegram nudge, if connected) when your balance drops
        below this line.
      </p>
      <div className="mt-3">
        <PresetPicker
          label="Warn me below"
          value={threshold}
          options={ALERT_PRESETS_CENTS}
          disabled={saving}
          onChange={save}
        />
      </div>
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

// Advanced: move the agent between platform credits and the student's own API key.
// The switch reconfigures the live box (takes up to a minute), then reloads the page so
// every card reflects the new mode. Deliberately quiet — most students never need this.
function ByoSwitchCard({ mode }: { mode: "to-byo" | "to-platform" }) {
  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState<"anthropic" | "openai">("anthropic");
  const [key, setKey] = useState("");
  const [switching, setSwitching] = useState(false);

  async function doSwitch() {
    setSwitching(true);
    try {
      await apiFetch("/api/billing/byo", {
        method: "POST",
        body: JSON.stringify(mode === "to-platform" ? { provider: "platform" } : { provider, key: key.trim() }),
      });
      toast.success(
        mode === "to-platform"
          ? "Switched back to platform credits."
          : "Switched to your own API key."
      );
      window.location.reload();
    } catch (e) {
      toast.error((e as Error).message || "Couldn't switch. Your agent is unchanged.");
      setSwitching(false);
    }
  }

  if (mode === "to-platform") {
    return (
      <div className="rounded-2xl border p-6">
        <h3 className="text-base font-medium">Switch back to platform credits</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Your agent goes back to running on credits from us: usage tracking, low-balance
          alerts, and top-ups all come back on. Your API key is removed from the agent.
        </p>
        <Button variant="outline" className="mt-4" disabled={switching} onClick={doSwitch}>
          {switching && <Loader2 className="h-4 w-4 animate-spin" />}
          {switching ? "Reconfiguring your agent…" : "Switch to platform credits"}
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border p-6">
      <h3 className="text-base font-medium">Advanced: use your own API key</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Have your own Anthropic or OpenAI account? Your agent can run on it instead of
        credits. You handle that bill and its limits yourself; credits stay here for
        whenever you switch back.
      </p>
      {!open ? (
        <Button variant="outline" className="mt-4" onClick={() => setOpen(true)}>
          Set up
        </Button>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="inline-flex gap-1 rounded-full bg-secondary p-1">
            {(["anthropic", "openai"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setProvider(p)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  provider === p
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {p === "anthropic" ? "Anthropic" : "OpenAI"}
              </button>
            ))}
          </div>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder={provider === "anthropic" ? "sk-ant-..." : "sk-..."}
            autoComplete="off"
            className="w-full rounded-lg border bg-background px-3 py-2 text-base md:text-sm"
          />
          <div className="flex items-center gap-2">
            <Button disabled={switching || key.trim().length < 20} onClick={doSwitch}>
              {switching && <Loader2 className="h-4 w-4 animate-spin" />}
              {switching ? "Reconfiguring your agent…" : "Switch to my key"}
            </Button>
            {!switching && (
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Takes up to a minute. Your key is stored securely and only ever lives on your
            agent&apos;s own machine.
          </p>
        </div>
      )}
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
