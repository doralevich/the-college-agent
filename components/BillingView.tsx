"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ExternalLink, FolderOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { usd } from "@/lib/format";
import {
  PLANS,
  HOSTING,
  SUPPORT,
  ONBOARDING,
  formatUSD,
  type PlanKey,
  type HostingKey,
  type SupportKey,
  type OnboardingKey,
} from "@/lib/pricing";
import { HOSTING_SHAPES } from "@/config/agents";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Summary = {
  // Legacy configurator purchase — full order breakdown.
  order: {
    plan: PlanKey;
    hosting: HostingKey;
    support: SupportKey;
    onboarding: OnboardingKey;
    status: string;
    hosting_amount: number | null;
  } | null;
  // Current /build purchase — one-time setup + monthly hosting on the entitlement.
  subscription: { status: string; hostingAmount: number } | null;
  canManage: boolean;
};

// Friendly label + pill color per status. Orders use paid/past_due/canceled; entitlements
// use active/past_due/canceled — same meanings, both mapped here.
const STATUS: Record<string, { label: string; className: string }> = {
  paid: { label: "Active", className: "bg-primary/10 text-primary" },
  active: { label: "Active", className: "bg-primary/10 text-primary" },
  past_due: { label: "Past due", className: "bg-amber-100 text-amber-700" },
  canceled: { label: "Canceled", className: "bg-muted text-muted-foreground" },
};

function statusPill(status: string) {
  return STATUS[status] ?? { label: status, className: "bg-muted text-muted-foreground" };
}

export function BillingView({ hasAgent = false }: { hasAgent?: boolean }) {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiFetch<Summary>("/api/billing/summary")
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) toast.error((e as Error).message || "Couldn't load billing details.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function openPortal() {
    setOpening(true);
    // Open the tab synchronously inside the click so the browser doesn't treat the later
    // (post-await) navigation as a popup and block it. We then point it at the portal URL.
    const tab = window.open("", "_blank");
    try {
      const { url } = await apiFetch<{ url: string }>("/api/billing/portal", {
        method: "POST",
        body: JSON.stringify({}),
      });
      if (tab) tab.location.href = url; // Stripe-hosted portal in a new tab
      else window.location.href = url; // popup blocked → fall back to same tab
    } catch (e) {
      tab?.close();
      toast.error((e as Error).message || "Couldn't open the billing portal.");
    } finally {
      setOpening(false);
    }
  }

  return (
    <div className="max-w-xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground">Your plan, hosting, and payment details.</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : data?.order ? (
        <Plan order={data.order} canManage={data.canManage} opening={opening} onManage={openPortal} />
      ) : data?.subscription ? (
        <HostingPlan sub={data.subscription} canManage={data.canManage} opening={opening} onManage={openPortal} />
      ) : (
        <div className="rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">
            Your subscription is managed by our team. Reach out if you need to make a change.
          </p>
        </div>
      )}

      {!loading && hasAgent && <CreditsCard />}

      {!loading && hasAgent && <FilesCard />}
    </div>
  );
}

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
};

const TOPUP_PRESETS_CENTS = [1000, 2500, 5000];

const TX_LABELS: Record<string, string> = {
  starter: "Starter credits, included with your plan",
  topup: "Credits top-up",
  auto_recharge: "Auto recharge",
  refund: "Refund",
};

