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

export type Enquiry = {
  id: string;
  vendor_id: string;
  user_phone: string;
  user_name: string | null;
  event_type: string;
  event_date: string;
  location: string | null;
  plates: number;
  meal_type: "breakfast" | "lunch" | "dinner";
  budget_pp: number | null;
  menu_selection: unknown;
  quoted_pp: number;
  status: "new" | "accepted" | "declined" | "booked" | "expired";
  vendor_responded_at: string | null;
  created_at: string;
};

export type TastingRequest = {
  id: string;
  vendor_id: string;
  user_phone: string;
  user_name: string | null;
  status: "new" | "contacted" | "completed" | "cancelled";
  created_at: string;
};

// Minimal shape so the supabase-js client is typed; extend as more tables are queried.
// `Relationships: []` on every table (and Views/Functions below) is required to satisfy
// supabase-js's GenericSchema constraint - omitting them silently degrades insert/update
// argument types to `never` instead of raising a clear error.
type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      vendors: Table<Vendor>;
      menu_categories: Table<MenuCategory>;
      menu_items: Table<MenuItem>;
      pricing_tiers: Table<PricingTier>;
      packages: Table<Package>;
      package_slots: Table<PackageSlot>;
      package_slot_items: Table<PackageSlotItem>;
      enquiries: Table<Enquiry>;
      tasting_requests: Table<TastingRequest>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
