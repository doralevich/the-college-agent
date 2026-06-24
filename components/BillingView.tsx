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

type Summary = {
  order: {
    plan: PlanKey;
    hosting: HostingKey;
    support: SupportKey;
    onboarding: OnboardingKey;
    status: string;
    hosting_amount: number | null;
  } | null;
  canManage: boolean;
};

// Friendly label + pill color per order status (orders enum: paid | past_due | canceled).
const STATUS: Record<string, { label: string; className: string }> = {
  paid: { label: "Active", className: "bg-primary/10 text-primary" },
  past_due: { label: "Past due", className: "bg-amber-100 text-amber-700" },
  canceled: { label: "Canceled", className: "bg-muted text-muted-foreground" },
};

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
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground">Your plan, hosting, and payment details.</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : data?.order ? (
        <Plan order={data.order} canManage={data.canManage} opening={opening} onManage={openPortal} />
      ) : (
        <div className="rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">
            Your subscription is managed by our team. Reach out if you need to make a change.
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
  const status = STATUS[order.status] ?? { label: order.status, className: "bg-muted text-muted-foreground" };
  const monthly = order.hosting_amount ?? HOSTING[order.hosting].amount;

  return (
    <div className="rounded-xl border">
      <div className="flex items-start justify-between gap-3 border-b p-6">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Plan</div>
          <div className="mt-1 text-lg font-medium">{PLANS[order.plan].label}</div>
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
            Update your card, view invoices, or cancel in the Stripe billing portal.
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
