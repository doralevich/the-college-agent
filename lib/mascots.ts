// The rotating cast of College Agent mascots (public/agents/*.webp): waving, reading,
// backpack, pointing, coffee. Different pages surface different agents so the site feels
// alive without any one image getting stale.

export const AGENT_MASCOTS = [
  "/agents/agent-1.webp",
  "/agents/agent-2.webp",
  "/agents/agent-3.webp",
  "/agents/agent-4.webp",
  "/agents/agent-5.webp",
] as const;

// Deterministic pick from a seed string (usually the page label). Stable across renders
// and SSR/CSR — no Math.random, so no hydration mismatch — while giving each page its own
// agent from the rotation.
export function pickMascot(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return AGENT_MASCOTS[h % AGENT_MASCOTS.length];
}
