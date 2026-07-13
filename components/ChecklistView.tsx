"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, PencilLine } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { CHECKLIST_GROUPS, CHECKLIST_TOTAL } from "@/lib/checklist";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ConversationalOnboard } from "@/components/ConversationalOnboard";

// The Checklist tab: everything a student can feed their agent, tick-off-able, plus
// their intake answers with a real edit path. Checks persist server-side
// (checklist_items) so they follow the student across devices.

type Props = {
  userId: string;
  firstName: string | null;
  // The stored intake questionnaire (onboard_submissions.questionnaire). Shaped like the
  // wizard's form state, so it can seed the wizard for the edit flow.
  intake: Record<string, unknown> | null;
};

// The intake summary card shows a curated slice of the questionnaire, not the whole blob.
const SUMMARY_FIELDS: Array<{ key: string; label: string }> = [
  { key: "school", label: "School" },
  { key: "agentName", label: "Agent name" },
  { key: "year", label: "Year" },
  { key: "major", label: "Major" },
  { key: "topPriority", label: "Priorities" },
  { key: "integrationsWanted", label: "Tools you use" },
];

function summaryValue(v: unknown): string {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean).join(", ");
  return typeof v === "string" ? v.trim() : "";
}

export function ChecklistView({ userId, firstName, intake }: Props) {
  const router = useRouter();
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiFetch<{ checked: string[] }>("/api/checklist")
      .then((d) => {
        if (!cancelled) {
          setChecked(new Set(d.checked));
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) setLoaded(true); // show the list unchecked rather than nothing
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function toggle(key: string) {
    const next = !checked.has(key);
    setChecked((prev) => {
      const s = new Set(prev);
      if (next) s.add(key);
      else s.delete(key);
      return s;
    });
    apiFetch("/api/checklist", { method: "POST", body: JSON.stringify({ key, checked: next }) }).catch(() => {
      // Revert on failure so the UI never lies about what's saved.
      setChecked((prev) => {
        const s = new Set(prev);
        if (next) s.delete(key);
        else s.add(key);
        return s;
      });
      toast.error("Couldn't save that. Try again.");
    });
  }

  // Edit flow: seed the wizard's saved-progress slot with the stored answers, then mount
  // it in place. Submitting re-runs /api/onboard-submit, which upserts the same row.
  function startEdit() {
    try {
      localStorage.setItem(
        `ca-onboard-progress:${userId}`,
        JSON.stringify({ stepIdx: 0, form: intake ?? {} })
      );
    } catch {
      /* quota / disabled — the wizard just starts blank */
    }
    setEditing(true);
  }

  const classes = Array.isArray(intake?.classes) ? (intake?.classes as Array<Record<string, unknown>>) : [];
  const summaryRows = useMemo(
    () =>
      SUMMARY_FIELDS.map(({ key, label }) => ({ label, value: summaryValue(intake?.[key]) })).filter(
        (r) => r.value
      ),
    [intake]
  );

  if (editing) {
    return (
      <div>
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            router.refresh(); // pull the updated questionnaire back into the summary card
          }}
          className="mb-4 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to checklist
        </button>
        <ConversationalOnboard userId={userId} knownFirstName={firstName} prefill={null} />
      </div>
    );
  }

  const done = checked.size;
  const pct = Math.round((done / CHECKLIST_TOTAL) * 100);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Checklist</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Everything you can feed your agent to make it perfect. Check things off as you go; most
          of them are one message in Chat. It all saves automatically.
        </p>
        <div className="mt-4 flex items-baseline justify-between gap-3">
          <span className="text-sm font-semibold tabular-nums text-foreground">
            {done} of {CHECKLIST_TOTAL} complete
          </span>
          <span className="text-sm font-medium tabular-nums text-muted-foreground">{pct}%</span>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${Math.max(pct, 2)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Intake summary + edit entry point. */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold">Your intake</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              What you told us when you built your agent. Step back through any time to adjust it.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={startEdit} className="shrink-0">
            <PencilLine className="h-3.5 w-3.5" />
            Review and edit
          </Button>
        </div>
        {(summaryRows.length > 0 || classes.length > 0) && (
          <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            {summaryRows.map((r) => (
              <div key={r.label} className="min-w-0">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{r.label}</dt>
                <dd className="mt-0.5 truncate text-foreground" title={r.value}>
                  {r.value}
                </dd>
              </div>
            ))}
            {classes.length > 0 && (
              <div className="min-w-0 sm:col-span-2">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Classes ({classes.length})
                </dt>
                <dd className="mt-0.5 text-foreground">
                  {classes
                    .map((c) => String(c?.name ?? "").trim())
                    .filter(Boolean)
                    .join(" · ")}
                </dd>
              </div>
            )}
          </dl>
        )}
      </div>

      {/* The checklist itself. */}
      <div className={cn("space-y-6", !loaded && "pointer-events-none opacity-60")}>
        {CHECKLIST_GROUPS.map((group) => {
          const groupDone = group.items.filter((i) => checked.has(i.key)).length;
          return (
            <div key={group.title} className="rounded-xl border bg-card">
              <div className="flex items-center justify-between gap-3 border-b px-5 py-3.5">
                <h2 className="text-base font-semibold leading-tight">{group.title}</h2>
                <span className="text-xs font-medium tabular-nums text-muted-foreground">
                  {groupDone}/{group.items.length}
                </span>
              </div>
              <ul className="divide-y">
                {group.items.map((item) => {
                  const isChecked = checked.has(item.key);
                  return (
                    <li key={item.key}>
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={isChecked}
                        onClick={() => toggle(item.key)}
                        className="flex w-full items-start gap-3 px-5 py-3 text-left transition-colors hover:bg-secondary/40"
                      >
                        <span
                          aria-hidden
                          className={cn(
                            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                            isChecked ? "border-primary bg-primary" : "border-input bg-background"
                          )}
                        >
                          {isChecked && <Check className="h-3.5 w-3.5 text-primary-foreground" strokeWidth={3} />}
                        </span>
                        <span className="min-w-0">
                          <span
                            className={cn(
                              "block text-sm font-medium",
                              isChecked ? "text-muted-foreground line-through decoration-muted-foreground/50" : "text-foreground"
                            )}
                          >
                            {item.label}
                          </span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">{item.hint}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Tip: you don't have to do these in order. Start with your calendar and your class list,
        and let the rest fill in over the semester.
      </p>
    </div>
  );
}
