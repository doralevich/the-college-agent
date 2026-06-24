import path from "node:path";
import { defineConfig } from "vitest/config";

// Unit tests only: pure functions (pricing math, persona builders, status/format helpers).
// They touch no network, no Supabase, and no Agent37 — so `npm test` is always safe to run
// anywhere with zero env. The Agent37 lifecycle smoke test is a separate, gated target
// (`npm run test:e2e`, see tests/e2e/lifecycle.e2e.ts), never part of the default run.
export default defineConfig({
  resolve: {
    alias: [
      // tsconfig maps "@/*" -> "./*" (repo root); mirror that for the test runner.
      { find: /^@\//, replacement: path.resolve(__dirname, ".") + "/" },
      // `server-only` is a Next.js bundler marker with no Node resolution; stub it so server
      // modules (lib/hermes, lib/agent37, …) import cleanly under Vitest.
      { find: /^server-only$/, replacement: path.resolve(__dirname, "tests/stubs/server-only.ts") },
    ],
  },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
  },
});
