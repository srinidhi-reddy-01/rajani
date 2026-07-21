import { supabase } from "@/lib/supabase/client";
import type { MenuCategory, MenuItem, Package, PricingTier, Vendor } from "@/lib/types/database";

export type VendorForDiscovery = Pick<
  Vendor,
  | "id"
  | "name"
  | "slug"
  | "area"
  | "gbp_rating"
  | "gbp_rating_count"
  | "cuisine_specialities"
  | "event_specialities"
> & {
  pricing_tiers: PricingTier[];
  defaultPackage: Package | null;
};

// Discovery: live vendors, each with pricing_tiers and its default package,
// enough to compute an instant per-plate quote client-side. RLS restricts this
// to status='live' rows regardless of the .eq below.
type DiscoveryRow = Pick<
  Vendor,
  "id" | "name" | "slug" | "area" | "gbp_rating" | "gbp_rating_count" | "cuisine_specialities" | "event_specialities"
> & {
  pricing_tiers: PricingTier[];
  packages: Package[];
};

export async function getLiveVendorsForDiscovery(): Promise<VendorForDiscovery[]> {
  const { data: vendors, error } = await supabase
    .from("vendors")
    .select(
      "id, name, slug, area, gbp_rating, gbp_rating_count, cuisine_specialities, event_specialities, pricing_tiers(*), packages(*)"
    )
    .eq("status", "live")
    .order("name")
    .returns<DiscoveryRow[]>();

  if (error) throw error;

  return (vendors ?? []).map((v) => {
    const packages = v.packages ?? [];
    const pricing_tiers = v.pricing_tiers ?? [];
    const defaultPackage = packages.find((p) => p.is_default && p.is_active) ?? null;
    return {
      id: v.id,
      name: v.name,
      slug: v.slug,
      area: v.area,
      gbp_rating: v.gbp_rating,
      gbp_rating_count: v.gbp_rating_count,
      cuisine_specialities: v.cuisine_specialities,
      event_specialities: v.event_specialities,
      pricing_tiers,
      defaultPackage,
    };
  });
}

export type VendorProfile = Vendor & {
  pricing_tiers: PricingTier[];
  packages: Package[];
  menu_categories: (MenuCategory & { menu_items: MenuItem[] })[];
};

type VendorProfileRow = Vendor & {
  pricing_tiers: PricingTier[];
  packages: Package[];
};

type CategoryWithItemsRow = MenuCategory & { menu_items: MenuItem[] };

export async function getVendorProfile(slug: string): Promise<VendorProfile | null> {
  const { data: vendor, error } = await supabase
    .from("vendors")
    .select("*, pricing_tiers(*), packages(*)")
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
    pricing_tiers: vendor.pricing_tiers ?? [],
    packages: (vendor.packages ?? []).filter((p) => p.is_active),
    menu_categories: categories ?? [],
  };
}
