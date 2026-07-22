import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type {
  Cuisine,
  Enquiry,
  EventType,
  MatchRequest,
  MenuCategory,
  MenuItem,
  Package,
  PackageSlot,
  PackageSlotItem,
  TastingRequest,
  Vendor,
  VendorMedia,
} from "@/lib/types/database";

export const ALL_VENDOR_STATUSES = ["sourced", "contacted", "onboarding", "priced", "live", "paused"] as const;
export const VENDOR_PIPELINE_ORDER = ["sourced", "contacted", "onboarding", "priced", "live"] as const;

// Pre-created for every vendor on request, so admins add dishes instead of typing category names.
export const STANDARD_MENU_CATEGORIES = [
  "Welcome drinks",
  "Starters",
  "Soups",
  "Main course",
  "Breads",
  "Rice & biryani",
  "Curries",
  "Dal",
  "Curd & raita",
  "Pickles & chutneys",
  "Desserts",
  "Ice creams",
  "Beverages",
  "Paan & mouth fresheners",
] as const;

// Common Telugu wedding/party dishes an admin can one-click add per category (price set after).
export const DISH_SUGGESTIONS: Record<string, string[]> = {
  "Welcome drinks": ["Fresh Lime Soda", "Mango Panna", "Rose Milk", "Buttermilk (Majjiga)"],
  Starters: ["Veg Manchurian", "Gobi 65", "Paneer Tikka", "Chicken 65", "Mutton Sukka"],
  Soups: ["Sweet Corn Soup", "Tomato Shorba", "Hot & Sour Soup"],
  "Main course": ["Paneer Butter Masala", "Gutti Vankaya Kura", "Bendakaya Fry", "Chicken Curry", "Mutton Curry"],
  Breads: ["Butter Naan", "Roti", "Poori", "Phulka"],
  "Rice & biryani": ["Veg Biryani", "Chicken Biryani", "Mutton Biryani", "Bagara Rice", "Curd Rice"],
  Curries: ["Kadai Paneer", "Chicken Chettinad", "Palak Paneer"],
  Dal: ["Dal Tadka", "Sambar", "Pappu Charu"],
  "Curd & raita": ["Boondi Raita", "Plain Curd", "Vegetable Raita"],
  "Pickles & chutneys": ["Avakaya", "Gongura Pachadi", "Coconut Chutney", "Tomato Chutney"],
  Desserts: ["Gulab Jamun", "Double ka Meetha", "Bobbatlu", "Kesari Bath", "Qubani ka Meetha"],
  "Ice creams": ["Vanilla", "Butterscotch", "Kesar Pista"],
  Beverages: ["Filter Coffee", "Masala Chai", "Soft Drinks"],
  "Paan & mouth fresheners": ["Meetha Paan", "Saunf", "Mukhwas"],
};

export type VendorPipelineRow = Pick<
  Vendor,
  "id" | "name" | "slug" | "area" | "status" | "gbp_rating" | "gbp_rating_count" | "is_demo"
>;

function sanitizeSearchTerm(q: string): string {
  return q.replace(/[,()%]/g, " ").trim();
}

export async function listVendorsForPipeline(opts: {
  status?: string;
  q?: string;
  page: number;
  pageSize: number;
}): Promise<{ vendors: VendorPipelineRow[]; total: number }> {
  let query = supabaseAdmin
    .from("vendors")
    .select("id, name, slug, area, status, gbp_rating, gbp_rating_count, is_demo", { count: "exact" })
    .order("name");

  if (opts.status) query = query.eq("status", opts.status as Vendor["status"]);

  const q = opts.q ? sanitizeSearchTerm(opts.q) : "";
  if (q) query = query.or(`name.ilike.%${q}%,area.ilike.%${q}%`);

  const from = (opts.page - 1) * opts.pageSize;
  const to = from + opts.pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query.returns<VendorPipelineRow[]>();
  if (error) throw error;
  return { vendors: data ?? [], total: count ?? 0 };
}

export type VendorDetail = Vendor & {
  packages: (Package & { package_slots: (PackageSlot & { package_slot_items: PackageSlotItem[] })[] })[];
  menu_categories: (MenuCategory & { menu_items: MenuItem[] })[];
  vendor_media: VendorMedia[];
};

export async function getVendorDetail(id: string): Promise<VendorDetail | null> {
  type VendorRow = Vendor & {
    packages: (Package & { package_slots: (PackageSlot & { package_slot_items: PackageSlotItem[] })[] })[];
    vendor_media: VendorMedia[];
  };

  const { data: vendor, error } = await supabaseAdmin
    .from("vendors")
    .select("*, packages(*, package_slots(*, package_slot_items(*))), vendor_media(*)")
    .eq("id", id)
    .maybeSingle()
    .returns<VendorRow>();
  if (error) throw error;
  if (!vendor) return null;

  const { data: categories, error: catError } = await supabaseAdmin
    .from("menu_categories")
    .select("*, menu_items(*)")
    .eq("vendor_id", id)
    .order("sort_order")
    .returns<(MenuCategory & { menu_items: MenuItem[] })[]>();
  if (catError) throw catError;

  return { ...vendor, menu_categories: categories ?? [] };
}

export type GoLiveGate = { canGoLive: boolean; missing: string[] };

// Only a package is compulsory to go live - menu items, media, and description are optional.
export function computeGoLiveGate(vendor: { packages: Package[] }): GoLiveGate {
  const missing: string[] = [];
  if (!vendor.packages.some((p) => p.is_active)) missing.push("at least one active package");
  return { canGoLive: missing.length === 0, missing };
}

export async function listCuisines(): Promise<Cuisine[]> {
  const { data, error } = await supabaseAdmin.from("cuisines").select("*").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function listEventTypes(): Promise<EventType[]> {
  const { data, error } = await supabaseAdmin.from("event_types").select("*").order("name");
  if (error) throw error;
  return data ?? [];
}

export type EnquiryRow = Enquiry & { vendors: Pick<Vendor, "id" | "name" | "slug"> | null };

export async function listEnquiries(status?: string): Promise<EnquiryRow[]> {
  let query = supabaseAdmin
    .from("enquiries")
    .select("*, vendors(id, name, slug)")
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status as Enquiry["status"]);
  const { data, error } = await query.returns<EnquiryRow[]>();
  if (error) throw error;
  return data ?? [];
}

export type TastingRequestRow = TastingRequest & { vendors: Pick<Vendor, "id" | "name" | "slug"> | null };

export async function listTastingRequests(status?: string): Promise<TastingRequestRow[]> {
  let query = supabaseAdmin
    .from("tasting_requests")
    .select("*, vendors(id, name, slug)")
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status as TastingRequest["status"]);
  const { data, error } = await query.returns<TastingRequestRow[]>();
  if (error) throw error;
  return data ?? [];
}

export async function listMatchRequests(status?: string): Promise<MatchRequest[]> {
  let query = supabaseAdmin.from("match_requests").select("*").order("created_at", { ascending: false });
  if (status) query = query.eq("status", status as MatchRequest["status"]);
  const { data, error } = await query.returns<MatchRequest[]>();
  if (error) throw error;
  return data ?? [];
}
