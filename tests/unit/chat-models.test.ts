import { describe, expect, it, vi } from "vitest";
import { loadChatModelsWithRetry } from "../../components/chat/useChatModels";
import { curateModelsResponse, DEFAULT_CHAT_MODEL_ID, isApprovedChatModelId } from "../../lib/chat-models";
import type { ModelsResponse } from "../../lib/types";

const upstream: ModelsResponse = {
  default_model: "default",
  default_provider: "custom:Agent37",
  data: [
    { id: "default", label: "default", owned_by: "custom:agent37", is_default: true },
    { id: "google/gemini-3.5-flash", label: "google/gemini-3.5-flash", owned_by: "custom:agent37" },
    { id: "z-ai/glm-5.2", label: "z-ai/glm-5.2", owned_by: "custom:agent37" },
    { id: "openai/gpt-5.6-luna", label: "openai/gpt-5.6-luna", owned_by: "custom:agent37" },
    { id: "openai/gpt-5.6-sol", label: "openai/gpt-5.6-sol", owned_by: "custom:agent37" },
    { id: "openai/gpt-5.6-terra", label: "openai/gpt-5.6-terra", owned_by: "custom:agent37" },
    { id: "anthropic/claude-sonnet-5", label: "anthropic/claude-sonnet-5", owned_by: "custom:agent37" },
    { id: "anthropic/claude-opus-4.8", label: "anthropic/claude-opus-4.8", owned_by: "custom:agent37" },
    { id: "anthropic/claude-haiku-4.5", label: "anthropic/claude-haiku-4.5", owned_by: "custom:agent37" },
  ],
};

describe("curateModelsResponse", () => {
  it("keeps only approved models, applies product labels, and defaults to GLM 5.2", () => {
    const result = curateModelsResponse(upstream);

    expect(result.default_model).toBe(DEFAULT_CHAT_MODEL_ID);
    expect(result.data.map((model) => model.id)).toEqual([
      "z-ai/glm-5.2",
      "anthropic/claude-sonnet-5",
      "anthropic/claude-opus-4.8",
      "anthropic/claude-haiku-4.5",
      "openai/gpt-5.6-sol",
      "openai/gpt-5.6-terra",
      "openai/gpt-5.6-luna",
    ]);
    expect(result.data[0]).toMatchObject({
      label: "GLM 5.2",
      display_provider: "z-ai",
      owned_by: "custom:agent37",
      is_default: true,
    });
  });

  it("falls back to the first available approved model", () => {
    const result = curateModelsResponse({ ...upstream, data: [upstream.data[3]] });
    expect(result.default_model).toBe("openai/gpt-5.6-luna");
  });
});

describe("isApprovedChatModelId", () => {
  it("accepts the product catalog and rejects other gateway models", () => {
    expect(isApprovedChatModelId("z-ai/glm-5.2")).toBe(true);
    expect(isApprovedChatModelId("openai/gpt-5.6-sol")).toBe(true);
    expect(isApprovedChatModelId("claude-sonnet-5")).toBe(true);
    expect(isApprovedChatModelId("google/gemini-3.5-flash")).toBe(false);
  });
});

describe("loadChatModelsWithRetry", () => {
  it("recovers when a newly created agent is not ready for its first model requests", async () => {
    const ready: ModelsResponse = {
      default_model: DEFAULT_CHAT_MODEL_ID,
      default_provider: "custom:Agent37",
      data: [
        {
          id: DEFAULT_CHAT_MODEL_ID,
          label: "GLM 5.2",
          owned_by: "custom:agent37",
          display_provider: "z-ai",
          is_default: true,
        },
      ],
    };
    const fetchModels = vi
      .fn<() => Promise<ModelsResponse>>()
      .mockRejectedValueOnce(new Error("instance returned 404 while starting"))
      .mockResolvedValueOnce({ ...ready, default_model: null, data: [] })
      .mockResolvedValueOnce(ready);
    const wait = vi.fn<(delayMs: number) => Promise<void>>().mockResolvedValue(undefined);

    const result = await loadChatModelsWithRetry(fetchModels, {
      retryDelaysMs: [1_000, 2_000],
      wait,
    });

    expect(fetchModels).toHaveBeenCalledTimes(3);
    expect(wait).toHaveBeenNthCalledWith(1, 1_000);
    expect(wait).toHaveBeenNthCalledWith(2, 2_000);
    expect(result?.defaultModel).toBe(DEFAULT_CHAT_MODEL_ID);
    expect(result?.groups).toEqual([
      {
        provider: "z-ai",
        models: [{ id: DEFAULT_CHAT_MODEL_ID, label: "GLM 5.2", provider: "custom:agent37" }],
      },
    ]);
  });
});
