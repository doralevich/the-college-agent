# Data Processing Agreement — TEMPLATE (FERPA-aware)

> ⚠️ **This is a starting-point template, not executed legal text. Have a qualified privacy attorney
> review and adapt it before signing anything with an institution.** Many universities will provide
> their own DPA/addendum; when they do, use theirs and map it against this checklist rather than
> insisting on yours.

**Between:** Apollo Claw ("Provider") and the institution ("Institution").
**Product:** The College Agent. **Effective:** on signature.

## 1. Roles
The Institution controls the student education records. The Provider processes them **only on the
Institution's behalf and only to provide the service**. Under FERPA, the Provider acts as a
**"school official" with a legitimate educational interest** and is under the Institution's direct
control regarding the use and maintenance of education records (34 CFR § 99.31(a)(1)).

## 2. Permitted use
The Provider will use Institution/student data **only** to deliver and support The College Agent. The
Provider will **not**:
- sell, share, or use the data for advertising or its own purposes;
- re-disclose education records except as directed by the Institution or required by law;
- retain data longer than needed for the service or as stated in the retention policy.

## 3. FERPA-specific commitments
- The Provider uses education records solely for the authorized purpose and under the Institution's
  direct control.
- The Provider will **not re-disclose** education records to third parties without the Institution's
  authorization, except sub-processors listed in §6 acting on the Provider's behalf under equivalent
  obligations.
- On termination or request, the Provider returns or destroys education records (see §7).

## 4. Security
The Provider maintains the safeguards described in its Information Security Policy, including:
encryption in transit and at rest, per-user access isolation (Row-Level Security), least-privilege
administrative access, logging, and vulnerability management. Details on request.

## 5. Incident & breach notification
The Provider notifies the Institution **without undue delay and no later than [72 hours / the period
the Institution requires]** after confirming a security incident affecting Institution data, per its
Incident Response Plan, and cooperates with the Institution's obligations.

## 6. Sub-processors
The Provider uses the following sub-processors, each bound to equivalent data-protection obligations:
Vercel (hosting, US), Supabase (database/storage, US), Stripe (payments, US), Agent37 — Hermes agent
runtime, Mailchimp/Mandrill (email). The Provider gives notice before adding a sub-processor that
handles education records.

> **Counsel note.** The agent-runtime sub-processor (Agent37) operates under its own standard terms;
> its current sub-processor list, security posture, and policies are published in its Trust Center
> (agent37.trust.site). Under the Provider's current Agent37 plan, the runtime sub-processor does
> **not** execute custom DPAs or bespoke advance-change-notification commitments — those require a
> separately negotiated Agent37 enterprise agreement. If an Institution requires contractual
> flow-down at the runtime layer (custom notification windows, audit rights, or a signed
> sub-processor DPA), budget for the Agent37 enterprise tier before committing to it here.

## 7. Return & deletion
On termination or on the Institution's request, the Provider deletes or returns all Institution
education records within [30] days, using the process in the Data Retention & Deletion Policy, and
confirms completion in writing. Billing/financial records may be retained as required by law.

## 8. Audit & assurance
The Provider will respond to reasonable security questionnaires (e.g. HECVAT). The agent-runtime
platform (Agent37) is undergoing SOC 2; a Type 1 report is available on request through its Trust
Center (agent37.trust.site). The Provider's own attestation is on the roadmap. [Optional: audit
rights on reasonable notice.]

## 9. Term, governing law, liability
[To be completed with counsel — term, governing law of [US STATE], liability, indemnification.]

---
*Prepared 2026-07-14 as a negotiation starting point. Not legal advice.*
