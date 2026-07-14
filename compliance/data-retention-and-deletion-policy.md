# Data Retention & Deletion Policy — The College Agent

**Owner:** David · **Entity:** Apollo Claw · **Effective:** 2026-07-14 · **Review:** annually

What we keep, for how long, and how we delete it. Backs the deletion capability described in
`SECURITY_NOTES.md` (Item 10) and answers the retention questions in HECVAT, FERPA, and privacy law.

## What we hold
- **Account & profile:** name, school & personal email, phone, school, major/year.
- **Academic intake:** questionnaire responses, uploaded résumé, agent configuration.
- **Agent content:** what the student shares with their agent.
- **Billing:** Stripe customer/subscription/payment records (Stripe is the system of record).
- **Marketing:** email address in the mailing list (opt-in).

## Retention
- **Active accounts:** retained while the account is active and for the period needed to provide the
  service.
- **After deletion request or account closure:** personal and academic data is deleted (see below).
- **Billing/financial records:** retained as required by tax and accounting obligations
  (commonly up to 7 years), held by Stripe. These are kept even after account deletion.
- **Backups:** deleted data ages out of provider backups on the normal backup-rotation schedule.

## Deletion — how it works
An administrator can fully erase an account on request. The process (implemented and documented in
`SECURITY_NOTES.md`) removes, in order:
1. The student's live agent instance(s) at the runtime provider.
2. Uploaded files (résumés, avatars) from storage.
3. Every user-scoped database row across all tables.
4. The email address from the marketing audience (permanent erase).
5. The authentication account itself.

A confirmation step (re-entering the account email) prevents accidental deletion of the wrong
account. **Billing records in Stripe are retained** per the schedule above; they can be additionally
redacted on request.

Self-service export is available today (students can download their data); a self-service delete
button is on the roadmap. Until then, deletion is handled promptly on request via security@apolloclaw.ai.

## Rights requests
Access, export, correction, and deletion requests are handled within the timeframe required by
applicable law (e.g. GDPR: 30 days; CCPA: 45 days). Requests go to security@apolloclaw.ai.

## Institutional data
For data processed on behalf of a university, retention and deletion follow the terms of the
data-processing agreement with that institution, which take precedence over the defaults above.
