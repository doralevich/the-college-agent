# HECVAT Response Set — The College Agent

**Vendor:** Apollo Claw (product: The College Agent — thecollegeagent.ai)
**Prepared:** 2026-07-14 · **Security contact:** security@apolloclaw.ai

Pre-filled answers to the Higher Education Community Vendor Assessment Toolkit (HECVAT). These map
to the actual controls documented in `SECURITY_NOTES.md`. Paste into the official HECVAT workbook
(Lite or Full) from educause.edu/hecvat. Answers are honest as of the date above — where something
is planned rather than done, it says so.

Legend: **Yes** / **No** / **Planned** / **N/A**.

---

## Company & documentation

| # | Question | Answer |
|---|---|---|
| CO-1 | Company/product name and description | Apollo Claw — The College Agent, a personal AI assistant for college students. |
| CO-2 | Do you have a documented information security program? | **Yes** — see `information-security-policy.md`. Adopted 2026. |
| DO-1 | Can you provide a data-flow diagram / description? | **Yes** — student data is entered via the web app, stored in Supabase (Postgres), processed server-side; payments via Stripe; email via Mailchimp/Mandrill. The AI agent runs on **Hermes** (agent runtime) on the **Agent37** platform. |
| DO-2 | Do you have a security whitepaper / notes? | **Yes** — `SECURITY_NOTES.md` and the Security Posture Briefing for the application layer; the agent-runtime platform (Agent37) maintains a **Trust Center** (agent37.trust.site) with its policies, subprocessors, and compliance status. |

## Data handling

| # | Question | Answer |
|---|---|---|
| DA-1 | What institutional/student data is collected? | Name, school & personal email, phone, school, major/year, academic questionnaire, uploaded résumé, and any content the student shares with their agent. |
| DA-2 | Is data encrypted in transit? | **Yes** — TLS/HTTPS enforced site-wide with HSTS (`max-age` 2 years, preload). |
| DA-3 | Is data encrypted at rest? | **Yes**, at both layers — the application database (Supabase managed encryption) and the agent-runtime volumes (Agent37, **LUKS2** full-volume encryption). Student-supplied model API keys are additionally encrypted at the application layer with AES-256-GCM, key held outside the database. |
| DA-4 | Is data logically separated per customer/user? | **Yes** — Postgres Row-Level Security enforces per-user / per-workspace isolation; verified on all 24 tables. Each agent runs as an isolated Hermes instance. |
| DA-5 | Where is data hosted/stored? | United States (Supabase `us-east-1`; Vercel US regions; Agent37 runtime). The LLM is customer-configurable — this instance uses **Claude Sonnet 5** (Anthropic). |
| DA-6 | Do you sell or share personal data? | **No.** Data is used only to operate the service. |
| DA-7 | Can institutional data be exported and deleted on request? | **Yes** — students can download their data; a documented admin-triggered deletion path removes all records (see `data-retention-and-deletion-policy.md`). |

## Access control

| # | Question | Answer |
|---|---|---|
| AC-1 | Is access to production restricted and role-based? | **Yes** — administrative access is a server-side email allowlist enforced on every admin route and API; students reach only their own data via Row-Level Security. |
| AC-2 | Is multi-factor authentication used for administrative access? | **Yes** — all administrative/infrastructure accounts (Supabase, Vercel, GitHub, Stripe, email) require MFA, and the in-app admin console **enforces a TOTP second factor**: an administrator must complete an authenticator-app challenge (step-up to assurance level AAL2) before any admin page or action is served. |
| AC-3 | Are credentials/secrets kept out of source code? | **Yes** — all secrets are server-side environment variables; verified absent from the repository and git history; commit-time secret scanning is active. |
| AC-4 | Is least privilege applied to service accounts? | **Yes** — the browser uses a public key with no table access (RLS denies it); privileged operations use a server-only service role. |

## Application & infrastructure security

| # | Question | Answer |
|---|---|---|
| AP-1 | Are standard HTTP security headers set? | **Yes** — HSTS, X-Content-Type-Options, X-Frame-Options/frame-ancestors, Referrer-Policy, Permissions-Policy, and a Content-Security-Policy. |
| AP-2 | Is there protection against automated abuse? | **Yes** — per-IP rate limiting on all public endpoints (HTTP 429, logged). |
| AP-3 | Are payment webhooks verified? | **Yes** — Stripe webhook signatures are cryptographically verified; deliveries are idempotent. |
| AP-4 | Is card data handled in scope? | **No** — Stripe handles all card data; the application never receives card numbers (PCI DSS SAQ-A scope). |
| AP-5 | Are scheduled/automation endpoints authenticated? | **Yes** — scheduled jobs require a shared secret. |
| IN-1 | Who is your infrastructure provider? | Application layer: Vercel (hosting) + Supabase (database/auth/storage), US; Stripe for payments. Agent-runtime layer: **Hermes on the Agent37 platform** (see agent37.trust.site/subprocessors for its infrastructure subprocessors). |
| IN-2 | Are managed backups in place? | **Yes** — the application database has managed backups with **point-in-time recovery (PITR)**; agent-runtime backups are encrypted at rest. |
| IN-3 | Do you offer a contractual uptime SLA / public status page? | **No** under the current plan. Operational metrics and infrastructure/service logs are monitored (Grafana) at the runtime layer. A contractual SLA is available via an Agent37 enterprise agreement. |

## Vulnerability & change management

| # | Question | Answer |
|---|---|---|
| VU-1 | Do you scan dependencies for vulnerabilities? | **Yes** — automated dependency updates (Dependabot) and commit-time secret scanning. |
| VU-2 | Do you perform penetration testing? | **Planned** — third-party penetration test on the roadmap. |
| CM-1 | Do you use version control and code review? | **Yes** — Git with a pull-request workflow and preview deploys before production. |

## Policies, privacy & incident response

| # | Question | Answer |
|---|---|---|
| PO-1 | Do you have written security policies? | **Yes** — Information Security, Access Control, Data Retention & Deletion, and Incident Response (this folder). |
| PO-2 | Do you have a published privacy policy? | **Yes** — thecollegeagent.ai/privacy. |
| PO-3 | FERPA: will you sign a data-processing agreement as a "school official"? | **Yes** — Apollo Claw will execute a FERPA-aware DPA with the institution (`data-processing-agreement-TEMPLATE.md`). Note: the agent-runtime subprocessor (Agent37) operates under its standard terms + Trust Center; custom subprocessor DPA/notification terms require an Agent37 enterprise agreement. |
| IR-1 | Do you have an incident-response plan with breach notification? | **Yes** — `incident-response-plan.md`, including notification commitments. At the runtime layer, Agent37's published breach-notification policy applies; bespoke contractual timelines require an enterprise agreement. |
| IR-2 | Compliance certifications held (SOC 2, ISO 27001)? | **In progress** — the agent-runtime platform (Agent37) is undergoing SOC 2; a **Type 1 report is available on request** via its Trust Center. Apollo Claw's own attestation is on the roadmap. |

---

*Answers reflect controls in production as of the prepared date. Items marked "Planned" are tracked
in the Security Posture & Compliance Briefing roadmap.*
