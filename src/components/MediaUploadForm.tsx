"use client";

import { useActionState } from "react";
import Image from "next/image";
import type { UploadState } from "@/lib/admin/actions";
import type { VendorMedia } from "@/lib/types/database";

export function MediaUploadForm({
  action,
  deleteAction,
  media,
}: {
  action: (prevState: UploadState, formData: FormData) => Promise<UploadState>;
  deleteAction: (mediaId: string) => Promise<void>;
  media: VendorMedia[];
}) {
  const [state, formAction, pending] = useActionState<UploadState, FormData>(action, { status: "idle" });

  return (
    <div className="flex flex-col gap-3">
      {media.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {media.map((m) => (
            <div key={m.id} className="group relative h-24 w-24 overflow-hidden rounded-lg border border-border">
              <Image src={m.url} alt="" fill sizes="96px" className="object-cover" />
              <button
                type="button"
                onClick={() => deleteAction(m.id)}
                aria-label="Remove image"
                className="absolute right-1 top-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-black/60 text-xs text-white opacity-0 transition group-hover:opacity-100"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <form action={formAction} className="flex items-end gap-2">
        <input type="file" name="media" accept="image/*" required className="text-sm text-ink" />
        <button
          type="submit"
          disabled={pending}
          className="h-9 cursor-pointer rounded-lg border border-royal-600 px-3 text-xs font-medium text-royal-700 transition hover:bg-royal-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Uploading..." : "Add photo"}
        </button>
      </form>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
    </div>
  );
}
