"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import {
  ArrowUp,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  File as FileIcon,
  Folder,
  FolderPlus,
  FolderUp,
  Link2,
  Loader2,
  Pencil,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DropOverlay } from "@/components/chat/Attachments";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAsyncAction } from "@/lib/useAsyncAction";
import { FilePreview } from "./FilePreview";
import { useFileBrowser } from "./useFileBrowser";
import { archiveUrl, breadcrumbs, contentUrl, formatBytes, formatMtime, isDir, type FileEntry } from "./types";

// The Files pane, rendered full-height in the dashboard main when the Files tab is active (kept
// mounted/hidden across tab switches, like ChatView, so the current directory survives). The whole
// pane is a drop zone for uploads. Look + primitives mirror the Chat tab: same shadcn Dialog/Input,
// lucide icons, sonner toasts (raised inside the hook), and the ChatSidebar hover-action pattern.
export function FilesView({ agentId }: { agentId: string }) {
  const fb = useFileBrowser(agentId);
  const [preview, setPreview] = useState<FileEntry | null>(null);
  const [pendingDelete, setPendingDelete] = useState<FileEntry | null>(null);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);
  const folderUploadRef = useRef<HTMLInputElement>(null);

  // `webkitdirectory` isn't in React's input typings, so set it on the DOM node directly. It makes
  // the picker select a whole folder; each file then reports its path under it via webkitRelativePath.
  useEffect(() => {
    folderUploadRef.current?.setAttribute("webkitdirectory", "");
  }, []);

  // Inline rename — the row's name swaps to an input (same Enter-commits / Escape-cancels dance as
  // the chat thread rail). `skipBlur` suppresses the commit the Escape-triggered blur would fire.
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const skipBlur = useRef(false);

  function startRename(entry: FileEntry) {
    setEditingPath(entry.path);
    setDraft(entry.name);
  }
  function commitRename(entry: FileEntry) {
    setEditingPath(null);
    fb.rename(entry, draft);
  }
  function onRenameKeyDown(e: KeyboardEvent<HTMLInputElement>, entry: FileEntry) {
    if (e.key === "Enter") {
      e.preventDefault();
      commitRename(entry);
    } else if (e.key === "Escape") {
      e.preventDefault();
      skipBlur.current = true;
      setEditingPath(null);
    }
  }

  function onActivate(entry: FileEntry) {
    if (isDir(entry)) fb.openEntry(entry);
    else setPreview(entry);
  }

  const crumbs = fb.path ? breadcrumbs(fb.path) : [];

  return (
    <div className="relative flex h-full min-h-0 flex-col" {...fb.dragHandlers}>
      {fb.dragOver && <DropOverlay label="Drop files to upload here" />}

      <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b bg-background px-6 md:px-10">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={fb.goUp}
            disabled={!fb.parentPath}
            aria-label="Up one folder"
            title="Up one folder"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
          <nav className="flex min-w-0 items-center gap-0.5 overflow-x-auto text-sm">
            {crumbs.map((c, i) => (
              <span key={c.path} className="flex shrink-0 items-center">
                {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                <button
                  type="button"
                  onClick={() => fb.navigate(c.path)}
                  className={cn(
                    "max-w-[12rem] truncate rounded px-1.5 py-0.5 transition-colors hover:bg-secondary",
                    i === crumbs.length - 1 ? "font-medium text-foreground" : "text-muted-foreground"
                  )}
                >
                  {c.label}
                </button>
              </span>
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <IconButton
            onClick={() => fb.setShowHidden((v) => !v)}
            label={fb.showHidden ? "Hide hidden files" : "Show hidden files"}
          >
            {fb.showHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </IconButton>
          <IconButton onClick={fb.refresh} label="Refresh">
            <RefreshCw className={cn("h-4 w-4", fb.loading && "animate-spin")} />
          </IconButton>
          <IconButton onClick={() => setNewFolderOpen(true)} label="New folder" disabled={!fb.path}>
            <FolderPlus className="h-4 w-4" />
          </IconButton>
          <IconButton
            onClick={() => folderUploadRef.current?.click()}
            label="Upload folder"
            disabled={!fb.path || fb.uploading}
          >
            <FolderUp className="h-4 w-4" />
          </IconButton>
          <Button size="sm" onClick={() => uploadRef.current?.click()} disabled={!fb.path || fb.uploading}>
            {fb.uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload
          </Button>
          <input
            ref={uploadRef}
            type="file"
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files?.length) fb.uploadFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <input
            ref={folderUploadRef}
            type="file"
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files?.length) fb.uploadFolder(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {fb.loading && fb.entries.length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : fb.error ? (
          <div className="p-6 md:px-10">
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{fb.error}</p>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-5xl p-4 md:px-10 md:py-6">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr className="border-b">
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="hidden px-3 py-2 font-medium sm:table-cell">Modified</th>
                  <th className="px-3 py-2 text-right font-medium">Size</th>
                  <th className="w-px px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {fb.visibleEntries.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-10 text-center text-sm text-muted-foreground">
                      This folder is empty.
                    </td>
                  </tr>
                ) : (
                  fb.visibleEntries.map((entry) => {
                    const dir = isDir(entry);
                    const editing = editingPath === entry.path;
                    return (
                      <tr
                        key={entry.path}
                        className="group border-b border-border/60 last:border-0 hover:bg-secondary/40"
                        onDoubleClick={() => dir && fb.openEntry(entry)}
                      >
                        <td className="px-3 py-2">
                          {editing ? (
                            <input
                              autoFocus
                              value={draft}
                              onChange={(e) => setDraft(e.target.value)}
                              onFocus={(e) => e.currentTarget.select()}
                              onKeyDown={(e) => onRenameKeyDown(e, entry)}
                              onBlur={() => {
                                if (skipBlur.current) {
                                  skipBlur.current = false;
                                  return;
                                }
                                commitRename(entry);
                              }}
                              aria-label="File name"
                              className="w-full max-w-xs rounded-md bg-background px-2 py-1 text-sm text-foreground outline-none ring-1 ring-ring"
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => onActivate(entry)}
                              className="flex items-center gap-2 text-left"
                            >
                              {dir ? (
                                <Folder className="h-4 w-4 shrink-0 text-primary" />
                              ) : entry.type === "symlink" ? (
                                <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                              ) : (
                                <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                              )}
                              <span
                                className={cn(
                                  "truncate",
                                  dir ? "font-medium text-foreground" : "text-foreground",
                                  entry.hidden && "text-muted-foreground"
                                )}
                              >
                                {entry.name}
                              </span>
                            </button>
                          )}
                        </td>
                        <td className="hidden whitespace-nowrap px-3 py-2 text-muted-foreground sm:table-cell">
                          {formatMtime(entry.modified)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-right text-muted-foreground">
                          {formatBytes(entry.size)}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <a
                              href={dir ? archiveUrl(agentId, entry.path) : contentUrl(agentId, entry.path, "attachment")}
                              download={dir ? `${entry.name}.tar.gz` : entry.name}
                              aria-label={dir ? `Download ${entry.name} as a .tar.gz archive` : `Download ${entry.name}`}
                              title={dir ? "Download as .tar.gz" : "Download"}
                              className="rounded p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </a>
                            <button
                              type="button"
                              onClick={() => startRename(entry)}
                              aria-label={`Rename ${entry.name}`}
                              title="Rename"
                              className="rounded p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingDelete(entry)}
                              aria-label={`Delete ${entry.name}`}
                              title="Delete"
                              className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {fb.truncated && (
              <p className="mt-3 px-3 text-xs text-muted-foreground">
                Showing the first 1000 entries. Open a subfolder to narrow the listing.
              </p>
            )}
            {!fb.showHidden && fb.hiddenCount > 0 && (
              <p className="mt-3 px-3 text-xs text-muted-foreground">
                {fb.hiddenCount} hidden {fb.hiddenCount === 1 ? "item" : "items"} not shown.
              </p>
            )}
          </div>
        )}
      </div>

      <FilePreview agentId={agentId} entry={preview} onClose={() => setPreview(null)} />

      <NewFolderDialog
        open={newFolderOpen}
        onOpenChange={setNewFolderOpen}
        onCreate={async (name) => {
          await fb.createDir(name);
        }}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete this item?"
        description={
          pendingDelete
            ? `"${pendingDelete.name}" will be permanently deleted${
                isDir(pendingDelete) ? ", along with everything inside it" : ""
              }. This cannot be undone.`
            : undefined
        }
        confirmText="Delete"
        destructive
        onConfirm={async () => {
          if (pendingDelete) await fb.remove(pendingDelete);
        }}
      />
    </div>
  );
}

function IconButton({
  onClick,
  label,
  disabled,
  children,
}: {
  onClick: () => void;
  label: string;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function NewFolderDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const { busy, run } = useAsyncAction();

  function submit() {
    const clean = name.trim();
    if (!clean) return;
    run(async () => {
      await onCreate(clean);
      setName("");
      onOpenChange(false);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!busy) {
          if (!o) setName("");
          onOpenChange(o);
        }
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New folder</DialogTitle>
        </DialogHeader>
        <Input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Folder name"
          aria-label="Folder name"
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy || !name.trim()}>
            {busy ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
