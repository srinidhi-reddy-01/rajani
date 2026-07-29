"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import type { UploadState } from "@/lib/admin/actions";
import { uploadFileDirect, type SignedUploadResult } from "@/lib/supabase/directUpload";

function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function LogoUploadForm({
  createSignedUpload,
  finalize,
  currentUrl,
  vendorName,
  fieldName = "logo",
  label = "logo",
  alt = "Vendor logo",
  circular = false,
}: {
  createSignedUpload: (fileName: string) => Promise<SignedUploadResult>;
  finalize: (path: string) => Promise<UploadState>;
  currentUrl: string | null;
  vendorName: string;
  fieldName?: string;
  label?: string;
  alt?: string;
  circular?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const shape = circular ? "rounded-full" : "rounded-lg";

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem(fieldName) as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      setError("Choose an image file.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const uploaded = await uploadFileDirect(createSignedUpload, file);
      if ("error" in uploaded) {
        setError(uploaded.error);
        return;
      }
      const finalized = await finalize(uploaded.path);
      if (finalized.status !== "success") {
        setError(finalized.error ?? "Upload failed.");
        return;
      }
      form.reset();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-4">
        {currentUrl ? (
          <Image src={currentUrl} alt={alt} width={64} height={64} className={`h-16 w-16 ${shape} border border-border object-cover`} />
        ) : (
          <div
            className={`flex h-16 w-16 items-center justify-center ${shape} bg-gradient-to-br from-royal-600 to-royal-800 text-sm font-semibold text-cream-50`}
            aria-hidden
          >
            {initialsOf(vendorName)}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <input type="file" name={fieldName} accept="image/*" required className="text-sm text-ink" />
          <button
            type="submit"
            disabled={pending}
            className="h-9 cursor-pointer rounded-lg border border-royal-600 px-3 text-xs font-medium text-royal-700 transition hover:bg-royal-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Uploading..." : `Upload ${label}`}
          </button>
        </form>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
