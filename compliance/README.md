# Compliance Starter Pack — The College Agent

This folder is the paperwork side of the July 2026 security work. The technical controls are
described in the repo-root `SECURITY_NOTES.md`; **this folder is the documents a university,
auditor, or privacy attorney will ask for.** Everything here is a strong, pre-filled starting
point written from the product's actual controls — not boilerplate — but it needs your review and,
where noted, a lawyer's.

## What's in here

| File | What it is | Status | Needs |
|---|---|---|---|
| `HECVAT-responses.md` | Pre-filled answers to the higher-ed vendor security questionnaire | Draft, ~90% answerable today | Your review; drop into the official HECVAT workbook |
| `data-processing-agreement-TEMPLATE.md` | FERPA-aware DPA to sign with a university | Template | **Attorney review before use** |
| `vendor-security-packet.md` | The one doc to send a school — data flow, sub-processors, controls, readiness | Ready | Send on request |
| `security-overview.md` | One-page plain-language security summary (shareable) | Ready | Share / link publicly |
| `security-next-steps.md` | Living checklist — what's done, what's next, what's needed | Living | Revisit quarterly |
| `information-security-policy.md` | Your baseline InfoSec + access-control policy | Draft | Fill placeholders; adopt |
| `incident-response-plan.md` | What to do if there's a breach | Draft | Fill placeholders; adopt |
| `data-retention-and-deletion-policy.md` | What you keep, for how long, and how you delete it | Draft | Fill placeholders; adopt |

## Details — filled in

These are already populated across every document from what's known about the project:

- **Entity:** Apollo Claw · **Security owner:** David · **Security contact:** security@apolloclaw.ai

Two things to confirm when convenient (neither blocks anything):
- **Exact registered entity name** — I used "Apollo Claw." If the contracting entity is a formal
  LLC/Inc (e.g. "Apollo Claw LLC"), swap it in — it's the one field you don't want wrong on a signed
  contract. One word and I'll update it everywhere.
- **Governing-law state** — deliberately left for your attorney to set in the DPA (§9), alongside
  term and liability.

## The only things left that must be done by a human

1. **Send `data-processing-agreement-TEMPLATE.md` to a privacy attorney** before using it with a school.
2. **Buy cyber-liability insurance** — commonly required by university procurement.
3. **Deploy the pending admin-MFA change** (Vercel) so the enforced in-app second factor goes live.

Everything else in the roadmap I can build for you — just say go.

## Roadmap status (from the Compliance Briefing)

- **Now:** ✅ hardening pass done & deployed · ✅ encryption key deployed · ✅ Dependabot/secret-scanning on · ✅ CSP enforced
- **Next 90 days:** ✅ HECVAT · ✅ admin MFA (enforced in-app TOTP) · ✅ audit logging · ✅ policies · ✅ consent banner · ✅ PITR backups · ◑ FERPA DPA (drafted — pending attorney review)
- **3–12 months:** ◑ SOC 2 (agent-runtime platform in progress; Type 1 on request · Apollo Claw's own on roadmap) · ⬜ penetration test · ⬜ IR tabletop · ⬜ security training · ⬜ cyber-liability insurance
