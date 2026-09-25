import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createSsrClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/config/admins";

// Sign in, skip the password. That is the whole route.
//
//   /davidtest?k=SECRET   ->  signed in as the admin, on Chat
//
// It signs in as an account that ALREADY EXISTS and already works - by default
// daveo@designsbydaveo.com, which has an active entitlement, a finished intake and a
// running agent. Nothing is created, seeded or provisioned here.
//
// The first version of this built a fake student instead: new auth user, forged
// entitlement, seeded intake, seeded setup row, and then a "Create my agent" click to
// provision a box. That was the wrong shape - it rebuilt a whole student rather than
// opening a door, and it still did not reach a working chat. The account to test with was
// sitting there the whole time.
//
// STILL GATED ON A SECRET, and off entirely until one is set. This signs someone into a
// real admin account with a live agent behind it, no password asked; the key is the only
// thing standing between a guessed URL and that account. With TEST_LOGIN_SECRET unset it
// 404s, so it is inert anywhere that has not opted in.
//
// Route Handler rather than a page because verifyOtp needs WRITABLE cookies.

export const dynamic = "force-dynamic";

const DEFAULT_EMAIL = "daveo@designsbydaveo.com";

export async function GET(req: NextRequest) {
  const secret = process.env.TEST_LOGIN_SECRET;
  const url = new URL(req.url);

  // No secret configured, or the wrong one: behave exactly as if the route does not
  // exist. Identical response either way, so it cannot be probed for whether it is live.
  if (!secret || url.searchParams.get("k") !== secret) {
    return new NextResponse("Not found", { status: 404 });
  }

  const email = (process.env.TEST_LOGIN_EMAIL || DEFAULT_EMAIL).trim().toLowerCase();

  // Only ever an admin. Without this, a mistyped TEST_LOGIN_EMAIL would turn the route
  // into "sign in as any student you can name", which is a different and much worse thing
  // than what it is for.
  if (!isAdminEmail(email)) {
    console.error("[davidtest] refused: not an admin email");
    return new NextResponse("Test login is only available for admin accounts.", { status: 403 });
  }

  try {
    const admin = createAdminClient();

    // Mint a magic link and redeem it here, rather than mailing it. verifyOtp on the
    // cookie-aware client writes the session cookies onto this response. Same mechanism
    // /build/success uses to sign a student in straight after checkout.
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    const tokenHash = linkData?.properties?.hashed_token;
    if (linkErr || !tokenHash) {
      console.error("[davidtest] generateLink failed", linkErr?.message);
      return new NextResponse(`Test login failed: ${linkErr?.message ?? "no account for that email"}`, {
        status: 500,
      });
    }

    const supabase = await createSsrClient();
    const { error: verifyErr } = await supabase.auth.verifyOtp({
      type: "magiclink",
      token_hash: tokenHash,
    });
    if (verifyErr) {
      console.error("[davidtest] verifyOtp failed", verifyErr.message);
      return new NextResponse(`Test login failed: ${verifyErr.message}`, { status: 500 });
    }

    return NextResponse.redirect(new URL("/dashboard/chat", url));
  } catch (err) {
    console.error("[davidtest] error", err);
    return new NextResponse("Test login failed. Check the server logs.", { status: 500 });
  }
}
