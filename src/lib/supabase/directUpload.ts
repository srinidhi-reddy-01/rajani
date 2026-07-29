"use client";

import { supabase } from "@/lib/supabase/client";

export type SignedUploadResult = { status: "idle" | "success"; error?: string; path?: string; token?: string };

// Uploads straight from the browser to Storage using a token minted server-side
// (createSignedUpload in admin/actions.ts) - the file bytes never pass through a
// Vercel Server Action, so its ~4.5MB platform body cap doesn't apply. Needs no RLS
// policy: uploadToSignedUrl's auth is the token itself, not the caller's key.
export async function uploadFileDirect(
  createSignedUpload: (fileName: string) => Promise<SignedUploadResult>,
  file: File
): Promise<{ path: string } | { error: string }> {
  const signed = await createSignedUpload(file.name);
  if (signed.status !== "success" || !signed.path || !signed.token) {
    return { error: signed.error ?? "Could not prepare the upload." };
  }
  const { error } = await supabase.storage
    .from("vendor-media")
    .uploadToSignedUrl(signed.path, signed.token, file, { contentType: file.type || "application/octet-stream" });
  if (error) return { error: error.message };
  return { path: signed.path };
}
