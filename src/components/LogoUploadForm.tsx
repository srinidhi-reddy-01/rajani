"use client";

import { useActionState } from "react";
import Image from "next/image";
import type { UploadState } from "@/lib/admin/actions";

export function LogoUploadForm({
  action,
  currentUrl,
}: {
  action: (prevState: UploadState, formData: FormData) => Promise<UploadState>;
  currentUrl: string | null;
}) {
  const [state, formAction, pending] = useActionState<UploadState, FormData>(action, { status: "idle" });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-4">
        {currentUrl ? (
          <Image
            src={currentUrl}
            alt="Vendor logo"
            width={64}
            height={64}
            className="h-16 w-16 rounded-lg border border-border object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-border text-xs text-ink-muted">
            No logo
          </div>
        )}
        <form action={formAction} className="flex items-end gap-2">
          <input type="file" name="logo" accept="image/*" required className="text-sm text-ink" />
          <button
            type="submit"
            disabled={pending}
            className="h-9 cursor-pointer rounded-lg border border-royal-600 px-3 text-xs font-medium text-royal-700 transition hover:bg-royal-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Uploading..." : "Upload logo"}
          </button>
        </form>
      </div>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
    </div>
  );
}