// The AI-credits card: live balance and month spend from the agent's budget, preset top-up
// buttons (hosted Stripe Checkout), and the credit ledger. Students on their own API key
// see a pointer to their provider console instead — we neither bill nor meter that usage.
function CreditsCard() {
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
      window.location.assign(url); // hosted Stripe Checkout; returns to /dashboard/billing
    } catch (e) {
      toast.error((e as Error).message || "Couldn't start the top-up.");
      setBuying(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading credits…
      </div>
    );
  }
  if (!data) return null;

  if (data.byo) {
    const anthropic = data.byo.provider === "anthropic";
    const providerName = anthropic ? "Anthropic" : "OpenAI";
    const consoleUrl = anthropic
      ? "https://console.anthropic.com/settings/billing"
      : "https://platform.openai.com/usage";
    return (
      <div className="rounded-xl border p-6">
        <h2 className="text-base font-medium">AI usage</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your agent runs on your own {providerName} API key, so we don&apos;t bill or track
          your AI usage. Manage spending and limits in your {providerName} console.
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

  const { credits, transactions } = data;

  return (
    <div className="rounded-xl border">
      <div className="border-b p-6">
        <h2 className="text-base font-medium">AI credits</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Credits pay for what your agent does: model calls, search, and tools. Your plan
          included $20 to start.
        </p>
      </div>

      <div className="grid grid-cols-2 divide-x border-b">
        <div className="p-6">
          <div className="text-xs text-muted-foreground">Balance</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">
            {credits ? usd(credits.remaining_micros) : "—"}
          </div>
        </div>
        <div className="p-6">
          <div className="text-xs text-muted-foreground">Spent this month</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">
            {credits ? usd(credits.spent_micros) : "—"}
          </div>
          {credits && (
            <div className="mt-1 text-xs text-muted-foreground">
              AI {usd(credits.llm_micros)} · Search {usd(credits.search_micros)} · Tools {usd(credits.tools_micros)}
            </div>
          )}
        </div>
      </div>

      <div className={cn("p-6", transactions.length > 0 && "border-b")}>
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

      {transactions.length > 0 && (
        <div className="p-6">
          <div className="text-sm font-medium">History</div>
          <ul className="mt-3 space-y-2">
            {transactions.map((tx) => (
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
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
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
    </div>
  );
}

// The current /build purchase: a one-time setup fee (already paid) plus monthly hosting.
// Cancel-hosting, card updates, and invoices all live in the Stripe billing portal.
function HostingPlan({
  sub,
  canManage,
  opening,
  onManage,
}: {
  sub: NonNullable<Summary["subscription"]>;
  canManage: boolean;
  opening: boolean;
  onManage: () => void;
}) {
  const status = statusPill(sub.status);

  return (
    <div className="rounded-xl border">
      <div className="flex items-start justify-between gap-3 border-b p-6">
        <div className="text-lg font-medium">The College Agent</div>
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
            status.className
          )}
        >
          {status.label}
        </span>
      </div>

      <dl className="divide-y">
        <Row label="Setup">
          <div className="font-medium">One-time setup</div>
          <div className="mt-0.5 text-xs text-muted-foreground">Paid once at checkout</div>
        </Row>
        <Row label="Hosting">
          <div className="font-medium">
            Cloud hosting
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {formatUSD(sub.hostingAmount)}/mo
            </span>
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            Keeps your agent running around the clock
          </div>
        </Row>
      </dl>

      {canManage && (
        <div className="border-t p-6">
          <Button onClick={onManage} disabled={opening}>
            {opening ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
            Manage subscription
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            Update your card, view invoices, or cancel hosting in the Stripe billing portal.
          </p>
        </div>
      )}
    </div>
  );
}

// Everything the agent keeps on disk is downloadable — surfaced here so a student who is
// about to cancel (or just wants their stuff) can grab it without asking us.
function FilesCard() {
  return (
    <div className="rounded-xl border p-6">
      <h2 className="text-base font-medium">Your files</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Everything your agent has saved for you: notes, plans, and documents. Browse and download
        them anytime, including before you cancel hosting.
      </p>
      <Button asChild variant="outline" className="mt-4">
        <Link href="/dashboard/files">
          <FolderOpen className="h-4 w-4" />
          Open your files
        </Link>
      </Button>
    </div>
  );
}

function Plan({
  order,
  canManage,
  opening,
  onManage,
}: {
  order: NonNullable<Summary["order"]>;
  canManage: boolean;
  opening: boolean;
  onManage: () => void;
}) {
  const shape = HOSTING_SHAPES[order.hosting];
  const status = statusPill(order.status);
  const monthly = order.hosting_amount ?? HOSTING[order.hosting].amount;

  return (
    <div className="rounded-xl border">
      <div className="flex items-start justify-between gap-3 border-b p-6">
        <div>
          <div className="text-lg font-medium">{PLANS[order.plan].label}</div>
        </div>
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
            status.className
          )}
        >
          {status.label}
        </span>
      </div>

      <dl className="divide-y">
        <Row label="Hosting">
          <div className="font-medium">
            {HOSTING[order.hosting].label}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {formatUSD(monthly)}/mo
            </span>
          </div>
          {shape && (
            <div className="mt-0.5 text-xs text-muted-foreground">
              {shape.cpu} vCPU · {shape.memory} GB RAM · {shape.disk} GB disk
            </div>
          )}
        </Row>
        {order.support !== "none" && <Row label="Support">{SUPPORT[order.support].label}</Row>}
        <Row label="Onboarding">{ONBOARDING[order.onboarding].label}</Row>
      </dl>

      {canManage && (
        <div className="border-t p-6">
          <Button onClick={onManage} disabled={opening}>
            {opening ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
            Manage subscription
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            Update your card, view invoices, or cancel hosting in the Stripe billing portal.
          </p>
        </div>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-6 py-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm">{children}</dd>
    </div>
  );
}
