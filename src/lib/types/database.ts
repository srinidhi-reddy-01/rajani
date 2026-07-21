// Hand-written from supabase/migrations/0001_initial_schema.sql.
// Regenerate with `supabase gen types typescript --linked` once the CLI is authenticated
// in a real terminal, then this file can be replaced wholesale.

export type Vendor = {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  address: string | null;
  area: string | null;
  gbp_place_id: string | null;
  gbp_rating: number | null;
  gbp_rating_count: number | null;
  established_year: number | null;
  cuisine_specialities: string[];
  event_specialities: string[];
  serviceable_everywhere: boolean;
  serviceable_areas: string[];
  pricing_model: "final" | "flexible";
  status: "sourced" | "contacted" | "onboarding" | "priced" | "live" | "paused";
  created_at: string;
  updated_at: string;
};

export type MenuCategory = {
  id: string;
  vendor_id: string;
  name: string;
  sort_order: number;
};

export type MenuItem = {
  id: string;
  vendor_id: string;
  category_id: string;
  name: string;
  is_veg: boolean;
  meal_types: ("breakfast" | "lunch" | "dinner")[];
  base_price_pp: number;
  is_active: boolean;
  created_at: string;
};

export type PricingTier = {
  id: string;
  vendor_id: string;
  min_plates: number;
  max_plates: number;
  adjustment_pct: number;
};

export type Package = {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  base_price_pp: number;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
};

export type PackageSlot = {
  id: string;
  package_id: string;
  category_id: string;
  selections_count: number;
  sort_order: number;
};

export type PackageSlotItem = {
  id: string;
  slot_id: string;
  item_id: string;
  is_default: boolean;
};

// Minimal shape so the supabase-js client is typed; extend as more tables are queried.
export type Database = {
  public: {
    Tables: {
      vendors: { Row: Vendor; Insert: Partial<Vendor>; Update: Partial<Vendor> };
      menu_categories: { Row: MenuCategory; Insert: Partial<MenuCategory>; Update: Partial<MenuCategory> };
      menu_items: { Row: MenuItem; Insert: Partial<MenuItem>; Update: Partial<MenuItem> };
      pricing_tiers: { Row: PricingTier; Insert: Partial<PricingTier>; Update: Partial<PricingTier> };
      packages: { Row: Package; Insert: Partial<Package>; Update: Partial<Package> };
      package_slots: { Row: PackageSlot; Insert: Partial<PackageSlot>; Update: Partial<PackageSlot> };
      package_slot_items: { Row: PackageSlotItem; Insert: Partial<PackageSlotItem>; Update: Partial<PackageSlotItem> };
    };
  };
};
