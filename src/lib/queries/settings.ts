import { supabase } from "@/lib/supabase/client";

export async function getFallbackCoverImageUrl(): Promise<string | null> {
  const { data, error } = await supabase.from("site_settings").select("fallback_cover_image_url").eq("id", 1).single();
  if (error) throw error;
  return data.fallback_cover_image_url;
}
