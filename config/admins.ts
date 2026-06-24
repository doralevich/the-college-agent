import "server-only";

// Platform (super) admins — distinct from the per-workspace `memberships.role = 'admin'`.
// These are the only identities allowed into the secret /admin god-view and the only
// ones permitted to provision agents. Gating lives entirely in app code (this constant);
// there is intentionally no DB/env mirror to keep a single source of truth. `server-only`
// keeps the list out of the client bundle so we never advertise who the admins are.
const RAW_ADMIN_EMAILS = [
  "daveo@designsbydaveo.com",
  "vishnukool@gmail.com",
  "david@apolloclaw.ai",
];

export const ADMIN_EMAILS: readonly string[] = RAW_ADMIN_EMAILS.map((e) =>
  e.trim().toLowerCase()
);

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}
