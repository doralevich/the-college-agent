"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
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

// Settings -> Subscription: the plan they bought, monthly hosting, the Stripe portal
// (card updates, cancellation), and invoice history. AI usage credits live on their own
// Settings section (CreditsView) — this screen is strictly the subscription itself.

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
  past_due: { label: "Past due", className: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" },
  canceled: { label: "Canceled", className: "bg-muted text-muted-foreground" },
};

function statusPill(status: string) {
  return STATUS[status] ?? { label: status, className: "bg-muted text-muted-foreground" };
}

export function BillingView() {
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
        <h2 className="text-lg font-medium">Subscription</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your plan, monthly hosting, and receipts.
        </p>
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
        <div className="rounded-2xl border p-6">
          <p className="text-sm text-muted-foreground">
            Your subscription is managed by our team. Reach out if you need to make a change.
          </p>
        </div>
      )}

      {!loading && data?.canManage && <InvoicesCard />}
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
    <div className="rounded-2xl border">
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
    <div className="rounded-2xl border">
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

type InvoiceRow = {
  id: string;
  created: number; // unix seconds
  amount_cents: number;
  status: string | null;
  number: string | null;
  pdf: string | null;
};

const INVOICE_STATUS: Record<string, { label: string; className: string }> = {
  paid: { label: "Paid", className: "bg-primary/10 text-primary" },
  open: { label: "Open", className: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" },
  void: { label: "Void", className: "bg-muted text-muted-foreground" },
  uncollectible: { label: "Unpaid", className: "bg-destructive/10 text-destructive" },
};

// Stripe invoices for the plan purchase and monthly hosting. Credit top-ups are one-time
// payments (they show in the Usage Credits history), so the two lists don't overlap.
function InvoicesCard() {
  const [invoices, setInvoices] = useState<InvoiceRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<{ invoices: InvoiceRow[] }>("/api/billing/invoices")
      .then((d) => {
        if (!cancelled) setInvoices(d.invoices);
      })
      .catch(() => {}); // supplementary card — the portal still lists invoices if this fails
    return () => {
      cancelled = true;
    };
  }, []);

  if (!invoices || invoices.length === 0) return null;

  return (
    <div className="rounded-2xl border p-6">
      <h3 className="text-base font-medium">Invoices</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Receipts for your plan and monthly hosting.
      </p>
      <ul className="mt-4 space-y-2">
        {invoices.map((inv) => {
          const status = inv.status ? INVOICE_STATUS[inv.status] : null;
          return (
            <li key={inv.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-muted-foreground">
                {new Date(inv.created * 1000).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
                {inv.number && ` · ${inv.number}`}
              </span>
              <span className="flex shrink-0 items-center gap-2 tabular-nums">
                {status && (
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", status.className)}>
                    {status.label}
                  </span>
                )}
                {formatUSD(inv.amount_cents)}
                {inv.pdf && (
                  <a
                    href={inv.pdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary underline underline-offset-2"
                  >
                    PDF
                  </a>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
