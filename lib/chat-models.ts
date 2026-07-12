import type { AgentModel, ModelsResponse } from "@/lib/types";

// Product-level model catalog. Agent37's managed gateway exposes hundreds of models; The College
// Agent intentionally offers only the current Anthropic and OpenAI families below.
export const DEFAULT_CHAT_MODEL_ID = "anthropic/claude-sonnet-5";

const APPROVED_MODELS = [
  { ids: [DEFAULT_CHAT_MODEL_ID, "claude-sonnet-5"], label: "Claude Sonnet 5", displayProvider: "anthropic" },
  { ids: ["anthropic/claude-opus-4.8", "claude-opus-4-8"], label: "Claude Opus 4.8", displayProvider: "anthropic" },
  { ids: ["anthropic/claude-haiku-4.5", "claude-haiku-4-5", "claude-haiku-4-5-20251001"], label: "Claude Haiku 4.5", displayProvider: "anthropic" },
  { ids: ["openai/gpt-5.6-sol", "gpt-5.6-sol"], label: "GPT-5.6 Sol", displayProvider: "openai" },
  { ids: ["openai/gpt-5.6-terra", "gpt-5.6-terra"], label: "GPT-5.6 Terra", displayProvider: "openai" },
  { ids: ["openai/gpt-5.6-luna", "gpt-5.6-luna"], label: "GPT-5.6 Luna", displayProvider: "openai" },
] as const;

const approvedIds = new Set<string>(APPROVED_MODELS.flatMap((model) => [...model.ids]));

export function isApprovedChatModelId(id: string): boolean {
  return approvedIds.has(id);
}

// Keep only models the live instance actually reports, while applying stable product labels and
// ordering. `owned_by` remains the transport provider sent back to Agent37; `display_provider`
// controls the Anthropic/OpenAI grouping in our UI.
export function curateModelsResponse(response: ModelsResponse): ModelsResponse {
  const available = new Map((response.data ?? []).map((model) => [model.id, model]));
  const data: AgentModel[] = APPROVED_MODELS.flatMap((approved) => {
    // Managed Agent37 ids are vendor-prefixed; direct BYO providers expose native ids. Select
    // whichever form this instance reports so the same product catalog works in both modes.
    const upstream = approved.ids.map((id) => available.get(id)).find(Boolean);
    if (!upstream) return [];
    return [{
      ...upstream,
      label: approved.label,
      display_provider: approved.displayProvider,
      is_default: approved === APPROVED_MODELS[0],
    }];
  });

  const defaultModel = data[0]?.id ?? null;
  const selected = data.find((model) => model.id === defaultModel);

  return {
    default_model: defaultModel,
    default_provider: selected?.owned_by ?? selected?.provider ?? response.default_provider,
    data,
  };
}
