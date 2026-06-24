"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";

// Placeholder checkout — a real Stripe Checkout drops in here later. For now it just
// activates the plan so the rest of the flow works end to end.
export default function CheckoutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function pay() {
    setLoading(true);
    try {
      await apiFetch("/api/checkout", { method: "POST", body: JSON.stringify({}) });
      toast.success("Plan activated!");
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setLoading(false);
      toast.error((e as Error).message || "Checkout failed");
    }
  }

  const features = [
    "Your own Hermes agent, always on",
    "Chats with you over Telegram",
    "Trained on your classes, schedule & goals",
    "$20/mo of AI usage included",
  ];

  return (
    <div className="mx-auto max-w-md py-12">
      <div className="overflow-hidden rounded-xl border">
        <div className="border-b bg-card p-6">
          <h1 className="text-xl font-semibold tracking-tight">The College Agent — Student Plan</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your personal AI agent, built for you.</p>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-3xl font-bold">$20</span>
            <span className="text-sm text-muted-foreground">/month</span>
          </div>
        </div>
        <div className="space-y-3 p-6">
          {features.map((f) => (
            <div key={f} className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 shrink-0 text-primary" />
              {f}
            </div>
          ))}
          <Button className="mt-4 w-full" onClick={pay} disabled={loading}>
            {loading ? "Activating…" : "Complete purchase"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Demo checkout — no card required yet. Stripe coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}
