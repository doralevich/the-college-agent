import { NextRequest, NextResponse } from "next/server";

// Server-side proxy for the College Scorecard typeahead used by the onboarding
// school picker. Frontend hits /api/schools?q=... — we forward to api.data.gov
// with the bearer key so the key never reaches the browser.
//
// Returns a slim list: [{ id, name, city, state }]. Caps results at 10.

type ScorecardSchool = {
  id: number;
  "school.name": string;
  "school.city": string;
  "school.state": string;
};

type ScorecardResponse = {
  results?: ScorecardSchool[];
};

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim();
  // The Scorecard endpoint accepts an empty `school.name` but it returns the
  // alphabetical first slice, which isn't useful for an interactive typeahead.
  // Short-circuit anything under 2 chars so we don't burn API quota on noise.
  if (q.length < 2) return NextResponse.json([]);

  const key = process.env.COLLEGE_SCORECARD_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "schools_not_configured", message: "COLLEGE_SCORECARD_API_KEY is not set on the server" },
      { status: 503 }
    );
  }

  const url = new URL("https://api.data.gov/ed/collegescorecard/v1/schools");
  url.searchParams.set("api_key", key);
  url.searchParams.set("school.name", q);
  url.searchParams.set("fields", "id,school.name,school.city,school.state");
  url.searchParams.set("per_page", "10");

  try {
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json(
        { error: "scorecard_error", status: res.status, message: text.slice(0, 240) },
        { status: 502 }
      );
    }
    const data = (await res.json()) as ScorecardResponse;
    const slim = (data.results ?? []).map((r) => ({
      id: r.id,
      name: r["school.name"],
      city: r["school.city"],
      state: r["school.state"],
    }));
    return NextResponse.json(slim);
  } catch (err) {
    return NextResponse.json(
      { error: "fetch_failed", message: (err as Error).message },
      { status: 502 }
    );
  }
}
