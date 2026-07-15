import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isAdminEmail } from "@/config/admins";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminMfaGate } from "@/components/admin/AdminMfaGate";

// Secret, email-gated god-view. Not linked from anywhere — admins know the URL. Three
// layers protect it: the proxy bounces logged-out users to /login; here a logged-in
// non-admin gets a hard notFound() so the route's existence never leaks; and admins must
// clear a second factor (TOTP) before the tools render. Auth is read from the session
// only (user.email), so it's agnostic to how login works.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await getSession();
  if (!user) redirect("/login?next=/admin");
  if (!isAdminEmail(user.email)) notFound();

  // Enforced second factor. `getAuthenticatorAssuranceLevel()` decodes the session JWT
  // locally. Until the admin steps up to aal2 we render the MFA gate in place of the
  // tools — the gate walks a first-time admin through TOTP enrollment, and a returning
  // admin through the code challenge. On success it refreshes this server layout, which
  // now sees aal2 and renders the god-view. `nextLevel` tells enroll from challenge:
  // 'aal1' = no verified factor yet (enroll); 'aal2' = has one, needs the code.
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const steppedUp = aal?.currentLevel === "aal2";

  return (
    <AdminShell email={user.email ?? ""}>
      {steppedUp ? children : <AdminMfaGate needsEnrollment={aal?.nextLevel !== "aal2"} />}
    </AdminShell>
  );
}
