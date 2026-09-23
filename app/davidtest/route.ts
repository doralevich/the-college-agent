import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createSsrClient } from "@/lib/supabase/server";
import { findOrCreateAuthUser } from "@/lib/auth/find-or-create-user";
import { getUserWorkspaces } from "@/lib/workspaces";

// A back door onto the finished product, for testing.
//
// The real way in is /build -> Stripe -> account -> a nineteen-question intake -> connect
// email and calendar. That is the right funnel for a student and far too long to walk every
// time you want to look at the chat page. This drops you straight into a signed-in, paid,
// fully-onboarded dashboard.
//
//   /davidtest?k=SECRET                -> signed in, onboarding done, lands on Chat
//   /davidtest?k=SECRET&step=onboard   -> signed in and paid, intake CLEARED, lands on the
//                                         questions (for testing the intake itself)
//
// It is IDEMPOTENT: one fixed account, one workspace, one agent, reused on every visit. That
// is deliberate - the alternative, minting a new student per visit, is what produced the test
// rows and orphaned Agent37 boxes that had to be cleaned out by hand.
//
// GATED ON A SECRET, and off entirely until one is set. This route hands out a paid account
// on a $25/month product, and the agent behind it can reach whatever the account has
// connected; a guessable path would be a giveaway and a data-exposure route both. With
// TEST_LOGIN_SECRET unset it 404s, so it is inert in any environment that has not opted in.
//
// Route Handler rather than a page because verifyOtp needs WRITABLE cookies.

export const dynamic = "force-dynamic";

const DEFAULT_EMAIL = "davidtest@thecollegeagent.ai";

// A plausible student, so the seeded agent has a real persona to build from and the chat
// greeting has classes to show rather than rendering its empty case.
function seedIntake(email: string, firstName: string, lastName: string) {
  return {
    firstName,
    lastName,
    schoolEmail: email,
    personalEmail: "",
    phone: "555-0100",
    school: "Penn State University",
    year: "Sophomore",
    major: "Business",
    minor: "Computer Science",
    agentName: "Theo",
    classes: [
      { name: "Intro to Marketing", days: "Mon / Wed", time: "9:00 AM" },
      { name: "Statistics 200", days: "Tue / Thu", time: "11:00 AM" },
      { name: "Financial Accounting", days: "Mon / Wed / Fri", time: "2:00 PM" },
    ],
    goals: "Land a summer internship and keep a 3.5.",
    clubs: "Student Government, intramural soccer",
    greekLife: "No",
    workingHours: "Evenings after 6",
    seededBy: "davidtest",
  };
}

export async function GET(req: NextRequest) {
  const secret = process.env.TEST_LOGIN_SECRET;
  const url = new URL(req.url);

  // No secret configured, or the wrong one supplied: behave exactly as if the route does
  // not exist. Same response either way, so this cannot be used to probe whether the
  // feature is switched on.
  if (!secret || url.searchParams.get("k") !== secret) {
    return new NextResponse("Not found", { status: 404 });
  }

  const email = (process.env.TEST_LOGIN_EMAIL || DEFAULT_EMAIL).trim().toLowerCase();
  const firstName = (process.env.TEST_LOGIN_FIRST_NAME || "David").trim();
  const lastName = "Test";
  const wantsIntake = url.searchParams.get("step") === "onboard";

  const fail = (stage: string, detail?: string) => {
    console.error(`[davidtest] ${stage} failed`, detail ?? "");
    return new NextResponse(`Test login failed at: ${stage}`, { status: 500 });
  };

  try {
    const admin = createAdminClient();

    const { userId } = await findOrCreateAuthUser(admin, email, firstName, lastName);
    if (!userId) return fail("create account");

    // Paid. entitlements is keyed by email, and `source` marks the row as ours so it is
    // obvious in the admin list that this is not a real customer.
    const { error: entErr } = await admin
      .from("entitlements")
      .upsert({ email, status: "active", source: "test", user_id: userId, note: "davidtest" }, { onConflict: "email" });
    if (entErr) return fail("entitlement", entErr.message);

    // A workspace, if this is the first visit. Through the dashboard's own bootstrap rather
    // than a hand-rolled insert: the membership row is written by an AFTER INSERT trigger on
    // workspaces (handle_new_workspace), so inserting one here by hand would both duplicate
    // the trigger's row and use the wrong role - `memberships.role` is CHECKed to 'admin'.
    // Doing it now rather than leaving it to the layout also avoids a first-load race where
    // the page's agent lookup runs before the workspace exists.
    const workspaces = await getUserWorkspaces(userId);
    if (!workspaces.length) return fail("workspace");

    if (wantsIntake) {
      // Testing the questions themselves: drop the answers so the dashboard shows the
      // intake again. The agent, if one exists, is left alone - re-running the intake
      // reconfigures it rather than building a second one.
      const { error } = await admin.from("onboard_submissions").delete().eq("user_id", userId);
      if (error) return fail("clear intake", error.message);
    } else {
      const intake = seedIntake(email, firstName, lastName);
      const { error } = await admin.from("onboard_submissions").upsert(
        {
          user_id: userId,
          first_name: intake.firstName,
          last_name: intake.lastName,
          school_email: intake.schoolEmail,
          personal_email: null,
          phone: intake.phone,
          school: intake.school,
          agent_name: intake.agentName,
          year: intake.year,
          major: intake.major,
          questionnaire: intake,
          submitted_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
      if (error) return fail("seed intake", error.message);
    }

    // Sign the browser in without an email round-trip: mint a magic link, then redeem it
    // here. verifyOtp on the cookie-aware client writes the session cookies onto this
    // response. Same mechanism /build/success uses after checkout.
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    const tokenHash = linkData?.properties?.hashed_token;
    if (linkErr || !tokenHash) return fail("generate link", linkErr?.message);

    const supabase = await createSsrClient();
    const { error: verifyErr } = await supabase.auth.verifyOtp({
      type: "magiclink",
      token_hash: tokenHash,
    });
    if (verifyErr) return fail("sign in", verifyErr.message);

    // Chat when it is ready to use; the dashboard root when the point is to walk the
    // intake. The dashboard provisions the agent itself on first load once paid and
    // onboarded, so there is no Agent37 call here.
    return NextResponse.redirect(new URL(wantsIntake ? "/dashboard" : "/dashboard/chat", url));
  } catch (err) {
    return fail("unexpected", err instanceof Error ? err.message : String(err));
  }
}
