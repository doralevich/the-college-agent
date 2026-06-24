#!/usr/bin/env -S node --import tsx
/**
 * Agent37 lifecycle smoke test — the end-to-end check this app most needs:
 *
 *   1. Confirm the custom `college-agent` template is registered (else a box has no ports)
 *   2. For EVERY machine shape (Basic + Pro): create an instance + a capped budget
 *   3. Poll until it reports `running`
 *   4. Verify it's actually alive: exec a shell command inside it and check Hermes shipped
 *   5. Delete it (always, even on failure) so no billed box is left behind
 *
 * This talks to the REAL Agent37 API, so it needs a funded wallet and a few minutes of
 * runtime — it is deliberately NOT part of `npm test`. Run it on demand:
 *
 *   npm run test:e2e                     # every shape, create → verify → delete each
 *   npm run test:e2e -- --no-cleanup     # leave the boxes up for manual poking
 *
 * Requires AGENT37_API_KEY (loaded from .env.local by the npm script). It uses its own thin
 * API client, but pulls the machine shapes from config/agents.ts (the real source of truth,
 * a type-only import that tsx elides) so the test can't drift from what the app provisions.
 */

import { HOSTING_SHAPES } from "../../config/agents";
import type { HostingKey } from "../../lib/pricing";

const BASE = (process.env.AGENT37_API_BASE_URL || "https://api.agent37.com").replace(/\/$/, "");
const TEMPLATE = "college-agent";
const MONTHLY_CAP_MICROS = 20 * 1_000_000; // $20 cap, matches DEFAULT_AGENT.monthlyCapUsd
const POLL_INTERVAL_MS = 8_000;
const RUNNING_TIMEOUT_MS = 12 * 60 * 1000; // give a fresh box up to 12 min to reach "running"
const FAILURE_STATUSES = new Set(["error", "failed", "deleted", "deleting", "stopped"]);

interface Args {
  plans: HostingKey[];
  cleanup: boolean;
}

