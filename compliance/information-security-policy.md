# Information Security Policy — The College Agent

**Owner:** David · **Entity:** Apollo Claw · **Effective:** 2026-07-14 · **Review:** annually

A right-sized policy for a small SaaS team. It states what we protect, who's responsible, and the
controls we hold ourselves to. It is deliberately concrete and matched to how the product is
actually built (`SECURITY_NOTES.md`).

## 1. Purpose & scope
Protect the confidentiality, integrity, and availability of student and institutional data
processed by The College Agent. Covers all production systems (Vercel, Supabase, Stripe, Agent37,
Mailchimp/Mandrill), source code, and the people with access to them.

## 2. Roles & responsibility
- **David** is accountable for security decisions, access grants, and incident response.
- All contributors are responsible for following this policy and reporting concerns to
  security@apolloclaw.ai.

## 3. Access control
- Administrative access is restricted to a **named allowlist**, enforced **server-side** on every
  admin route and API. Client-side checks are never relied upon.
- Students can access **only their own** records; enforced by Postgres Row-Level Security on every
  table.
- The principle of **least privilege** applies: the public browser key has no database table access;
  privileged operations use a server-only service role.
- **Multi-factor authentication is enabled on all administrative/infrastructure accounts**
  (Supabase, Vercel, GitHub, Stripe, email). The in-app admin console uses passwordless magic-link;
  enforced in-app MFA is on the roadmap.
- Access is reviewed at least **annually** and revoked promptly when someone leaves.

## 4. Data protection
- **In transit:** TLS/HTTPS enforced site-wide with HSTS.
- **At rest:** managed database encryption; student-supplied API keys additionally encrypted with
  AES-256-GCM using a key held outside the database.
- **Secrets:** stored only as server-side environment variables; never committed to source control
  (enforced by commit-time secret scanning).
- **Data minimization:** we collect only what the service needs and never sell or share personal data.

## 5. Application security
- Standard HTTP security headers and a Content-Security-Policy are enforced.
- All public endpoints are rate-limited.
- Payment webhooks are signature-verified and idempotent.
- Input is validated server-side; errors never leak secrets.

## 6. Change management
- All changes go through version control and pull requests with preview deploys before production.
- Database schema changes ship as reviewed migrations.

## 7. Vulnerability management
- Automated dependency updates (Dependabot) and secret scanning run continuously.
- Security advisories from providers are reviewed and acted on.
- Third-party penetration testing is performed on the roadmap cadence.

## 8. Vendor / sub-processor management
- Core sub-processors: Vercel (hosting), Supabase (data), Stripe (payments), Agent37 (Hermes agent
  runtime), Mailchimp/Mandrill (email). Each is a reputable provider with its own security program;
  Agent37 publishes its posture, subprocessors, and policies in its Trust Center (agent37.trust.site).
- New sub-processors handling personal data are reviewed before adoption.

## 9. Incident response
- Security incidents follow `incident-response-plan.md`, including breach-notification commitments.

## 10. Policy governance
- This policy is reviewed at least annually and after any material change or incident.
- Exceptions must be approved by David and recorded.
