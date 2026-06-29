"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Row = {
  key: string;
  name: string;
  amount: number;
  product: string;
  price: string;
  action: "unchanged" | "created" | "repriced" | "renamed";
};

type Result = {
  mode: "test" | "live";
  rows: Row[];
  archived: string[];
};

export default function StripeCatalogPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/stripe/seed-catalog", { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message ?? `HTTP ${res.status}`);
      setResult(body as Result);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Stripe Catalog</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sync the live Stripe catalog with the prices in <code>lib/pricing.ts</code>. Safe to
          re-run — products are matched by <code>metadata.catalog_key</code> and prices by{" "}
          <code>lookup_key</code>. Amounts that have changed mint a new Stripe Price and
          archive the old one. Use this after editing prices in the Stripe dashboard.
        </p>
      </div>

      <Button onClick={run} disabled={loading}>
        {loading ? "Syncing..." : "Sync Stripe Catalog"}
      </Button>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="text-sm">
            Synced against{" "}
            <span className="font-semibold uppercase">{result.mode}</span> mode.
          </div>

          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left">
                  <th className="px-3 py-2 font-medium">Lookup key</th>
                  <th className="px-3 py-2 font-medium">Product</th>
                  <th className="px-3 py-2 font-medium">Amount</th>
                  <th className="px-3 py-2 font-medium">Price ID</th>
                  <th className="px-3 py-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((r) => (
                  <tr key={r.key} className="border-t">
                    <td className="px-3 py-2 font-mono text-xs">{r.key}</td>
                    <td className="px-3 py-2">{r.name}</td>
                    <td className="px-3 py-2 font-mono text-xs">
                      ${(r.amount / 100).toLocaleString("en-US", { minimumFractionDigits: r.amount % 100 ? 2 : 0 })}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{r.price}</td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          r.action === "unchanged"
                            ? "text-muted-foreground"
                            : "font-semibold text-emerald-700"
                        }
                      >
                        {r.action}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {result.archived.length > 0 && (
            <div className="text-sm">
              Archived stale keys: {result.archived.map((k) => <code key={k} className="mr-2">{k}</code>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
