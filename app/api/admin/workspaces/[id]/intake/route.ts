import { requirePlatformAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { ApiError, json, readJson, route } from "@/lib/http";
import { encryptForStorage, decryptSecret } from "@/lib/crypto/byo";
import { logAudit } from "@/lib/audit";

type Ctx = { params: Promise<{ id: string }> };
type DB = ReturnType<typeof createAdminClient>;

// Trim a value; "" / non-string -> null (for the nullable columns).
const orNull = (v: unknown): string | null => {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length > 0 ? s : null;
};
// Same, but never null — for onboard_submissions' NOT NULL text columns.
const orEmpty = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

// Resolve a workspace to its owner (the student whose intake rows we read/write).
async function resolveOwnerId(db: DB, workspaceId: string): Promise<string> {
  const { data, error } = await db
    .from("workspaces")
    .select("owner_id")
    .eq("id", workspaceId)
    .maybeSingle();
  if (error) throw new ApiError(500, "db_error", error.message);
  if (!data) throw new ApiError(404, "not_found", "Workspace not found");
  return data.owner_id as string;
}

// Read the workspace owner's current intake so an admin can review/edit it before creating
// an agent. Platform-admin only — this intentionally returns the Telegram bot token and the
// BYO API keys (the admin is provisioning on the student's behalf and needs to set them).
export const GET = route(async (_req: Request, { params }: Ctx) => {
  await requirePlatformAdmin();
  const { id } = await params;
  const db = createAdminClient();
  const ownerId = await resolveOwnerId(db, id);

  const [onboardRes, setupRes] = await Promise.all([
    db
      .from("onboard_submissions")
      .select(
        "first_name, last_name, school_email, personal_email, phone, school, year, major, agent_name, questionnaire, resume_url"
      )
      .eq("user_id", ownerId)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    db
      .from("setup_submissions")
      .select("telegram_token, telegram_user_id, telegram_username, anthropic_key, openai_key")
      .eq("user_id", ownerId)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (onboardRes.error) throw new ApiError(500, "db_error", onboardRes.error.message);
  if (setupRes.error) throw new ApiError(500, "db_error", setupRes.error.message);

  // BYO keys are stored encrypted; decrypt back to the raw key so the admin edits the real
  // value (legacy plaintext passes through unchanged). Platform-admin only, as above.
  const setup = setupRes.data
    ? {
        ...setupRes.data,
        anthropic_key: decryptSecret(setupRes.data.anthropic_key as string | null),
        openai_key: decryptSecret(setupRes.data.openai_key as string | null),
      }
    : null;

  return json({ owner_id: ownerId, onboard: onboardRes.data ?? null, setup });
});

// Upsert the owner's intake (one row per user). Each side is optional — the admin may save
// just onboarding, just setup, or both. Writes the SAME tables the student's own forms do.
export const PUT = route(async (req: Request, { params }: Ctx) => {
  const { user: admin } = await requirePlatformAdmin();
  const { id } = await params;
  const db = createAdminClient();
  const ownerId = await resolveOwnerId(db, id);

  const body = await readJson<{
    onboard?: Record<string, unknown>;
    setup?: Record<string, unknown>;
  }>(req);

  const now = new Date().toISOString();

  if (body.onboard) {
    const o = body.onboard;
    if (o.questionnaire != null && (typeof o.questionnaire !== "object" || Array.isArray(o.questionnaire))) {
      throw new ApiError(400, "invalid_request", "questionnaire must be a JSON object");
    }
    const { error } = await db.from("onboard_submissions").upsert(
      [
        {
          user_id: ownerId,
          first_name: orEmpty(o.first_name),
          last_name: orEmpty(o.last_name),
          school_email: orEmpty(o.school_email),
          personal_email: orNull(o.personal_email),
          phone: orEmpty(o.phone),
          school: orEmpty(o.school),
          year: orEmpty(o.year),
          major: orEmpty(o.major),
          agent_name: orNull(o.agent_name),
          questionnaire: (o.questionnaire as Record<string, unknown> | null) ?? null,
          submitted_at: now,
        },
      ],
      { onConflict: "user_id" }
    );
    if (error) throw new ApiError(500, "db_error", error.message);
  }

  if (body.setup) {
    const s = body.setup;
    const { error } = await db.from("setup_submissions").upsert(
      [
        {
          user_id: ownerId,
          telegram_token: orNull(s.telegram_token),
          telegram_user_id: orNull(s.telegram_user_id),
          telegram_username: orNull(s.telegram_username),
          // Encrypt admin-entered keys at rest too (same path as the student's own form).
          anthropic_key: encryptForStorage(orNull(s.anthropic_key)),
          openai_key: encryptForStorage(orNull(s.openai_key)),
          submitted_at: now,
        },
      ],
      { onConflict: "user_id" }
    );
    if (error) throw new ApiError(500, "db_error", error.message);
  }

  await logAudit({
    actorEmail: admin.email,
    action: "intake.update",
    target: ownerId,
    metadata: { workspaceId: id, onboard: !!body.onboard, setup: !!body.setup },
    req,
  });
  return json({ ok: true });
});
