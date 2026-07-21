import { supabase } from "@/lib/supabase/client";
import type { MenuCategory, MenuItem, Package, Vendor } from "@/lib/types/database";

export type VendorProfile = Vendor & {
  packages: Package[];
  menu_categories: (MenuCategory & { menu_items: MenuItem[] })[];
};

type VendorProfileRow = Vendor & { packages: Package[] };
type CategoryWithItemsRow = MenuCategory & { menu_items: MenuItem[] };

export async function getVendorProfile(slug: string): Promise<VendorProfile | null> {
  const { data: vendor, error } = await supabase
    .from("vendors")
    .select("*, packages(*)")
    .eq("slug", slug)
    .eq("status", "live")
    .maybeSingle()
    .returns<VendorProfileRow>();

  if (error) throw error;
  if (!vendor) return null;

  const { data: categories, error: catError } = await supabase
    .from("menu_categories")
    .select("*, menu_items(*)")
    .eq("vendor_id", vendor.id)
    .order("sort_order")
    .returns<CategoryWithItemsRow[]>();

  if (catError) throw catError;

  return {
    ...vendor,
    packages: (vendor.packages ?? []).filter((p) => p.is_active),
    menu_categories: categories ?? [],
  };
}
