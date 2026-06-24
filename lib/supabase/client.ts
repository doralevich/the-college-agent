import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Sign out and hard-redirect to /login. Shared by every sign-out affordance so the
// post-logout destination stays in one place.
export async function signOut() {
  await createClient().auth.signOut();
  window.location.href = "/login";
}