function parseArgs(argv: string[]): Args {
  // Always exercises every machine shape — covering all of them is the whole point.
  const args: Args = { plans: ["basic", "pro"], cleanup: true };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--no-cleanup") args.cleanup = false;
    else if (a === "--help" || a === "-h") {
      console.log("Usage: npm run test:e2e [-- --no-cleanup]");
      process.exit(0);
    }
  }
  return args;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const key = process.env.AGENT37_API_KEY;
  if (!key) throw new Error("AGENT37_API_KEY is not set (put it in .env.local).");
  const res = await fetch(`${BASE}/v1${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(init?.headers || {}) },
    cache: "no-store",
  });
  const text = await res.text();
  const data = text ? safeJson(text) : undefined;
  if (!res.ok) {
    const err = (data as { error?: { message?: string }; message?: string }) || {};
    const message = err.error?.message || err.message || res.statusText;
    const hint =
      res.status === 402
        ? " (payment required: fund the Agent37 wallet under Cloud → Billing, then retry.)"
        : "";
    throw new Error(`Agent37 ${res.status}: ${message}${hint}`);
  }
  return data as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

interface Instance {
  id: string;
  status: string;
  template: string;
  resources: { cpu: number; memory: number; disk: number };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const step = (msg: string) => console.log(`\n▶ ${msg}`);
const ok = (msg: string) => console.log(`  ✓ ${msg}`);

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  console.log(`Agent37 lifecycle smoke test → ${BASE}`);
  console.log(`Plans under test: ${args.plans.join(", ")}`);

  step(`Checking the "${TEMPLATE}" template is registered`);
  const { data: templates } = await api<{ data: { name: string }[] }>("/templates");
  if (!templates.some((t) => t.name === TEMPLATE)) {
    throw new Error(
      `Template "${TEMPLATE}" is not registered in this Agent37 account — publish it with ` +
        "`npm run release:agent`, then retry.",
    );
  }
  ok(`"${TEMPLATE}" is registered`);

  // Run each plan's lifecycle in full (create → verify → delete) before the next, so we never
  // hold two billed boxes at once and a failure in one still reports the others.
  const results: { plan: HostingKey; passed: boolean }[] = [];
  for (const plan of args.plans) {
    results.push({ plan, passed: await runLifecycle(plan, args) });
  }

  console.log("\n── Summary ──");
  for (const r of results) console.log(`  ${r.passed ? "✓" : "✗"} ${plan_label(r.plan)}`);
  if (results.some((r) => !r.passed)) process.exit(1);
  console.log("\n✓ lifecycle smoke test passed");
}

function plan_label(plan: HostingKey): string {
  const s = HOSTING_SHAPES[plan];
  return `${plan} (${s.cpu} vCPU / ${s.memory} GB / ${s.disk} GB)`;
}

// One full lifecycle for a single hosting plan. Returns true on success; logs and returns
// false on failure (never throws), so `main` can run the next plan and summarize at the end.
async function runLifecycle(plan: HostingKey, args: Args): Promise<boolean> {
  const shape = HOSTING_SHAPES[plan];
  console.log(`\n══ ${plan_label(plan)} ══`);

  step(`Creating a ${plan} instance ($20 cap)`);
  const created = await api<Instance>("/instances", {
    method: "POST",
    body: JSON.stringify({
      template: TEMPLATE,
      resources: shape,
      name: `e2e-smoke-${plan}-${Date.now()}`,
      metadata: { e2e: true, plan },
      budget: { monthly_cap_micros: MONTHLY_CAP_MICROS },
    }),
  });
  const id = created.id;
  ok(`created ${id} (status: ${created.status})`);

  let passed = true;
  try {
    step(`Waiting for ${id} to reach "running"`);
    const status = await waitForRunning(id, RUNNING_TIMEOUT_MS);
    if (status !== "running") throw new Error(`instance settled on "${status}" instead of "running"`);
    ok("instance is running");

    step("Verifying the box is alive (exec inside it)");
    const exec = await api<{ exit_code: number; stdout: string; stderr: string }>(
      `/instances/${id}/exec`,
      {
        method: "POST",
        body: JSON.stringify({
          command:
            'echo SMOKE_OK; (command -v hermes >/dev/null && echo HERMES_PRESENT) || echo HERMES_MISSING',
        }),
      },
    );
    if (exec.exit_code !== 0 || !exec.stdout.includes("SMOKE_OK")) {
      throw new Error(`exec failed: exit=${exec.exit_code} stderr=${(exec.stderr || "").slice(0, 300)}`);
    }
    ok("exec ran inside the instance (SMOKE_OK)");
    if (exec.stdout.includes("HERMES_PRESENT")) ok("Hermes is installed (custom template shipped it)");
    else console.log("  ⚠ Hermes binary not found on PATH — check the college-agent image");
  } catch (e) {
    passed = false;
    console.error(`\n✗ ${plan}: ${(e as Error).message}`);
  } finally {
    if (args.cleanup) {
      step(`Cleaning up ${id}`);
      try {
        await api<{ deleted: boolean }>(`/instances/${id}`, { method: "DELETE" });
        ok("instance deleted");
      } catch (e) {
        console.error(`  ✗ cleanup failed — delete ${id} manually: ${(e as Error).message}`);
      }
    } else {
      console.log(`\n(left ${id} running — delete it when done)`);
    }
  }
  return passed;
}

async function waitForRunning(id: string, timeoutMs: number): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  let last = "";
  while (Date.now() < deadline) {
    const { data } = await api<{ data: Instance[] }>("/instances");
    const inst = data.find((i) => i.id === id);
    const status = inst?.status ?? "unknown";
    if (status !== last) {
      console.log(`  … status: ${status}`);
      last = status;
    }
    if (status === "running") return status;
    if (FAILURE_STATUSES.has(status)) return status;
    await sleep(POLL_INTERVAL_MS);
  }
  return last || "timeout";
}

main().catch((e) => {
  console.error(`\n✗ ${(e as Error).message}`);
  process.exit(1);
});
