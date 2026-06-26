"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { type ChatSession } from "./types";

interface ChatContextValue {
  agentId: string;
  sessions: ChatSession[];
  activeSessionId: string | null;
  composerFocusToken: number;
  // Ping the composer to refocus its textarea (e.g. after an attachment lands).
  requestComposerFocus: () => void;
  loadingSessions: boolean;
  selectSession: (sessionId: string | null) => void;
  startNewChat: () => void;
  onSessionCreated: (sessionId: string, title: string) => void;
  deleteSession: (sessionId: string) => Promise<void>;
  // Rename a thread (server-side via PATCH). Optimistic; rolls back + toasts if the build
  // doesn't support titles. Resolves whether it succeeded so callers can react if needed.
  renameSession: (sessionId: string, title: string) => Promise<void>;
  // Move a thread to the top of the rail on new activity (most-recently-used first).
  bumpSession: (sessionId: string) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatContext must be used within a ChatProvider");
  return ctx;
}

// Holds the thread rail + the active selection, shared by the sidebar rail (in the dashboard
// aside) and the conversation pane (in the dashboard main). The rail comes straight from the
// Agent37 Agents API (GET /v1/sessions) — there is no local sessions table. Each row's label
// (server-side title, else the first-message preview) is resolved by the sessions route, so the
// rail paints in one fetch with no per-session hydration.
export function ChatProvider({ agentId, children }: { agentId: string; children: ReactNode }) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [composerFocusToken, setComposerFocusToken] = useState(0);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // Load the rail from upstream — labels and ordering arrive ready from the sessions route.
  useEffect(() => {
    let cancelled = false;

    apiFetch<{ sessions: ChatSession[] }>(`/api/agents/${agentId}/chat/sessions`)
      .then((res) => {
        if (!cancelled) setSessions(res.sessions);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingSessions(false);
      });

    return () => {
      cancelled = true;
    };
  }, [agentId]);

  const requestComposerFocus = useCallback(() => setComposerFocusToken((n) => n + 1), []);

  const selectSession = useCallback(
    (sessionId: string | null) => {
      setActiveSessionId(sessionId);
      requestComposerFocus();
    },
    [requestComposerFocus]
  );

  const startNewChat = useCallback(() => {
    setActiveSessionId(null);
    requestComposerFocus();
  }, [requestComposerFocus]);

  // A brand-new conversation just minted its session id mid-stream. We already have its first
  // message (the label), so add the rail row locally and promote it — no write-back: the session
  // already exists upstream and will reappear from GET /v1/sessions on the next load.
  const onSessionCreated = useCallback((sessionId: string, title: string) => {
    setActiveSessionId(sessionId);
    setSessions((prev) =>
      prev.some((s) => s.session_id === sessionId)
        ? prev
        : [{ session_id: sessionId, title: title.trim().slice(0, 80) || null }, ...prev]
    );
  }, []);

  const deleteSession = useCallback(
    async (sessionId: string) => {
      const removed = sessions.find((x) => x.session_id === sessionId);
      const prevActive = activeSessionId;
      setSessions((s) => s.filter((x) => x.session_id !== sessionId)); // optimistic, functional
      setActiveSessionId((cur) => (cur === sessionId ? null : cur));
      try {
        await apiFetch(`/api/agents/${agentId}/chat/sessions/${sessionId}`, { method: "DELETE" });
      } catch (e) {
        // Functional rollback: re-insert only the removed row (preserving any threads added
        // concurrently) and restore the prior selection.
        if (removed) setSessions((s) => (s.some((x) => x.session_id === sessionId) ? s : [removed, ...s]));
        setActiveSessionId(prevActive);
        toast.error((e as Error).message || "Couldn't delete that chat.");
      }
    },
    [agentId, activeSessionId, sessions]
  );

  const renameSession = useCallback(
    async (sessionId: string, title: string) => {
      const next = title.trim().slice(0, 200);
      const prev = sessions.find((s) => s.session_id === sessionId)?.title ?? null;
      if (!next || next === prev) return;
      setSessions((s) => s.map((x) => (x.session_id === sessionId ? { ...x, title: next } : x))); // optimistic
      try {
        await apiFetch(`/api/agents/${agentId}/chat/sessions/${sessionId}`, {
          method: "PATCH",
          body: JSON.stringify({ title: next }),
        });
      } catch (e) {
        setSessions((s) => s.map((x) => (x.session_id === sessionId ? { ...x, title: prev } : x))); // rollback
        toast.error((e as Error).message || "Couldn't rename that chat.");
      }
    },
    [agentId, sessions]
  );

  // Move a thread to the top of the rail on new activity. Upstream ordering (last_active) only
  // refreshes on reload, so keep the most-recently-used thread first in the meantime.
  const bumpSession = useCallback((sessionId: string) => {
    setSessions((prev) => {
      const idx = prev.findIndex((s) => s.session_id === sessionId);
      if (idx <= 0) return prev; // not present, or already at the top
      return [prev[idx], ...prev.slice(0, idx), ...prev.slice(idx + 1)];
    });
  }, []);

  const value = useMemo<ChatContextValue>(
    () => ({
      agentId,
      sessions,
      activeSessionId,
      composerFocusToken,
      requestComposerFocus,
      loadingSessions,
      selectSession,
      startNewChat,
      onSessionCreated,
      deleteSession,
      renameSession,
      bumpSession,
    }),
    [agentId, sessions, activeSessionId, composerFocusToken, requestComposerFocus, loadingSessions, selectSession, startNewChat, onSessionCreated, deleteSession, renameSession, bumpSession]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
