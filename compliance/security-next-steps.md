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
- **Enforced in-app admin MFA** — TOTP second-factor step-up (AAL2) required on the `/admin` console
- **Point-in-time recovery (PITR) backups enabled**
- Dependabot alerts + secret scanning
- Documentation: SECURITY_NOTES, HECVAT responses, Vendor Security Packet, FERPA DPA, policies

## 🔜 Do soon (low effort)
- [ ] **Send the FERPA DPA to a privacy attorney** before signing with any school. *(You have the PDF.)*
- [ ] Decide consent model: current banner is **opt-in** (trackers load only after Accept). Switch to
      opt-out if you want broader ad-pixel coverage. *(One-line change; ask and it's done.)*

## 🏫 Needed when a school requires it (money/time, not code)
- [ ] **Cyber liability insurance** — commonly required by university procurement. ~$1–3k/yr, a few days to obtain.
- [ ] **SOC 2** — the agent-runtime platform (Agent37) is already undergoing SOC 2, and a **Type 1
      report is available on request** through its Trust Center (agent37.trust.site) — an external
      Type 1 audit report can be requested (~$1,500). Apollo Claw's *own* Type II is the longer play:
      ~6–12 months; a compliance-automation platform (Vanta, Drata, Secureframe) cuts the effort for a
      small team.
- [ ] **Third-party penetration test** — a common enterprise/HECVAT ask; hire a firm, typically annual.
- [ ] **Accessibility conformance (VPAT / WCAG 2.1 AA)** — some schools request it; separate effort.

> **Runtime-layer terms (know before you promise a school).** The app layer is ours (Vercel /
> Supabase / Stripe) — Apollo Claw signs the FERPA DPA and controls those commitments directly. The
> agent runtime is Agent37 (Hermes), on the **standard plan**, which means: no custom MSA/DPA at the
> runtime layer, no bespoke breach-notification window, no contractual uptime SLA, and no public
> status page. Agent37's own posture, subprocessors, and policies live in its Trust Center
> (agent37.trust.site), and a SOC 2 Type 1 report is available on request. If a school demands
> contractual flow-down at the runtime layer (custom notification, audit rights, SLA), that requires
> an **Agent37 enterprise agreement** — price it in before committing. *(Our LLM on this instance is
> Claude Sonnet 5, controlled by us — not the Agent37 default.)*

## 🛠️ Optional builds (nice-to-have; ask anytime)
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
