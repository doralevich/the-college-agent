// Start provisioning and wait until the agent actually exists.
//
// Why not just `await fetch("/api/provision")`: that route creates an Agent37 box and then
// configures it, which can outlast the browser/platform request timeout. When the POST's
// connection drops, the SERVER STILL FINISHES — so awaiting it meant sitting on a spinner
// forever while the agent was already there, and only a manual refresh revealed it. That was
// the reported "it keeps spinning; hit refresh and the agent shows up".
//
// So the POST is fire-and-watch: kick it off, then poll a cheap readiness endpoint until the
// agent appears. Polling is the source of truth; the POST resolving is a bonus. This is safe
// because /api/provision is idempotent — it early-returns when the workspace already has an
// agent — so a retry or an overlapping call never provisions (or bills for) a second box.
//
// Client-only module: no server imports, safe in the browser bundle.

const POLL_MS = 3_000;
const TIMEOUT_MS = 5 * 60 * 1_000;

export type ProvisionResult = { ready: true } | { ready: false; error: string };

const SLOW_MESSAGE =
  "Your agent is taking longer than usual to come up. It may already be ready — refresh in a moment.";

// True once the signed-in user's workspace has an agent row. Never throws: a transient
// network blip mid-provision must not end the wait.
async function isReady(): Promise<boolean> {
  try {
    const res = await fetch("/api/provision/status", { cache: "no-store" });
    if (!res.ok) return false;
    const body = (await res.json()) as { ready?: boolean };
    return body?.ready === true;
  } catch {
    return false;
  }
}

export async function provisionAndWait(): Promise<ProvisionResult> {
  // Already provisioned (a retry, or a previous attempt whose response we never saw)?
  // Don't fire another request.
  if (await isReady()) return { ready: true };

  // Held in an object so the value assigned inside the callbacks below is readable in the
  // polling loop without tripping control-flow narrowing.
  const post: { error: string | null } = { error: null };

  const request = fetch("/api/provision", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  })
    .then(async (res) => {
      if (res.ok) return;
      const body = await res.json().catch(() => ({}));
      // A real server rejection (not paid, onboarding incomplete, template missing) —
      // worth surfacing straight away rather than polling for five minutes.
      post.error = body?.error?.message || `Couldn't build your agent (${res.status})`;
    })
    .catch((e) => {
      // A dropped/timed-out connection is EXPECTED on a slow provision and is not a
      // failure: the poll below is the real signal.
      console.warn("[provision] request did not resolve cleanly:", (e as Error).message);
    });
  // The request is watched via `post`; nothing awaits its rejection directly.
  void request;

  const deadline = Date.now() + TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (await isReady()) return { ready: true };
    if (post.error) return { ready: false, error: post.error };
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }

  // Timed out waiting. The box may still be coming up server-side, so word it as "check
  // back" rather than "failed" — and never claim it failed when we simply stopped looking.
  return { ready: false, error: post.error ?? SLOW_MESSAGE };
}
