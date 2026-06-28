import { NextResponse } from "next/server";
import { agent37, Agent37Error } from "@/lib/agent37";
import { requireAgentAccess } from "@/lib/auth";
import { ApiError, route } from "@/lib/http";

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
    throw new ApiError(400, "invalid_request", "toolkit is required");
  }

  try {
    const { redirectUrl } = await agent37.connectIntegration(id, { toolkit });
    return NextResponse.redirect(redirectUrl, 302);
  } catch (e) {
    // Some apps need a bring-your-own-credentials flow we don't expose to students.
    if (e instanceof Agent37Error && e.status === 422) {
      return errorPage("This app can't be connected here yet. You can close this tab.", 422);
    }
    throw e;
  }
});
