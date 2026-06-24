# Tests

Two layers, intentionally simple.

## Unit tests — fast, no secrets

Pure functions only (pricing math, persona builders, status/format helpers). No network,
no Supabase, no Agent37, so they run anywhere with zero config.

```bash
npm test          # one-shot
npm run test:watch
```

Files: `tests/unit/*.test.ts`. Config: `vitest.config.ts` (aliases `@/` and stubs the
Next.js `server-only` marker so server modules import cleanly).

## End-to-end lifecycle — real Agent37, gated

`tests/e2e/lifecycle.e2e.ts` exercises the whole instance lifecycle against the real API, for
**every machine shape (Basic + Pro)**: register-check the `college-agent` template → create an
instance → poll until `running` → exec a command inside it (and confirm Hermes shipped) →
delete it. It always cleans up, even on failure, so it never leaves a billed box behind.

It needs `AGENT37_API_KEY` (read from `.env.local`) **and a funded Agent37 wallet**, and
takes a few minutes — so it is NOT part of `npm test`.

```bash
npm run test:e2e                    # all shapes, create → verify → delete each
npm run test:e2e -- --no-cleanup    # leave the boxes up to poke at
```

Shapes are pulled from `config/agents.ts` (`HOSTING_SHAPES`), so the test always matches what
the app actually provisions. Each box is named `e2e-smoke-<plan>-<timestamp>` and tagged
`metadata.e2e: true`.
