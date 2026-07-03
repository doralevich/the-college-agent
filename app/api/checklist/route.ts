import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { CHECKLIST_KEYS } from "@/lib/checklist";
import { ApiError, json, readJson, route } from "@/lib/http";

// The dashboard checklist: which items this student has ticked off. Presence of a row
// means checked; unchecking deletes it, so re-checking refreshes checked_at.

export const GET = route(async () => {
  const { user } = await requireUser();
  const db = createAdminClient();
  const { data, error } = await db.from("checklist_items").select("item_key").eq("user_id", user.id);
  if (error) throw new ApiError(500, "db_error", "Couldn't load your checklist.");
  return json({ checked: (data ?? []).map((r) => r.item_key as string) });
});

export const POST = route(async (req) => {
  const { user } = await requireUser();
  const body = await readJson<{ key?: string; checked?: boolean }>(req);
  const key = (body.key ?? "").trim();
  if (!CHECKLIST_KEYS.has(key)) throw new ApiError(400, "invalid_key", "Unknown checklist item.");
  const checked = !!body.checked;

  const db = createAdminClient();
  if (checked) {
    const { error } = await db
      .from("checklist_items")
      .upsert([{ user_id: user.id, item_key: key, checked_at: new Date().toISOString() }], {
        onConflict: "user_id,item_key",
      });
    if (error) throw new ApiError(500, "db_error", "Couldn't save that.");
  } else {
    const { error } = await db.from("checklist_items").delete().eq("user_id", user.id).eq("item_key", key);
    if (error) throw new ApiError(500, "db_error", "Couldn't save that.");
  }
  return json({ ok: true });
});
