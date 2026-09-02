import "server-only";
import { agent37 } from "@/lib/agent37";
import { DEFAULT_AGENT } from "@/config/agents";
import { ApiError } from "@/lib/http";

// Which Agent37 template to actually build a student's agent from.
//
// Not simply DEFAULT_AGENT.template, for one reason: renaming a template is TWO systems moving
// at different times — this repository and the Agent37 account — and a student who pays during
// that gap must still get an agent rather than a 409. So the preferred name is tried first and
// the former names after it, and the first one the registry actually carries wins.
//
// This matters more than usual right now. The default just moved from `college-agent` (the
// bespoke Hermes image) to `agent37-openclaw` (the Apollo build). Both are registered in the
// shared Agent37 account today — ApolloClaw provisions live instances from `agent37-openclaw`,
// and this app's existing boxes run `college-agent` — so the fallback is insurance against a
// future rename rather than a bet on one now.
//
// Refuses rather than guesses when NONE of them is registered. Provisioning from a template that
// doesn't exist gives a paying student a box with no openable ports, and a clear error an
// operator can act on beats a broken agent they have to discover.
export async function resolveTemplate(): Promise<string> {
  const candidates = [
    DEFAULT_AGENT.template,
    ...((DEFAULT_AGENT as { templateAliases?: readonly string[] }).templateAliases ?? []),
  ];

  let data: Awaited<ReturnType<typeof agent37.listTemplates>>["data"];
  try {
    ({ data } = await agent37.listTemplates());
  } catch (e) {
    throw new ApiError(
      502,
      "upstream_error",
      `Could not list Agent37 templates to verify "${DEFAULT_AGENT.template}" is registered: ${(e as Error).message}`
    );
  }

  const registered = new Set(data.map((t) => t.name));
  const found = candidates.find((name) => registered.has(name));
  if (!found) {
    throw new ApiError(
      409,
      "template_not_registered",
      `None of ${candidates.map((c) => `"${c}"`).join(", ")} is registered in this Agent37 account, ` +
        `so a provisioned agent would have no openable ports. Register the template, then retry.`
    );
  }
  // Loud on the fallback path: running on an alias means the registry and this repo disagree
  // about the current name, which someone should reconcile rather than discover months later.
  if (found !== DEFAULT_AGENT.template) {
    console.warn(
      `[agent-template] "${DEFAULT_AGENT.template}" is not registered; falling back to "${found}"`
    );
  }
  return found;
}
