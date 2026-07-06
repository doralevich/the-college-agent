import type { Budget, Usage } from "@/lib/types";

// The operator's hidden markup on managed AI credits (LLM, search, tools).
//
// Students PREPAY credits through Stripe; Agent37 bills US (the operator) for the raw
// managed spend those credits fund. To keep a margin the student never sees, every credit
// we fund is discounted by this rate on the way IN, and every raw Agent37 figure is marked
// back UP on the way OUT to the student — so their balance and usage always read at face
// value while we quietly keep the spread:
//
//   fund:    student pays $X   ->  we fund   $X / (1 + rate)  of real Agent37 headroom
//   display: raw figure $Y     ->  student sees   $Y * (1 + rate)
//   earn:    Agent37 bills $U   ->  our markup is  $U * rate
//
// fundedMicros and displayMicros are exact inverses (modulo rounding), so a student can
// always spend their full displayed balance — it maps 1:1 onto real headroom — and their
// balance/spend reconcile to zero. Applied UNIFORMLY to every credit grant (starter grant,
// top-up, auto-recharge, operator comp) and to every budget leg, which keeps the budget's
// own identity (cap = consumed + remaining) intact after the display multiplier.
//
// Only NEW fundings carry the markup: credits funded 1:1 before this shipped are relabeled
// by the display multiplier (a harmless <=5% cosmetic bump) and converge as they're spent.
export const MARKUP_RATE = 0.05;

// Coerce a possibly-missing/legacy micros field to a finite number. Agent37 can return
// partial budget/usage shapes (fresh agent, pre-credits budgets), and a stray
// undefined/NaN must NOT propagate — the whole point of these helpers is that they never
// blow up a student-facing read.
function finite(micros: number | undefined | null): number {
  return typeof micros === "number" && Number.isFinite(micros) ? micros : 0;
}

// Student paid `payerMicros` of credit; return the real Agent37 headroom to actually fund.
export function fundedMicros(payerMicros: number): number {
  return Math.round(finite(payerMicros) / (1 + MARKUP_RATE));
}

// A raw Agent37 micros figure (a balance leg, a usage total) -> the face-value number the
// student is shown. The inverse of fundedMicros.
export function displayMicros(rawMicros: number | undefined | null): number {
  return Math.round(finite(rawMicros) * (1 + MARKUP_RATE));
}

// Our markup on `rawUsageMicros` of managed spend Agent37 billed us: `rate` of the bill.
export function markupMicros(rawUsageMicros: number): number {
  return Math.round(finite(rawUsageMicros) * MARKUP_RATE);
}

// Restate a raw Agent37 budget in student-facing dollars. Marks up every micros leg
// uniformly so cap = consumed + remaining still holds; leaves the period/timestamp alone.
export function displayBudget(b: Budget): Budget {
  return {
    ...b,
    monthly_cap_micros: displayMicros(b.monthly_cap_micros),
    monthly_consumed_micros: displayMicros(b.monthly_consumed_micros),
    monthly_remaining_micros: displayMicros(b.monthly_remaining_micros),
    credit_remaining_micros: displayMicros(b.credit_remaining_micros),
  };
}

// Restate raw Agent37 usage in student-facing dollars. Marks up the total and every
// per-integration cost; call counts and token counts are untouched. Tolerant of a partial
// `by_integration` (missing legs default to zeroed cost/calls) so a legacy/empty usage
// shape degrades gracefully instead of throwing on a student-facing read.
export function displayUsage(u: Usage): Usage {
  const bi = u.by_integration ?? ({} as Partial<Usage["by_integration"]>);
  return {
    ...u,
    total_micros: displayMicros(u.total_micros),
    by_integration: {
      // Spread a fully-zeroed leg when a leg is missing, then override cost — keeps the
      // shape complete for a partial/legacy usage without the "specified more than once" trap.
      llm: {
        ...(bi.llm ?? { cost_micros: 0, calls: 0, input_tokens: 0, output_tokens: 0 }),
        cost_micros: displayMicros(bi.llm?.cost_micros),
      },
      brave: { ...(bi.brave ?? { cost_micros: 0, calls: 0 }), cost_micros: displayMicros(bi.brave?.cost_micros) },
      composio: {
        ...(bi.composio ?? { cost_micros: 0, calls: 0 }),
        cost_micros: displayMicros(bi.composio?.cost_micros),
      },
    },
  };
}
