import { sweepCheckins } from "@/lib/checkin-schedules";

// Hourly proactive check-in sweep (Vercel cron, see vercel.json), protected by CRON_SECRET —
// Vercel sends it as `Authorization: Bearer <CRON_SECRET>` automatically, same as credits-watch.
//
// Runs every hour and fires only the schedules whose LOCAL hour has just arrived, so a student
// in California gets their 8am at their 8am rather than the box's UTC midnight. The per-run
// guard against double-firing lives in the row (last_run_on) rather than here, so a retry or an
// overlapping invocation cannot send a student two check-ins.
//
// Each due schedule is a full agent turn, so this can take a while at 8am when they cluster;
// the sweep is sequential and the timeout is set accordingly.
export const maxDuration = 300;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return new Response("cron secret not configured", { status: 503 });
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("unauthorized", { status: 401 });
  }

  try {
    const summary = await sweepCheckins();
    console.log("[cron:checkins]", JSON.stringify(summary));
    return Response.json({ ok: true, ...summary });
  } catch (err) {
    // A failed sweep must be visible: this is the only thing that makes check-ins arrive, and a
    // silent failure looks exactly like "no schedules were due".
    const message = (err as Error).message;
    console.error("[cron:checkins] sweep failed:", message);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
