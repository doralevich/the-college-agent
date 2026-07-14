# Incident Response Plan — The College Agent

**Owner:** David · **Entity:** Apollo Claw · **Effective:** 2026-07-14 · **Review:** annually

What to do when something goes wrong — a data exposure, account compromise, or suspected breach.
Kept short so it's actually usable under pressure.

## Report a security issue
Email **security@apolloclaw.ai**. Anyone — staff, students, or outside researchers — can report. Every
report is acknowledged and triaged.

## Severity levels
- **SEV-1 (Critical):** confirmed exposure or loss of personal/student data, or a compromised
  production system. → Respond immediately.
- **SEV-2 (High):** vulnerability that could lead to SEV-1 but isn't yet exploited. → Respond within 24h.
- **SEV-3 (Low):** limited-impact issue, no personal data at risk. → Respond within a few business days.

## The six steps
1. **Detect & report** — capture what was observed, when, and by whom. Open an incident record.
2. **Triage** — David assigns a severity and an owner.
3. **Contain** — stop the bleeding: rotate exposed secrets, disable affected access, take an endpoint
   offline, or push an emergency fix. (Example precedent: the July 2026 database-policy fix was
   applied and verified within minutes of confirmation.)
4. **Eradicate & recover** — remove the root cause, restore from clean backups if needed, and verify
   the fix in production.
5. **Notify** — see below.
6. **Review** — within 5 business days, write a short post-incident note: timeline, root cause, and
   what changes prevent a recurrence. Feed fixes back into the roadmap.

## Breach notification
If personal or student data was, or is reasonably believed to have been, accessed by an unauthorized
party:
- **Affected institutions** are notified **without undue delay and within the timeline required by
  our agreement with them** (commonly 72 hours; FERPA agreements may specify shorter).
- **Affected individuals** and any **regulators** are notified as required by applicable law
  (state breach-notification statutes, GDPR/CCPA where applicable).
- Notifications describe what happened, what data was involved, what we've done, and what the
  recipient should do. David approves all external notifications; involve legal counsel.

## Key contacts & systems
- Security owner: David — security@apolloclaw.ai
- Providers to engage as needed: Vercel, Supabase, Stripe (each has a security/abuse channel).
- Where to act fast: Supabase (database, RLS, backups), Vercel (env secrets, redeploy/rollback),
  GitHub (revoke tokens, secret scanning).

## Test it
Run a **tabletop exercise** at least annually — walk through a hypothetical SEV-1 end to end and
confirm each step and contact still works.
