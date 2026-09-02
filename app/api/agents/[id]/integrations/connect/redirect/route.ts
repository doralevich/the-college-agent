import { NextResponse } from "next/server";
import { agent37, Agent37Error } from "@/lib/agent37";
import { requireAgentAccess } from "@/lib/auth";
import { route } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

function errorPage(message: string, status: number) {
  return new Response(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Could not connect app</title>
    <style>
      body { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; color: #111827; background: #fafafa; }
      main { max-width: 420px; margin: 16vh auto; padding: 0 24px; }
      h1 { font-size: 20px; margin: 0 0 8px; }
      p { color: #6b7280; line-height: 1.5; margin: 0; }
    </style>
  </head>
  <body>
    <main>
      <h1>Could not connect app</h1>
      <p>${message}</p>
    </main>
  </body>
</html>`,
    {
      status,
      headers: { "content-type": "text/html; charset=utf-8" },
    }
  );
}

// Opened in a new tab by the dashboard. This starts the managed OAuth flow server-side, then
// redirects the new tab to the provider's authorization URL so the dashboard tab can keep polling.
export const GET = route(async (request: Request, { params }: Ctx) => {
  const { id } = await params;
  await requireAgentAccess(id, "member");

  const url = new URL(request.url);
  const toolkit = url.searchParams.get("toolkit")?.trim();
  if (!toolkit) {
    return errorPage("No app was specified. You can close this tab.", 400);
  }
  // Composio slugs are lowercase alphanumerics plus underscores. Checking the shape here
  // rejects junk before it ever reaches the API, AND guarantees the slug is safe to
  // interpolate into the HTML below, since it can then contain no markup characters.
  if (!/^[a-z0-9_]+$/.test(toolkit)) {
    return errorPage("That app name isn't valid. You can close this tab.", 400);
  }

  try {
    const { redirectUrl } = await agent37.connectIntegration(id, { toolkit });
    return NextResponse.redirect(redirectUrl, 302);
  } catch (e) {
    // Some apps need a bring-your-own-credentials flow we don't expose to students.
    if (e instanceof Agent37Error && e.status === 422) {
      return errorPage("This app can't be connected here yet. You can close this tab.", 422);
    }
    // A slug our catalog lists but the upstream catalog doesn't have - a typo, or an app
    // that was renamed or withdrawn. This used to `throw`, and because this endpoint is
    // opened DIRECTLY IN A BROWSER TAB the JSON error wrapper rendered as a blank/garbage
    // page: the "clicked connect and it went to nothing" report. A browser-facing endpoint
    // must always answer with a readable page, so every failure below renders one.
    if (e instanceof Agent37Error && (e.status === 400 || e.status === 404)) {
      return errorPage(
        `We could not connect "${toolkit}". That app is not in our provider's catalog - it may have been renamed, or it is not supported yet. Please let us know so we can fix it. You can close this tab.`,
        404
      );
    }
    return errorPage(
      "Something went wrong starting this connection. Please close this tab and try again.",
      502
    );
  }
});
