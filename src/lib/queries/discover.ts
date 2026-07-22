import { supabase } from "@/lib/supabase/client";
import type { Package } from "@/lib/types/database";
import type { DiscoverableVendor } from "@/lib/matching";

type VendorWithPackagesRow = DiscoverableVendor & { packages: Package[] };

// Raw, unfiltered live-vendor list - all matching/sorting happens client-side (see
// lib/matching.ts) so the discover page can recompute instantly as filters change.
export async function getLiveVendorsWithPackages(): Promise<DiscoverableVendor[]> {
  const { data, error } = await supabase
    .from("vendors")
    .select(
      "id, name, slug, area, gbp_rating, gbp_rating_count, cuisine_specialities, cover_image_url, owner_photo_url, logo_url, events_completed, is_verified, packages(*)"
    )
    .eq("status", "live")
    .returns<VendorWithPackagesRow[]>();
  if (error) throw error;
  return data ?? [];
}
