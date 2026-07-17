"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { ModelsResponse } from "@/lib/types";
import type { ModelGroup, ModelOption } from "./types";

export interface ChatModelsState {
  groups: ModelGroup[];
  defaultModel: string | null;
  loading: boolean;
}

const MODEL_FETCH_RETRY_DELAYS_MS = [1_000, 2_000, 4_000, 8_000, 15_000] as const;

interface LoadChatModelsOptions {
  retryDelaysMs?: readonly number[];
  wait?: (delayMs: number) => Promise<void>;
  cancelled?: () => boolean;
}

function modelsState(response: ModelsResponse): ChatModelsState {
  const byProvider = new Map<string, ModelOption[]>();
  for (const model of response.data ?? []) {
    // The display provider groups the curated catalog by vendor. Keep the gateway's actual
    // provider on the option because that is what POST /v1/responses expects.
    const provider = model.owned_by ?? model.provider ?? "model";
    const displayProvider = model.display_provider ?? provider;
    const models = byProvider.get(displayProvider) ?? [];
    models.push({ id: model.id, label: model.label, provider });
    byProvider.set(displayProvider, models);
  }

  // Prefer the explicit default; fall back to whichever model is flagged is_default.
  const defaultModel = response.default_model ?? (response.data ?? []).find((model) => model.is_default)?.id ?? null;
  const groups = [...byProvider.entries()].map(([provider, models]) => ({ provider, models }));
  // Open the menu on the default model's provider: float the group that owns it to the top.
  if (defaultModel) {
    groups.sort((a, b) => {
      const aHas = a.models.some((model) => model.id === defaultModel) ? 0 : 1;
      const bHas = b.models.some((model) => model.id === defaultModel) ? 0 : 1;
      return aHas - bHas;
    });
  }

  return { groups, defaultModel, loading: false };
}

// A newly provisioned instance can report 404/empty while its gateway is still starting. Retry
// that short readiness window so one early request cannot hide the model picker for the entire
// mounted dashboard session.
export async function loadChatModelsWithRetry(
  fetchModels: () => Promise<ModelsResponse>,
  options: LoadChatModelsOptions = {}
): Promise<ChatModelsState | null> {
  const retryDelaysMs = options.retryDelaysMs ?? MODEL_FETCH_RETRY_DELAYS_MS;
  const wait = options.wait ?? ((delayMs) => new Promise<void>((resolve) => setTimeout(resolve, delayMs)));
  const cancelled = options.cancelled ?? (() => false);
  let lastEmptyState: ChatModelsState | null = null;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retryDelaysMs.length; attempt += 1) {
    if (cancelled()) return null;
    try {
      const next = modelsState(await fetchModels());
      if (cancelled()) return null;
      if (next.groups.some((group) => group.models.length > 0)) return next;
      lastEmptyState = next;
      lastError = undefined;
    } catch (error) {
      if (cancelled()) return null;
      lastError = error;
    }

    if (attempt < retryDelaysMs.length) await wait(retryDelaysMs[attempt]);
  }

  if (lastError !== undefined) throw lastError;
  return lastEmptyState ?? { groups: [], defaultModel: null, loading: false };
}

// Loads the agent's available models (GET /v1/models) and groups them by provider for the
// composer's model switcher. Persistent failures degrade to an empty list (the default still runs).
export function useChatModels(agentId: string): ChatModelsState {
  const [state, setState] = useState<ChatModelsState>({
    groups: [],
    defaultModel: null,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    loadChatModelsWithRetry(
      () => apiFetch<ModelsResponse>(`/api/agents/${agentId}/chat/models`, { signal: controller.signal }),
      { cancelled: () => cancelled }
    )
      .then((next) => {
        if (!cancelled && next) setState(next);
      })
      .catch(() => {
        if (!cancelled) setState({ groups: [], defaultModel: null, loading: false });
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [agentId]);

  return state;
}
