import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// Append an entry to the audit log (audit_log table, migration 0022). Records who did what to
// which record — the evidence trail FERPA and SOC 2 reviewers ask for. Best-effort: it NEVER
// throws, so a logging hiccup can't break the action being logged. Server-only.

function ipFrom(req?: Request): string | null {
  if (!req) return null;
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip");
}

export async function logAudit(entry: {
  actorEmail?: string | null;
  action: string; // e.g. "user.delete", "intake.update", "ambassador.approve"
  target?: string | null; // the id/email/handle the action was performed on
  metadata?: Record<string, unknown> | null;
  req?: Request;
}): Promise<void> {
  try {
    const db = createAdminClient();
    await db.from("audit_log").insert({
      actor_email: entry.actorEmail ?? null,
      action: entry.action,
      target: entry.target ?? null,
      metadata: entry.metadata ?? null,
      ip: ipFrom(entry.req),
    });
  } catch (e) {
    console.warn("[audit] failed to write audit entry:", (e as Error).message);
  }
}
