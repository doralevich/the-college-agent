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
// Ownership is checked FIRST, via the caller's RLS-scoped client: it returns a row only
// for a workspace the caller actually belongs to. This is the path a normal student takes
// — AND the path a platform admin takes when they open THEIR OWN agent (they're also a
// student here). Critically, that means an admin using their own agent is NEVER blocked
// behind the admin second factor: MFA step-up gates the cross-tenant operator god-view,
// not a person chatting with the agent they paid for.
//
// Only when the caller is NOT a member of the agent's workspace do platform admins fall
// through to the cross-tenant bypass: the /admin god-view over any student's agent. That
// IS an admin privilege, so it requires aal2 (step-up), and the row is read with the
// service-role client (RLS would otherwise hide other tenants' rows). `isPlatformAdmin`
// is therefore true only for genuine cross-tenant access, letting downstream handlers
// relax user-scoped gates (e.g. the entitlement check) for operators.
export async function requireAgentAccess(agent37Id: string, level: "member" | "admin") {
  const { supabase, user } = await requireUser();

  // Member-first: does the caller belong to this agent's workspace? (RLS-scoped read.)
  const { data: ownRow } = await supabase
    .from("agents")
    .select("*")
    .eq("agent37_id", agent37Id)
    .maybeSingle();
  if (ownRow) {
    const row = ownRow as AgentRow;
    if (level === "admin") await requireAdmin(supabase, row.workspace_id, user.id);
    else await requireMember(supabase, row.workspace_id, user.id);
    return { supabase, user, row, isPlatformAdmin: false as const };
  }

  // Not a member. Platform admins get the cross-tenant god-view — an admin privilege, so
  // it requires the second factor (aal2). Their row is read with the service-role client.
  if (isAdminEmail(user.email)) {
    await assertStepUp(supabase);
    const row = await getAgentRow(createAdminClient(), agent37Id);
    return { supabase, user, row, isPlatformAdmin: true as const };
  }

  // Non-admin, non-member: 404 (don't leak whether the agent exists).
  throw new ApiError(404, "not_found", "Agent not found");
}

export async function getWorkspaceOwner(db: DB, workspaceId: string): Promise<string | null> {
  const { data } = await db.from("workspaces").select("owner_id").eq("id", workspaceId).maybeSingle();
  return (data?.owner_id as string) ?? null;
}
