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
| `information-security-policy.md` | Your baseline InfoSec + access-control policy | Draft | Fill placeholders; adopt |
| `incident-response-plan.md` | What to do if there's a breach | Draft | Fill placeholders; adopt |
| `data-retention-and-deletion-policy.md` | What you keep, for how long, and how you delete it | Draft | Fill placeholders; adopt |

## Fill these in once (they appear across the documents)

Search-and-replace these placeholders in every file:

- `[LEGAL ENTITY NAME]` — the company that signs contracts (e.g. the LLC behind Apollo Claw / The College Agent).
- `[SECURITY CONTACT]` — the email that receives security reports (recommend `security@apolloclaw.ai`).
- `[SECURITY OWNER]` — the named person accountable for security (likely David).
- `[US STATE]` — the state whose law governs your contracts.

> Tell me those four values and I'll fill them in across all five documents for you.

## The only things that must be done by a human

1. **Redeploy** in Vercel so the encryption key takes effect (one click — you were already there).
2. **Turn on** Dependabot alerts + secret scanning in GitHub → *Settings → Code security & analysis*
   (the `.github/dependabot.yml` in this PR handles automated dependency updates; the alert toggles
   are UI switches).
3. **Send `data-processing-agreement-TEMPLATE.md` to a privacy attorney** before using it with a school.

Everything else in the roadmap I can build for you — just say go.

## Roadmap status (from the Compliance Briefing)

- **Now:** ✅ hardening pass done & deployed · ⬜ redeploy for encryption · ⬜ Dependabot/secret-scanning toggle · ⬜ CSP enforce
- **Next 90 days:** ⬜ FERPA DPA (this folder) · ⬜ HECVAT (this folder) · ⬜ admin MFA · ⬜ audit logging · ⬜ policies (this folder) · ⬜ consent banner
- **3–12 months:** ⬜ SOC 2 readiness → Type I → Type II · ⬜ penetration test · ⬜ IR tabletop · ⬜ security training
