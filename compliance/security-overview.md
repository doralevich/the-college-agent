# Security Overview — The College Agent

**Apollo Claw · thecollegeagent.ai · security@apolloclaw.ai**

The College Agent protects student data with encryption everywhere, strict per-user isolation,
multi-factor-protected administration, and audited controls — hosted entirely in the United States.
This is a summary; full documentation (HECVAT, security policies, and a FERPA data-processing
agreement) is available on request. *(A shareable one-page PDF version of this overview is kept with
these docs.)*

## Data protection
- **Encrypted in transit** — TLS/HTTPS everywhere with HSTS.
- **Encrypted at rest** — at both layers: managed database encryption (application) and full-volume
  LUKS2 encryption on the agent-runtime (Agent37); student-supplied API keys additionally encrypted
  with AES-256-GCM, key held outside the database.
- **Backups** — point-in-time recovery (PITR) enabled; backups encrypted at rest.

## Access & isolation
- **Per-user isolation** — Postgres row-level security on every table; students reach only their own data.
- **Admin allowlist** — enforced server-side on every admin action.
- **MFA** on all administrative & infrastructure accounts (Supabase, Vercel, GitHub, Stripe, email);
  least-privilege service access.

## Application security
- **Security headers + Content-Security-Policy** on every response.
- **Rate limiting** on all public endpoints.
- **Payment webhooks** signature-verified and idempotent.
- **Audit logging** of sensitive administrative actions.

## Privacy & data rights
- We **never sell or share** personal data.
- **Consent-based** analytics (GDPR/CCPA).
- **Export and deletion** on request; published privacy policy.

## Payments
- Processed by **Stripe** (PCI DSS SAQ-A scope). Card data **never touches** our systems.

## Operations & response
- **US hosting** — Vercel & Supabase.
- **Dependency + secret scanning** on the codebase.
- **Incident response plan** with breach notification.

## Compliance
- **FERPA:** acts as a "school official" and will sign a data-processing agreement.
- **HECVAT** responses available. **SOC 2** — the agent-runtime platform (Agent37) is in progress
  with a Type 1 report available on request via its Trust Center (agent37.trust.site); Apollo Claw's
  own attestation is on the roadmap.

## Sub-processors
Vercel (hosting), Supabase (database/storage), Stripe (payments), Agent37 (Hermes agent runtime),
Mailchimp/Mandrill (email) — all under equivalent data-protection obligations, all US-based. The
agent-runtime platform (Agent37) publishes its current sub-processors, policies, and posture in its
Trust Center at **agent37.trust.site**.
