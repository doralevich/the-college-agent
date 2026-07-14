import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { switchModelProvider } from "@/lib/hermes";
import { ApiError, json, readJson, route } from "@/lib/http";
import { encryptForStorage } from "@/lib/crypto/byo";

// Switch the student's agent between platform credits (metered gateway) and their own
// Anthropic/OpenAI API key. Repoints the LIVE box first — if that fails, nothing is
// persisted, so stored state never lies about what the box is doing.
export const maxDuration = 180; // exec + gateway restart can take a minute

export const POST = route(async (req) => {
  const { user } = await requireUser();
  const body = await readJson<{ provider?: string; key?: string }>(req);
  const provider = body.provider;
  if (provider !== "anthropic" && provider !== "openai" && provider !== "platform") {
    throw new ApiError(400, "invalid_request", "provider must be anthropic, openai, or platform");
  }

  let key = "";
  if (provider !== "platform") {
    key = (body.key ?? "").trim();
    // Loose shape check: both providers issue sk- prefixed keys. Catches paste accidents,
    // not forgeries — a wrong-but-plausible key surfaces as model errors in chat.
    if (!/^sk-[A-Za-z0-9_-]{16,}$/.test(key)) {
      throw new ApiError(400, "invalid_key", "That doesn't look like a valid API key.");
    }
  }

  const db = createAdminClient();
  const { data: ms } = await db.from("memberships").select("workspace_id").eq("user_id", user.id).limit(1);
  const workspaceId = ms?.[0]?.workspace_id as string | undefined;
  const { data: agents } = workspaceId
    ? await db
        .from("agents")
        .select("agent37_id")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: true })
        .limit(1)
    : { data: null };
  const agentId = agents?.[0]?.agent37_id as string | undefined;
  if (!agentId) throw new ApiError(400, "no_agent", "Create your agent first.");

  const target =
    provider === "platform"
      ? { provider: "platform" as const }
      : provider === "anthropic"
        ? { provider: "anthropic" as const, key }
        : { provider: "openai" as const, key };
  const result = await switchModelProvider(agentId, target);
  if (!result.ok) {
    throw new ApiError(502, "switch_failed", `Couldn't reconfigure your agent: ${result.detail}`);
  }

  // Persist on the latest setup row (or a fresh one) so re-provisioning keeps the choice.
  // Encrypted at rest (AES-256-GCM); encryptForStorage no-ops to plaintext until BYO_ENC_KEY
  // is set, so this switch keeps working before and after the env var lands.
  const patch = {
    anthropic_key: provider === "anthropic" ? encryptForStorage(key) : null,
    openai_key: provider === "openai" ? encryptForStorage(key) : null,
  };
  const { data: latest } = await db
    .from("setup_submissions")
    .select("id")
    .eq("user_id", user.id)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latest) {
    await db.from("setup_submissions").update(patch).eq("id", latest.id);
  } else {
    await db.from("setup_submissions").insert({ user_id: user.id, ...patch });
  }

  return json({ byo: provider === "platform" ? null : { provider } });
});
