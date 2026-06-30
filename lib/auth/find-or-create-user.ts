import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

type DB = ReturnType<typeof createAdminClient>;

// Find an auth.users row by email (case-insensitive), creating one with
// `email_confirm: true` if it doesn't exist. Shared between the Stripe webhook
// (creates accounts after payment) and /build/success (signs the student in
// without making them click a magic link in email).
//
// GoTrue's `listUsers` is paged; we cap at 50 pages (10k users) which is well
// above the current scale and bounds the worst-case work. If/when the user base
// grows past that, swap to a direct PostgREST query on auth.users via service
// role.
export async function findOrCreateAuthUser(
  db: DB,
  email: string,
  firstName: string | null,
  lastName: string | null
): Promise<{ userId: string | null; isNew: boolean }> {
  const wanted = email.toLowerCase();
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) break;
    const users = data?.users ?? [];
    if (users.length === 0) break;
    const hit = users.find((u) => (u.email ?? "").toLowerCase() === wanted);
    if (hit) return { userId: hit.id, isNew: false };
  }
  const { data: created, error: createErr } = await db.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      first_name: firstName ?? undefined,
      last_name: lastName ?? undefined,
      created_via: "stripe_checkout",
    },
  });
  if (createErr) {
    // Race: another path (webhook vs. success page) may have created the user
    // between our listUsers + createUser. Fall back to a fresh search.
    for (let page = 1; page <= 50; page++) {
      const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
      if (error) break;
      const users = data?.users ?? [];
      if (users.length === 0) break;
      const hit = users.find((u) => (u.email ?? "").toLowerCase() === wanted);
      if (hit) return { userId: hit.id, isNew: false };
    }
    console.error("[findOrCreateAuthUser] createUser failed", createErr.message);
    return { userId: null, isNew: false };
  }
  return { userId: created?.user?.id ?? null, isNew: true };
}
