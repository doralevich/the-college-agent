"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { formatUSD } from "@/lib/pricing";
import { Button } from "@/components/ui/button";

// Admin console for the ambassador program. Payout release stays human: the run
// queues exact amounts + handles; the admin sends via PayPal/Venmo, then marks paid.

type Ambassador = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  school: string | null;
  status: string;
  stripe_promo_code: string | null;
  referral_slug: string | null;
  cleared_referral_count: number;
  w9_on_file: boolean;
  payout_method: string | null;
  payout_handle: string | null;
  created_at: string;
};

type Sale = {
  id: string;
  ambassador_id: string | null;
  purchaser_email: string | null;
  coupon_code_used: string | null;
  gross_cents: number;
  status: string;
  review_reason: string | null;
  bounty_cents: number | null;
  clears_at: string;
  created_at: string;
};

type Payout = {
  id: string;
  ambassador_id: string | null;
  payee_type: string;
  run_date: string;
  total_cents: number;
  status: string;
  method: string | null;
  handle: string | null;
};

type Snapshot = { ambassadors: Ambassador[]; reviewSales: Sale[]; recentSales: Sale[]; payouts: Payout[] };

export function AmbassadorsAdmin() {
  const [data, setData] = useState<Snapshot | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    apiFetch<Snapshot>("/api/admin/ambassadors")
      .then(setData)
      .catch((e) => toast.error((e as Error).message || "Couldn't load ambassadors."));
  }, []);
  useEffect(load, [load]);

  async function act(action: string, id: string, extra: Record<string, unknown> = {}) {
    setBusy(id + action);
    try {
      await apiFetch("/api/admin/ambassadors", {
        method: "POST",
        body: JSON.stringify({ action, id, ...extra }),
      });
      toast.success("Done.");
      load();
    } catch (e) {
      toast.error((e as Error).message || "Action failed.");
    } finally {
      setBusy(null);
    }
  }

  if (!data) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading ambassador program…
      </div>
    );
  }

  const ambName = (id: string | null) => data.ambassadors.find((a) => a.id === id)?.full_name ?? "—";
  const pending = data.ambassadors.filter((a) => a.status === "pending");
  const approved = data.ambassadors.filter((a) => a.status === "approved");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ambassador Program</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Approve applicants, review flagged sales, and reconcile bi-weekly payout runs. Money
          moves by hand: send via PayPal/Venmo, then mark the payout paid here.
        </p>
      </div>

      {/* Applications */}
      <section className="rounded-xl border bg-card p-5">
        <h2 className="text-base font-semibold">Applications ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No pending applications.</p>
        ) : (
          <ul className="mt-3 divide-y">
            {pending.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <div className="min-w-0">
                  <div className="font-medium">{a.full_name}</div>
                  <div className="text-muted-foreground">
                    {a.email} · {a.school ?? "school n/a"} · {a.phone ?? "phone n/a"}
                  </div>
                </div>
                <Button size="sm" disabled={busy === a.id + "approve"} onClick={() => act("approve", a.id)}>
                  {busy === a.id + "approve" && <Loader2 className="h-4 w-4 animate-spin" />}
                  Approve + issue code
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Active ambassadors */}
      <section className="rounded-xl border bg-card p-5">
        <h2 className="text-base font-semibold">Active ambassadors ({approved.length})</h2>
        {approved.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Nobody approved yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Code</th>
                  <th className="py-2 pr-4">Link</th>
                  <th className="py-2 pr-4">Cleared</th>
                  <th className="py-2 pr-4">Tier</th>
                  <th className="py-2 pr-4">W-9</th>
                  <th className="py-2 pr-4">Payout</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {approved.map((a) => (
                  <tr key={a.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">
                      <div className="font-medium">{a.full_name}</div>
                      <div className="text-xs text-muted-foreground">{a.email}</div>
                    </td>
                    <td className="py-2 pr-4 font-mono">{a.stripe_promo_code ?? "—"}</td>
                    <td className="py-2 pr-4 font-mono text-xs">/r/{a.referral_slug ?? "—"}</td>
                    <td className="py-2 pr-4 tabular-nums">{a.cleared_referral_count}</td>
                    <td className="py-2 pr-4">{a.cleared_referral_count >= 10 ? "$100" : "$75"}</td>
                    <td className="py-2 pr-4">
                      <button
                        type="button"
                        className="underline underline-offset-2"
                        disabled={busy === a.id + "set_w9"}
                        onClick={() => act("set_w9", a.id, { w9: !a.w9_on_file })}
                      >
                        {a.w9_on_file ? "On file" : "Missing"}
                      </button>
                    </td>
                    <td className="py-2 pr-4 text-xs">
                      {a.payout_method ? `${a.payout_method}: ${a.payout_handle}` : "not set"}
                    </td>
                    <td className="py-2 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busy === a.id + "suspend"}
                        onClick={() => act("suspend", a.id)}
                      >
                        Suspend
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Fraud review */}
      <section className="rounded-xl border bg-card p-5">
        <h2 className="text-base font-semibold">Needs review ({data.reviewSales.length})</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Flagged by the fraud guards. No bounty is ever released from this state without a decision.
        </p>
        {data.reviewSales.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Nothing flagged.</p>
        ) : (
          <ul className="mt-3 divide-y">
            {data.reviewSales.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <div className="min-w-0">
                  <div className="font-medium">
                    {ambName(s.ambassador_id)} · {s.purchaser_email ?? "buyer n/a"} · {formatUSD(s.gross_cents)}
                  </div>
                  <div className="text-xs text-muted-foreground">{s.review_reason}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" disabled={busy === s.id + "release_sale"} onClick={() => act("release_sale", s.id)}>
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy === s.id + "reject_sale"}
                    onClick={() => act("reject_sale", s.id)}
                  >
                    Reject
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Payout runs */}
      <section className="rounded-xl border bg-card p-5">
        <h2 className="text-base font-semibold">Payouts</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Runs assemble every other Friday. Send the money via the listed rail, then mark paid.
        </p>
        {data.payouts.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No payout runs yet.</p>
        ) : (
          <ul className="mt-3 divide-y">
            {data.payouts.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <div className="min-w-0">
                  <div className="font-medium">
                    {p.run_date} · {p.payee_type === "org" ? "Org share" : ambName(p.ambassador_id)} ·{" "}
                    {formatUSD(p.total_cents)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {p.status === "held_no_w9" ? "HELD: no W-9 on file" : p.status} ·{" "}
                    {p.method ? `${p.method}: ${p.handle}` : "payout method not set"}
                  </div>
                </div>
                {(p.status === "queued" || p.status === "held_no_w9") && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy === p.id + "mark_paid" || (p.status === "held_no_w9" && p.total_cents > 0)}
                    title={p.status === "held_no_w9" ? "Blocked until W-9 is on file" : undefined}
                    onClick={() => act("mark_paid", p.id)}
                  >
                    Mark paid
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Recent attributed sales */}
      <section className="rounded-xl border bg-card p-5">
        <h2 className="text-base font-semibold">Recent attributed sales</h2>
        {data.recentSales.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No attributed sales yet.</p>
        ) : (
          <ul className="mt-3 divide-y">
            {data.recentSales.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-2 text-sm">
                <span className="min-w-0 truncate">
                  {new Date(s.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })} ·{" "}
                  {ambName(s.ambassador_id)} · {s.coupon_code_used ?? "via link"} · {s.purchaser_email ?? ""}
                </span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {s.status}
                  {s.bounty_cents ? ` · bounty ${formatUSD(s.bounty_cents)}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
