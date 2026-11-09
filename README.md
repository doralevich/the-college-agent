# The College Agent

```bash
npm install
npm run dev        # http://localhost:3000
```

## What this site is

The storefront for The College Agent: landing pages, blog (Sanity), the demo sandbox, contact and
newsletter. Since Nov 2026 everything behind a sign-in runs on ApolloClaw (apolloclaw.ai): the
checkout, the questionnaire, the agent build, the dashboard and billing. Every "Build My Agent"
button and the pricing cards link there (`lib/apolloclaw-links.ts`), and the old `/build`,
`/login`, `/dashboard` and `/setup` routes redirect there (`next.config.ts`).

The student agent's box image, the student plans and the student questionnaire all live in the
ApolloClaw repo now (`template/college/`, `config/agent-plans.ts`, `lib/collegeIntake.ts` there).

## Tests

```bash
npm test            # unit tests — pure logic, no secrets, runs anywhere
```
