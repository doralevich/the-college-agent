"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Gift, Share2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";

// "Give a month, get a month" — the student's referral card. Their friend gets the
// first month of hosting free at checkout; they get a $25 credit (one hosting month)
// when the friend joins. Credits stack with no cap; Stripe applies them to upcoming
// invoices automatically.

type ReferralInfo = { code: string; url: string; joined: number; monthsEarned: number };

export function ReferralCard() {
  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && !!navigator.share);
    let cancelled = false;
    apiFetch<ReferralInfo>("/api/referral")
      .then((d) => {
        if (!cancelled) setInfo(d);
      })
      .catch(() => {}); // quiet — the card simply doesn't render if this fails
    return () => {
      cancelled = true;
    };
  }, []);

  if (!info) return null;

  async function copyLink() {
    if (!info) return;
    try {
      await navigator.clipboard.writeText(info.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy. Long-press the link to copy it.");
    }
  }

  function shareLink() {
    if (!info) return;
    navigator
      .share({
        title: "The College Agent",
        text: "I have an AI agent that runs my college life. Your first month of hosting is free with my link:",
        url: info.url,
      })
      .catch(() => {}); // user dismissed the sheet — not an error
  }

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Gift className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold">Give a month, get a month</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Share your link. Your friend gets their first month of hosting free, and you get a
            free month when they join. Free months stack, no limit.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <code className="min-w-0 truncate rounded-lg border bg-secondary/50 px-3 py-2 text-xs text-foreground">
              {info.url}
            </code>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyLink}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy link"}
              </Button>
              {canShare && (
                <Button size="sm" onClick={shareLink}>
                  <Share2 className="h-3.5 w-3.5" />
                  Share
                </Button>
              )}
            </div>
          </div>

          {info.joined > 0 && (
            <p className="mt-3 text-sm font-medium text-primary">
              {info.joined} {info.joined === 1 ? "friend" : "friends"} joined · {info.monthsEarned}{" "}
              {info.monthsEarned === 1 ? "free month" : "free months"} earned
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
