import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/config/admins";
import { ApiError } from "@/lib/http";
import type { AgentRow, Role } from "@/lib/types";

export type DB = Awaited<ReturnType<typeof createClient>>;
// Either the user-scoped (RLS) client or the service-role client — `getAgentRow` reads
// the same `agents` row regardless of which one resolved the caller.
type AnyDB = DB | ReturnType<typeof createAdminClient>;

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function requireUser() {
  const { supabase, user } = await getSession();
  if (!user) throw new ApiError(401, "unauthorized", "Sign in required");
  return { supabase, user };
}

// Enforced admin second factor. Platform admins must have completed a TOTP challenge
// *this session* — i.e. the access token's assurance level is `aal2` — before any admin
// privilege is honored. `getAuthenticatorAssuranceLevel()` decodes the JWT locally (no
// network round-trip), so this is cheap enough to call on every admin request. Throws a
// distinct `mfa_required` 403 so the caller can tell "not an admin" from "step up first".
// An admin with no factor yet is at `aal1`; the /admin console walks them through
// enrollment (see AdminMfaGate), so this never deadlocks — the enroll/verify calls go
// straight to Supabase Auth, not through our admin routes.
export async function assertStepUp(db: DB): Promise<void> {
  const { data, error } = await db.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) throw new ApiError(500, "mfa_error", error.message);
  if (data?.currentLevel !== "aal2") {
    throw new ApiError(403, "mfa_required", "Two-factor step-up required for admin access.");
  }
}

// Resolve the logged-in user's id without throwing — for public routes that accept
// both authenticated and anonymous submissions. Returns null when there's no session
// or the auth client can't be constructed.
export async function getOptionalUserId(): Promise<string | null> {
  try {
    const { user } = await getSession();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

export async function getRole(db: DB, workspaceId: string, userId: string): Promise<Role | null> {
  const { data } = await db
    .from("memberships")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();
  return (data?.role as Role) ?? null;
}

// 404 (not 403) so we don't leak whether the workspace exists.
export async function requireMember(db: DB, workspaceId: string, userId: string): Promise<Role> {
  const role = await getRole(db, workspaceId, userId);
  if (!role) throw new ApiError(404, "not_found", "Workspace not found");
  return role;
}

export async function requireAdmin(db: DB, workspaceId: string, userId: string): Promise<void> {
  const role = await getRole(db, workspaceId, userId);
  if (role !== "admin") throw new ApiError(403, "forbidden", "Admin role required");
}

// v1 entitlement gate (allowlist). `can_create_agent()` (SECURITY DEFINER) checks the
// caller's JWT email against public.entitlements. Apply to EVERY spend-increasing action
// — not just create — so the gate still holds once Stripe makes entitlements revocable.
// This is the single seam Stripe later fills (allowlist -> active subscription).
export async function requireEntitled(db: DB): Promise<void> {
  const { data: allowed, error } = await db.rpc("can_create_agent");
  if (error) throw new ApiError(500, "db_error", error.message);
  if (!allowed) throw new ApiError(403, "forbidden", "Your account isn't approved for this yet.");
}

export async function getAgentRow(db: AnyDB, agent37Id: string): Promise<AgentRow> {
  const { data } = await db.from("agents").select("*").eq("agent37_id", agent37Id).maybeSingle();
  if (!data) throw new ApiError(404, "not_found", "Agent not found");
  return data as AgentRow;
}

// The auth preamble every per-agent route shares: authenticate, resolve the agent's
// row, then enforce the workspace role. Returns the pieces handlers go on to use.
//
// Platform admins (operators) get a cross-tenant bypass: they run the /admin god-view
// and need to open, inspect, and manage any student's agent — workspaces they don't
// belong to. Their row is read with the service-role client (RLS would otherwise hide
// other tenants' rows), and the membership check is skipped. `isPlatformAdmin` lets
// downstream handlers relax user-scoped gates (e.g. the entitlement check) for operators.
export async function requireAgentAccess(agent37Id: string, level: "member" | "admin") {
  const { supabase, user } = await requireUser();

  if (isAdminEmail(user.email)) {
    // The cross-tenant god-view bypass is an admin privilege, so it too requires the
    // second factor — an admin operating at aal1 gets no more reach than a normal user.
    await assertStepUp(supabase);
    const row = await getAgentRow(createAdminClient(), agent37Id);
    return { supabase, user, row, isPlatformAdmin: true as const };
  }

  const row = await getAgentRow(supabase, agent37Id);
  if (level === "admin") await requireAdmin(supabase, row.workspace_id, user.id);
  else await requireMember(supabase, row.workspace_id, user.id);
  return { supabase, user, row, isPlatformAdmin: false as const };
}

export async function getWorkspaceOwner(db: DB, workspaceId: string): Promise<string | null> {
  const { data } = await db.from("workspaces").select("owner_id").eq("id", workspaceId).maybeSingle();
  return (data?.owner_id as string) ?? null;
}
