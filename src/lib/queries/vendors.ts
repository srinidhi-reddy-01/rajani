import { cache } from "react";
import { supabase } from "@/lib/supabase/client";
import type { MenuCategory, MenuItem, Package, PackageSlot, PackageSlotItem, PricedPackage, Vendor, VendorMedia } from "@/lib/types/database";

export type SlotOption = {
  itemId: string;
  name: string;
  imageUrl: string | null;
  isVeg: boolean;
  isDefault: boolean;
  groupLabel: string | null;
};

export type SlotWithItems = {
  id: string;
  categoryId: string;
  categoryName: string;
  selectionsCount: number;
  // Always fully included, never a choice - PackageSelector renders this as a plain
  // "Included" list instead of a pick-N chooser.
  isLocked: boolean;
  options: SlotOption[];
};

export type PackageWithSlots = PricedPackage & { slots: SlotWithItems[] };

export type VendorProfile = Vendor & {
  packages: PackageWithSlots[];
  menu_categories: (MenuCategory & { menu_items: MenuItem[] })[];
  vendor_media: VendorMedia[];
};

type VendorProfileRow = Vendor & {
  packages: (Package & { package_slots: (PackageSlot & { package_slot_items: PackageSlotItem[] })[] })[];
  vendor_media: VendorMedia[];
};
type CategoryWithItemsRow = MenuCategory & { menu_items: MenuItem[] };

// Every vendors column EXCEPT internal_terms (admin-only T&Cs - payment schedule,
// plates-counter instructions, client-scope obligations - must never reach this
// anon-key, consumer-facing query). Deliberately not "*" so a future vendors column
// doesn't silently start leaking here.
const PUBLIC_VENDOR_COLUMNS =
  "id, name, slug, phone, address, area, gbp_place_id, gbp_rating, gbp_rating_count, established_year, " +
  "cuisine_specialities, event_specialities, serviceable_everywhere, serviceable_areas, pricing_model, status, " +
  "description, logo_url, cover_image_url, owner_photo_url, events_completed, is_verified, fssai_license_number, " +
  "is_demo, discount_percent, created_at, updated_at";

// Wrapped in React's cache() so generateMetadata and the page component (both call
// this per-request) share one fetch instead of hitting Supabase twice.
export const getVendorProfile = cache(async (slug: string): Promise<VendorProfile | null> => {
  const { data: vendor, error } = await supabase
    .from("vendors")
    .select(`${PUBLIC_VENDOR_COLUMNS}, packages(*, package_slots(*, package_slot_items(*))), vendor_media(*)`)
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

  const categoryList = categories ?? [];
  const itemById = new Map(categoryList.flatMap((c) => c.menu_items.map((i) => [i.id, i] as const)));
  const categoryNameById = new Map(categoryList.map((c) => [c.id, c.name] as const));

  // Unpriced packages ("priced later" is a real onboarding state - see 0012
  // migration) never render on the consumer site, same as a null-priced menu item
  // never shows a price - only here the whole package card is withheld, not just
  // the number, since "Check availability" needs a real quote to show.
  const packages: PackageWithSlots[] = (vendor.packages ?? [])
    .filter((p): p is typeof p & { base_price_pp: number } => p.is_active && p.base_price_pp !== null)
    .sort((a, b) => a.base_price_pp - b.base_price_pp)
    .map((pkg) => ({
      ...pkg,
      slots: (pkg.package_slots ?? [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((slot) => ({
          id: slot.id,
          categoryId: slot.category_id,
          categoryName: categoryNameById.get(slot.category_id) ?? "Other",
          selectionsCount: slot.selections_count,
          isLocked: slot.is_locked,
          // ORDER BY sort_order NULLS LAST, id - existing (pre-migration) rows are all
          // null, so this is a no-op for them and preserves today's behaviour.
          options: [...slot.package_slot_items]
            .sort((a, b) => {
              const aOrder = a.sort_order ?? Number.POSITIVE_INFINITY;
              const bOrder = b.sort_order ?? Number.POSITIVE_INFINITY;
              if (aOrder !== bOrder) return aOrder - bOrder;
              return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
            })
            .map((si) => {
              const item = itemById.get(si.item_id);
              if (!item || !item.is_active) return null;
              return {
                itemId: item.id,
                name: item.name,
                imageUrl: item.image_url,
                isVeg: item.is_veg,
                isDefault: si.is_default,
                groupLabel: item.group_label,
              };
            })
            .filter((o): o is SlotOption => o !== null),
        })),
    }));

  return {
    ...vendor,
    packages,
    menu_categories: categoryList,
  };
});
