"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { apiFetch, readApiError } from "@/lib/api";
import { useDropZone } from "@/lib/useDropZone";
import { joinPath, type FileEntry, type FileListResponse } from "./types";

// Owns the Files tab's directory state + mutations. Mirrors useChatAttachments' shape: one hook
// instance per pane, callbacks memoised, a ref-counted drag overlay. The current directory's
// resolved absolute `path` comes from the Agents API (it resolves ~ / defaults), so navigation,
// upload targets, and new-folder/rename paths are all derived from the listing the server returns.
export function useFileBrowser(agentId: string) {
  const [path, setPath] = useState<string | null>(null); // resolved abs dir; null until first load
  const [parentPath, setParentPath] = useState<string | null>(null);
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHidden, setShowHidden] = useState(true);
  const [uploading, setUploading] = useState(0); // count of in-flight uploads

  // Guard against an older list response landing after a newer navigation.
  const loadSeq = useRef(0);

  // Load one directory level. `target` undefined loads the agent's default workspace dir (first
  // mount); on success the resolved abs path replaces whatever we asked for.
  const load = useCallback(
    async (target?: string) => {
      const seq = ++loadSeq.current;
      setLoading(true);
      setError(null);
      try {
        const qs = target ? `?path=${encodeURIComponent(target)}` : "";
        const res = await apiFetch<FileListResponse>(`/api/agents/${agentId}/files/list${qs}`);
        if (seq !== loadSeq.current) return; // a newer load superseded us
        setPath(res.path);
        setParentPath(res.parentPath);
        setEntries(res.entries);
        setTruncated(res.truncated);
      } catch (e) {
        if (seq !== loadSeq.current) return;
        setError((e as Error).message || "Couldn't open that folder.");
      } finally {
        if (seq === loadSeq.current) setLoading(false);
      }
    },
    [agentId]
  );

  // Initial load (default workspace dir).
  useEffect(() => {
    load();
  }, [load]);

  const navigate = useCallback((target: string) => load(target), [load]);
  const refresh = useCallback(() => load(path ?? undefined), [load, path]);
  const goUp = useCallback(() => {
    if (parentPath) load(parentPath);
  }, [load, parentPath]);

  // Open an entry: directories (and dir symlinks) navigate; everything else is left to the caller
  // (preview/download), which knows the entry.
  const openEntry = useCallback(
    (entry: FileEntry) => {
      if (entry.type === "directory") navigate(entry.path);
    },
    [navigate]
  );

  // Upload one file per PUT to the current dir, then refresh once. overwrite=true mirrors a normal
  // desktop drop (replace in place). Errors are toasted per file but don't abort the batch.
  const uploadFiles = useCallback(
    async (incoming: FileList | File[]) => {
      const list = Array.from(incoming);
      if (!list.length || !path) return;
      setUploading((n) => n + list.length);
      let failures = 0;
      try {
        await Promise.all(
          list.map(async (file) => {
            const target = joinPath(path, file.name);
            try {
              const res = await fetch(
                `/api/agents/${agentId}/files/content?path=${encodeURIComponent(target)}&overwrite=true`,
                { method: "PUT", headers: { "Content-Type": file.type || "application/octet-stream" }, body: file }
              );
              if (!res.ok) throw new Error(await readApiError(res, "Upload failed"));
            } catch (e) {
              failures += 1;
              toast.error(`${file.name}: ${(e as Error).message}`);
            }
          })
        );
      } finally {
        setUploading((n) => Math.max(0, n - list.length));
      }
      const ok = list.length - failures;
      if (ok > 0) toast.success(ok === 1 ? "Uploaded 1 file" : `Uploaded ${ok} files`);
      await load(path);
    },
    [agentId, path, load]
  );

  const createDir = useCallback(
    async (name: string) => {
      const clean = name.trim();
      if (!clean || !path) return;
      try {
        await apiFetch(`/api/agents/${agentId}/files/dir?path=${encodeURIComponent(joinPath(path, clean))}`, {
          method: "POST",
        });
        toast.success("Folder created");
        await load(path);
      } catch (e) {
        toast.error((e as Error).message || "Couldn't create the folder.");
      }
    },
    [agentId, path, load]
  );

  // Rename in place: the entry lives in the current dir, so `to` is the new basename joined onto it.
  const rename = useCallback(
    async (entry: FileEntry, newName: string) => {
      const clean = newName.trim();
      if (!clean || !path || clean === entry.name) return;
      try {
        await apiFetch(`/api/agents/${agentId}/files`, {
          method: "PATCH",
          body: JSON.stringify({ from: entry.path, to: joinPath(path, clean) }),
        });
        await load(path);
      } catch (e) {
        toast.error((e as Error).message || "Couldn't rename that.");
      }
    },
    [agentId, path, load]
  );

  const remove = useCallback(
    async (entry: FileEntry) => {
      try {
        await apiFetch(`/api/agents/${agentId}/files?path=${encodeURIComponent(entry.path)}`, { method: "DELETE" });
        toast.success(`Deleted ${entry.name}`);
        await load(path ?? undefined);
      } catch (e) {
        toast.error((e as Error).message || "Couldn't delete that.");
      }
    },
    [agentId, path, load]
  );

  // Whole-pane drag-drop overlay (shared with the chat composer).
  const { dragOver, dragHandlers } = useDropZone(uploadFiles);

  const visibleEntries = useMemo(
    () => (showHidden ? entries : entries.filter((e) => !e.hidden)),
    [entries, showHidden]
  );
  const hiddenCount = useMemo(() => entries.reduce((n, e) => n + (e.hidden ? 1 : 0), 0), [entries]);

  return {
    path,
    parentPath,
    entries,
    visibleEntries,
    hiddenCount,
    truncated,
    loading,
    error,
    showHidden,
    setShowHidden,
    uploading: uploading > 0,
    dragOver,
    dragHandlers,
    navigate,
    refresh,
    goUp,
    openEntry,
    uploadFiles,
    createDir,
    rename,
    remove,
  };
}

export type FileBrowser = ReturnType<typeof useFileBrowser>;
