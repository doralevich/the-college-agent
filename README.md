# The College Agent

```bash
npm install
npm run dev        # http://localhost:3000
```

## Test Stripe checkout locally

Run the dev server, then in another terminal forward Stripe webhook events to it (the key is read from `.env.local`, so nothing to paste):

```bash
npm run stripe:listen
```

Leave it running, then pay on `/build` with test card `4242 4242 4242 4242` (any future expiry / CVC / ZIP). The webhook flips the order to `paid` and the entitlement to `active`.

## Tests

```bash
npm test            # unit tests — pure logic, no secrets, runs anywhere
npm run test:e2e    # Agent37 lifecycle on every shape (Basic + Pro): create → verify → delete each (needs AGENT37_API_KEY + funded wallet)
```

The e2e creates a real (billed) instance named `e2e-smoke-<timestamp>` tagged `metadata.e2e: true`, and always deletes it — even on failure. See `tests/README.md`.

## Publish a new agent template

The student agent image (Hermes + Claude Code) lives in `template/`. After editing it, bump the
`TAG` line near the top of `template/release.sh` (tags are immutable — `YYYY.MM.DD` + a letter:
`a`, `b`, `c`…) and run:

```bash
npm run release:agent
```

Or set the tag inline without editing the file:

```bash
TAG=2026.06.26c npm run release:agent
HERMES_TAG=2026.06.22a TAG=2026.06.26c npm run release:agent   # pin an older Hermes base to roll back
```

Existing instances keep the tag they were created with — update or reprovision them to pick up a new version.