import { NextResponse } from "next/server";
import { ambassadorBySlug } from "@/lib/ambassador";

// Ambassador share link: thecollegeagent.ai/r/{slug}. Sets the attribution cookie and
// forwards to the site. The cookie only attributes when no promotion code is entered
// at checkout — an explicitly entered code always wins (PRD attribution conflict rule).

export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const url = new URL(req.url);
  // Unknown/suspended slugs (or a database hiccup) still land somewhere useful,
  // just with no attribution cookie set.
  let amb = null;
  try {
    amb = await ambassadorBySlug(slug);
  } catch (err) {
    console.error("[/r] slug lookup failed", slug, err);
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
