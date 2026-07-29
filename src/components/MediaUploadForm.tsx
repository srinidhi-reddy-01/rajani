"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import type { UploadState } from "@/lib/admin/actions";
import type { VendorMedia } from "@/lib/types/database";
import { uploadFileDirect, type SignedUploadResult } from "@/lib/supabase/directUpload";

const MAX_VIDEO_BYTES = 20 * 1024 * 1024;

export function MediaUploadForm({
  createSignedUpload,
  finalize,
  deleteAction,
  media,
  accept = "image/*",
  label = "photo",
}: {
  createSignedUpload: (fileName: string) => Promise<SignedUploadResult>;
  finalize: (path: string, mediaType: "image" | "video") => Promise<UploadState>;
  deleteAction: (mediaId: string) => Promise<void>;
  media: VendorMedia[];
  accept?: string;
  label?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem("media") as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      setError("Choose a file.");
      return;
    }
    const isVideo = file.type.startsWith("video/");
    // Client-side pre-check for fast feedback only - the bucket's own file_size_limit
    // (see 0018 migration) is the real enforcement, since the server never sees these
    // bytes to check them itself.
    if (isVideo && file.size > MAX_VIDEO_BYTES) {
      setError("Videos must be 20MB or smaller.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const uploaded = await uploadFileDirect(createSignedUpload, file);
      if ("error" in uploaded) {
        setError(uploaded.error);
        return;
      }
      const finalized = await finalize(uploaded.path, isVideo ? "video" : "image");
      if (finalized.status !== "success") {
        setError(finalized.error ?? "Upload failed.");
        return;
      }
      form.reset();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {media.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {media.map((m) => (
            <div key={m.id} className="group relative h-24 w-24 overflow-hidden rounded-lg border border-border">
              {m.media_type === "video" ? (
                <video src={m.url} className="h-full w-full object-cover" muted playsInline />
              ) : (
                <Image src={m.url} alt="" fill sizes="96px" className="object-cover" />
              )}
              <button
                type="button"
                onClick={() => deleteAction(m.id)}
                aria-label="Remove"
                className="absolute right-1 top-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-black/60 text-xs text-white opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <input type="file" name="media" accept={accept} required className="text-sm text-ink" />
        <button
          type="submit"
          disabled={pending}
          className="h-9 cursor-pointer rounded-lg border border-royal-600 px-3 text-xs font-medium text-royal-700 transition-colors duration-200 ease-out hover:bg-royal-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Uploading..." : `Add ${label}`}
        </button>
      </form>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
