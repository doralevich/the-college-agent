"use client";

import { useRef } from "react";
import { FileText, Loader2, Paperclip, RotateCw, Upload, X } from "lucide-react";
import type { PendingFile } from "./useChatAttachments";

export function AttachButton({ onFiles, disabled }: { onFiles: (files: FileList) => void; disabled?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => ref.current?.click()}
        aria-label="Attach files"
        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
      >
        <Paperclip className="h-4 w-4" />
      </button>
      <input
        ref={ref}
        type="file"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files?.length) onFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </>
  );
}

export function AttachmentTray({
  files,
  onRemove,
  onRetry,
}: {
  files: PendingFile[];
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
}) {
  if (!files.length) return null;
  return (
    <div className="flex flex-wrap gap-2 px-4 pb-2">
      {files.map((f) => (
        <div
          key={f.id}
          className="flex items-center gap-2 rounded-full border bg-secondary/50 px-2.5 py-1 text-xs text-foreground"
        >
          {f.previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- object URL thumbnail, not a remote asset
            <img src={f.previewUrl} alt="" className="h-6 w-6 rounded object-cover" />
          ) : (
            <FileText className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="max-w-[10rem] truncate">{f.file.name}</span>
          {f.status === "uploading" && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          {f.status === "error" && (
            <button
              type="button"
              onClick={() => onRetry(f.id)}
              aria-label="Retry upload"
              className="text-destructive hover:text-destructive/80"
            >
              <RotateCw className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onRemove(f.id)}
            aria-label="Remove attachment"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

// Full-pane drop affordance, rendered over the whole ChatView while a file is dragged in.
// pointer-events-none so the drag/drop events fall through to the container's handlers.
export function DropOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-background/70 backdrop-blur-[2px]">
      <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-primary bg-card/90 px-10 py-8 text-primary shadow-sm">
        <Upload className="h-7 w-7" />
        <span className="text-sm font-medium">Drop files to attach</span>
      </div>
    </div>
  );
}
