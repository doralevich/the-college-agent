# Security — What's Next & What's Needed

A living checklist of where security stands and what remains. Updated 2026-07-14. Owner: David
(security@apolloclaw.ai). Revisit at least quarterly.

## ✅ Done (live in production)
- Critical data exposure found and closed (RLS on `setup_submissions` / `onboard_submissions`)
- Encryption in transit (TLS/HSTS) and at rest (AES-256-GCM for BYO keys)
- Per-user data isolation (row-level security) verified on all tables
- Admin authentication (server-side allowlist) on every admin route
- Rate limiting on all public endpoints
- Security headers + Content-Security-Policy
- Stripe webhook signature verification + idempotency (+ timeout fix)
- Audit logging of sensitive admin actions
- Cookie/consent banner (GDPR/CCPA)
- Data deletion capability + runbook
- **MFA on all admin/infrastructure accounts** (Supabase, Vercel, GitHub, Stripe, email)
- **Point-in-time recovery (PITR) backups enabled**
- Dependabot alerts + secret scanning
- Documentation: SECURITY_NOTES, HECVAT responses, Vendor Security Packet, FERPA DPA, policies

## 🔜 Do soon (low effort)
- [ ] **Send the FERPA DPA to a privacy attorney** before signing with any school. *(You have the PDF.)*
- [ ] Decide consent model: current banner is **opt-in** (trackers load only after Accept). Switch to
      opt-out if you want broader ad-pixel coverage. *(One-line change; ask and it's done.)*

## 🏫 Needed when a school requires it (money/time, not code)
- [ ] **Cyber liability insurance** — commonly required by university procurement. ~$1–3k/yr, a few days to obtain.
- [ ] **SOC 2 Type II** — the enterprise trust report. ~6–12 months; a compliance-automation platform
      (Vanta, Drata, Secureframe) cuts the effort for a small team.
- [ ] **Third-party penetration test** — a common enterprise/HECVAT ask; hire a firm, typically annual.
- [ ] **Accessibility conformance (VPAT / WCAG 2.1 AA)** — some schools request it; separate effort.

## 🛠️ Optional builds (nice-to-have; ask anytime)
- [ ] **Enforced in-app admin MFA** (TOTP on the `/admin` console) — test on preview before enforcing.
- [ ] **Deeper Stripe webhook optimization** — ack Stripe instantly, run best-effort side-effects in the
      background (drives the endpoint error rate toward zero).
- [ ] **Self-service account deletion** button for students (today deletion is admin-triggered on request).

## 🔁 Ongoing (keep the posture healthy)
- [ ] Review & merge Dependabot dependency PRs as they arrive; keep dependencies patched.
- [ ] Review the admin allowlist and account access periodically (at least annually); remove stale access promptly.
- [ ] Run an incident-response **tabletop exercise** at least once a year.
- [ ] Re-review the written policies annually (or after any material change/incident).
- [ ] Keep this file and the HECVAT/vendor packet current as controls change.

---
*This is a technical/operational plan, not legal advice. FERPA/GDPR obligations and any DPA should be
reviewed by a qualified privacy attorney; SOC 2 requires an independent auditor.*
