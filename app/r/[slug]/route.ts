import { NextResponse } from "next/server";
import { AMBASSADOR_PROGRAM_ENABLED, ambassadorBySlug } from "@/lib/ambassador";

// Ambassador share link: thecollegeagent.ai/r/{slug}. Sets the attribution cookie and
// forwards to the site. The cookie only attributes when no promotion code is entered
// at checkout — an explicitly entered code always wins (PRD attribution conflict rule).

export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const url = new URL(req.url);
  // Unknown/suspended slugs (or a database hiccup) still land somewhere useful,
  // just with no attribution cookie set.
  // While the program is off (lib/ambassador.ts) a share link still WORKS - it just carries
  // no attribution. Links are printed on flyers and pasted into group chats; breaking them
  // would strand people on a 404 for a decision they had no part in, and the existing
  // unknown-slug path already lands them somewhere useful.
  let amb = null;
  if (AMBASSADOR_PROGRAM_ENABLED) {
    try {
      amb = await ambassadorBySlug(slug);
    } catch (err) {
      console.error("[/r] slug lookup failed", slug, err);
    }
  }

  // Known ambassadors route into the personalized demo (PRD); unknown slugs go home.
  const res = NextResponse.redirect(new URL(amb ? "/demo" : "/", url.origin), { status: 302 });
  if (amb) {
    res.cookies.set("ca_amb", amb.referral_slug ?? slug.toLowerCase(), {
      maxAge: 60 * 60 * 24 * 90, // 90 days
      path: "/",
      sameSite: "lax",
      httpOnly: true,
    });
  }
  return res;
}
