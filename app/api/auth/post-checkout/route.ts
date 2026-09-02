import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createSsrClient } from "@/lib/supabase/server";
import { findOrCreateAuthUser } from "@/lib/auth/find-or-create-user";

// Post-Stripe auto-signin. /build/success redirects the browser here with the
// Stripe session_id. We:
//   1. Resolve the customer email from the Stripe session.
//   2. Find or create the auth.users row (idempotent with the webhook).
//   3. Use the admin SDK to generate a magic-link, then verifyOtp() on the
//      cookie-aware server client to actually set the Supabase session cookies.
//   4. 302 to the set-password screen — the student lands already signed in (no email
//      click) and picks a password there, so they can sign in normally next time.
//
// Why the set-password stop matters: findOrCreateAuthUser creates the account with NO
// password (magic-link only). Before this, checkout dropped the student straight on
// /dashboard, so the only way they could ever get back in was "Forgot password?" — the
// one screen in the app that calls updateUser({password}). Routing them through it once,
// while they already hold a real session, closes that gap. It's a stop, not a wall: the
// screen has a "skip for now" path to the dashboard.
//
// Route Handler (not a Server Component) because we need WRITABLE cookies for
// the verifyOtp call. Anything that fails along the way redirects to /dashboard;
// the dashboard's existing auth gate handles the unsigned-in case the same way
// it always has.

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("session_id");
  const dashboard = new URL("/dashboard", url);
  // Success target: the same screen the recovery flow uses, in first-run wording.
  // `welcome=1` switches the copy from "Reset password" to "Set your password".
  const setPassword = new URL("/reset-password?welcome=1", url);

  if (!sessionId) return NextResponse.redirect(dashboard);

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const email = (
      session.customer_email ||
      session.customer_details?.email ||
      ""
    )
      .trim()
      .toLowerCase();
    if (!email) return NextResponse.redirect(dashboard);

    const firstName = ((session.metadata?.first_name as string | undefined) || "").trim() || null;
    const lastName = ((session.metadata?.last_name as string | undefined) || "").trim() || null;

    const admin = createAdminClient();
    const { userId } = await findOrCreateAuthUser(admin, email, firstName, lastName);
    if (!userId) return NextResponse.redirect(dashboard);

    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    const tokenHash = linkData?.properties?.hashed_token;
    if (linkErr || !tokenHash) {
      console.error("[post-checkout] generateLink failed", linkErr?.message);
      return NextResponse.redirect(dashboard);
    }

    // verifyOtp on the SSR cookie client writes the access + refresh cookies on
    // this response; the next request to /dashboard sees a fully-authenticated
    // session.
    const supabase = await createSsrClient();
    const { error: verifyErr } = await supabase.auth.verifyOtp({
      type: "magiclink",
      token_hash: tokenHash,
    });
    if (verifyErr) {
      console.error("[post-checkout] verifyOtp failed", verifyErr.message);
      return NextResponse.redirect(dashboard);
    }

    // Signed in. Send them to pick a password rather than straight to the dashboard —
    // this is the only moment they hold a session without yet having a credential.
    return NextResponse.redirect(setPassword);
  } catch (err) {
    console.error("[post-checkout] error", err);
    return NextResponse.redirect(dashboard);
  }
}
