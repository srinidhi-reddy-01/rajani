import { supabase } from "@/lib/supabase/client";
import type { MenuCategory, MenuItem, Package, PackageSlot, PackageSlotItem, Vendor, VendorMedia } from "@/lib/types/database";

export type SlotOption = {
  itemId: string;
  name: string;
  imageUrl: string | null;
  isVeg: boolean;
  isDefault: boolean;
};

export type SlotWithItems = {
  id: string;
  categoryId: string;
  categoryName: string;
  selectionsCount: number;
  options: SlotOption[];
};

export type PackageWithSlots = Package & { slots: SlotWithItems[] };

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

export async function getVendorProfile(slug: string): Promise<VendorProfile | null> {
  const { data: vendor, error } = await supabase
    .from("vendors")
    .select("*, packages(*, package_slots(*, package_slot_items(*))), vendor_media(*)")
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

  const packages: PackageWithSlots[] = (vendor.packages ?? [])
    .filter((p) => p.is_active)
    .map((pkg) => ({
      ...pkg,
      slots: (pkg.package_slots ?? [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((slot) => ({
          id: slot.id,
          categoryId: slot.category_id,
          categoryName: categoryNameById.get(slot.category_id) ?? "Other",
          selectionsCount: slot.selections_count,
          options: slot.package_slot_items
            .map((si) => {
              const item = itemById.get(si.item_id);
              if (!item || !item.is_active) return null;
              return { itemId: item.id, name: item.name, imageUrl: item.image_url, isVeg: item.is_veg, isDefault: si.is_default };
            })
            .filter((o): o is SlotOption => o !== null),
        })),
    }));

  return {
    ...vendor,
    packages,
    menu_categories: categoryList,
  };
}
