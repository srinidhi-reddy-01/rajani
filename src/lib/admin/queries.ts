import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type {
  Enquiry,
  MenuCategory,
  MenuItem,
  Package,
  PackageSlot,
  PackageSlotItem,
  PricingTier,
  TastingRequest,
  Vendor,
} from "@/lib/types/database";

export const VENDOR_PIPELINE_ORDER = ["sourced", "contacted", "onboarding", "priced", "live"] as const;

export type VendorPipelineRow = Pick<
  Vendor,
  "id" | "name" | "slug" | "area" | "status" | "gbp_rating" | "gbp_rating_count"
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
    .select("id, name, slug, area, status, gbp_rating, gbp_rating_count", { count: "exact" })
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
  pricing_tiers: PricingTier[];
  packages: (Package & { package_slots: (PackageSlot & { package_slot_items: PackageSlotItem[] })[] })[];
  menu_categories: (MenuCategory & { menu_items: MenuItem[] })[];
};

export async function getVendorDetail(id: string): Promise<VendorDetail | null> {
  type VendorRow = Vendor & {
    pricing_tiers: PricingTier[];
    packages: (Package & { package_slots: (PackageSlot & { package_slot_items: PackageSlotItem[] })[] })[];
  };

  const { data: vendor, error } = await supabaseAdmin
    .from("vendors")
    .select("*, pricing_tiers(*), packages(*, package_slots(*, package_slot_items(*)))")
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

export function computeGoLiveGate(vendor: {
  menu_categories: (MenuCategory & { menu_items: MenuItem[] })[];
  pricing_tiers: PricingTier[];
  packages: Package[];
}): GoLiveGate {
  const missing: string[] = [];
  const hasPricedItem = vendor.menu_categories.some((c) => c.menu_items.some((i) => i.is_active));
  if (!hasPricedItem) missing.push("at least one priced, active menu item");
  if (vendor.pricing_tiers.length === 0) missing.push("at least one pricing tier");
  if (!vendor.packages.some((p) => p.is_default && p.is_active)) missing.push("a default, active package");
  return { canGoLive: missing.length === 0, missing };
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
