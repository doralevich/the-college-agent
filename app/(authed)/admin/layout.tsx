import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isAdminEmail } from "@/config/admins";
import { AdminShell } from "@/components/admin/AdminShell";

// Secret, email-gated god-view. Not linked from anywhere — admins know the URL. Two
// layers protect it: the proxy bounces logged-out users to /login, and here a logged-in
// non-admin gets a hard notFound() so the route's existence never leaks. Auth is read
// from the session only (user.email), so it's agnostic to how login works.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getSession();
  if (!user) redirect("/login?next=/admin");
  if (!isAdminEmail(user.email)) notFound();

  return <AdminShell email={user.email ?? ""}>{children}</AdminShell>;
}
