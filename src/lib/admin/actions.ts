"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { assertAdminSession } from "@/lib/admin/auth";
import { VENDOR_PIPELINE_ORDER, computeGoLiveGate, getVendorDetail } from "@/lib/admin/queries";

function revalidateVendor(vendorId: string): void {
  revalidatePath("/admin");
  revalidatePath(`/admin/vendors/${vendorId}`);
}

function parseSpecialities(raw: FormDataEntryValue | null): string[] {
  return String(raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 2);
}

// ---------- Vendor pipeline status ----------

export async function advanceVendorStatus(vendorId: string, returnTo: string): Promise<void> {
  await assertAdminSession();

  const { data: vendor, error } = await supabaseAdmin.from("vendors").select("id, status").eq("id", vendorId).maybeSingle();
  if (error) throw error;
  if (!vendor) throw new Error("Vendor not found");

  const currentIndex = VENDOR_PIPELINE_ORDER.indexOf(vendor.status as (typeof VENDOR_PIPELINE_ORDER)[number]);
  if (currentIndex === -1 || currentIndex === VENDOR_PIPELINE_ORDER.length - 1) return;

  const nextStatus = VENDOR_PIPELINE_ORDER[currentIndex + 1];

  if (nextStatus === "live") {
    const detail = await getVendorDetail(vendorId);
    if (!detail) throw new Error("Vendor not found");
    const gate = computeGoLiveGate(detail);
    if (!gate.canGoLive) {
      const separator = returnTo.includes("?") ? "&" : "?";
      redirect(
        `${returnTo}${separator}blocked=${encodeURIComponent(detail.name)}&missing=${encodeURIComponent(gate.missing.join(", "))}`
      );
    }
  }

  const { error: updateError } = await supabaseAdmin.from("vendors").update({ status: nextStatus }).eq("id", vendorId);
  if (updateError) throw updateError;

  revalidateVendor(vendorId);
}

// ---------- Vendor profile ----------

export async function updateVendorProfile(vendorId: string, formData: FormData): Promise<void> {
  await assertAdminSession();

  const { error } = await supabaseAdmin
    .from("vendors")
    .update({
      name: String(formData.get("name") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim() || null,
      address: String(formData.get("address") ?? "").trim() || null,
      area: String(formData.get("area") ?? "").trim() || null,
      established_year: formData.get("established_year") ? Number(formData.get("established_year")) : null,
      cuisine_specialities: parseSpecialities(formData.get("cuisine_specialities")),
      event_specialities: parseSpecialities(formData.get("event_specialities")),
      serviceable_everywhere: formData.get("serviceable_everywhere") === "on",
      pricing_model: String(formData.get("pricing_model") ?? "flexible") as "final" | "flexible",
    })
    .eq("id", vendorId);
  if (error) throw error;

  revalidateVendor(vendorId);
}

// ---------- Menu categories ----------

export async function addMenuCategory(vendorId: string, formData: FormData): Promise<void> {
  await assertAdminSession();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const { count } = await supabaseAdmin
    .from("menu_categories")
    .select("id", { count: "exact", head: true })
    .eq("vendor_id", vendorId);

  const { error } = await supabaseAdmin
    .from("menu_categories")
    .insert({ vendor_id: vendorId, name, sort_order: count ?? 0 });
  if (error) throw error;

  revalidateVendor(vendorId);
}

export async function deleteMenuCategory(categoryId: string, vendorId: string): Promise<void> {
  await assertAdminSession();
  const { error } = await supabaseAdmin.from("menu_categories").delete().eq("id", categoryId);
  if (error) throw error;
  revalidateVendor(vendorId);
}

// ---------- Menu items ----------

const MEAL_TYPES = ["breakfast", "lunch", "dinner"] as const;

export async function addMenuItem(vendorId: string, formData: FormData): Promise<void> {
  await assertAdminSession();
  const categoryId = String(formData.get("category_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const basePricePp = Number(formData.get("base_price_pp"));
  if (!categoryId || !name || !Number.isFinite(basePricePp)) return;

  const mealTypes = MEAL_TYPES.filter((m) => formData.get(`meal_type_${m}`) === "on");

  const { error } = await supabaseAdmin.from("menu_items").insert({
    vendor_id: vendorId,
    category_id: categoryId,
    name,
    is_veg: formData.get("is_veg") === "on",
    meal_types: mealTypes.length > 0 ? mealTypes : ["lunch", "dinner"],
    base_price_pp: basePricePp,
  });
  if (error) throw error;

  revalidateVendor(vendorId);
}

export async function updateMenuItem(itemId: string, vendorId: string, formData: FormData): Promise<void> {
  await assertAdminSession();
  const basePricePp = Number(formData.get("base_price_pp"));
  if (!Number.isFinite(basePricePp)) return;

  const { error } = await supabaseAdmin
    .from("menu_items")
    .update({ base_price_pp: basePricePp, is_active: formData.get("is_active") === "on" })
    .eq("id", itemId);
  if (error) throw error;

  revalidateVendor(vendorId);
}

export async function deleteMenuItem(itemId: string, vendorId: string): Promise<void> {
  await assertAdminSession();
  const { error } = await supabaseAdmin.from("menu_items").delete().eq("id", itemId);
  if (error) throw error;
  revalidateVendor(vendorId);
}

// ---------- Pricing tiers ----------

export async function addPricingTier(vendorId: string, formData: FormData): Promise<void> {
  await assertAdminSession();
  const minPlates = Number(formData.get("min_plates"));
  const maxPlates = Number(formData.get("max_plates"));
  const adjustmentPct = Number(formData.get("adjustment_pct"));
  if (!Number.isFinite(minPlates) || !Number.isFinite(maxPlates) || !Number.isFinite(adjustmentPct)) return;
  if (minPlates <= 0 || maxPlates < minPlates) return;

  const { error } = await supabaseAdmin.from("pricing_tiers").insert({
    vendor_id: vendorId,
    min_plates: minPlates,
    max_plates: maxPlates,
    adjustment_pct: adjustmentPct,
  });
  if (error) throw error;

  revalidateVendor(vendorId);
}

export async function deletePricingTier(tierId: string, vendorId: string): Promise<void> {
  await assertAdminSession();
  const { error } = await supabaseAdmin.from("pricing_tiers").delete().eq("id", tierId);
  if (error) throw error;
  revalidateVendor(vendorId);
}

// ---------- Packages ----------

export async function addPackage(vendorId: string, formData: FormData): Promise<void> {
  await assertAdminSession();
  const name = String(formData.get("name") ?? "").trim();
  const basePricePp = Number(formData.get("base_price_pp"));
  if (!name || !Number.isFinite(basePricePp)) return;

  const { error } = await supabaseAdmin.from("packages").insert({
    vendor_id: vendorId,
    name,
    description: String(formData.get("description") ?? "").trim() || null,
    base_price_pp: basePricePp,
    is_default: false,
    is_active: true,
  });
  if (error) throw error;

  revalidateVendor(vendorId);
}

export async function updatePackage(packageId: string, vendorId: string, formData: FormData): Promise<void> {
  await assertAdminSession();
  const basePricePp = Number(formData.get("base_price_pp"));
  if (!Number.isFinite(basePricePp)) return;

  const { error } = await supabaseAdmin
    .from("packages")
    .update({
      base_price_pp: basePricePp,
      description: String(formData.get("description") ?? "").trim() || null,
      is_active: formData.get("is_active") === "on",
    })
    .eq("id", packageId);
  if (error) throw error;

  revalidateVendor(vendorId);
}

export async function setDefaultPackage(packageId: string, vendorId: string): Promise<void> {
  await assertAdminSession();

  const { error: clearError } = await supabaseAdmin
    .from("packages")
    .update({ is_default: false })
    .eq("vendor_id", vendorId);
  if (clearError) throw clearError;

  const { error: setError } = await supabaseAdmin
    .from("packages")
    .update({ is_default: true, is_active: true })
    .eq("id", packageId);
  if (setError) throw setError;

  revalidateVendor(vendorId);
}

export async function deletePackage(packageId: string, vendorId: string): Promise<void> {
  await assertAdminSession();
  const { error } = await supabaseAdmin.from("packages").delete().eq("id", packageId);
  if (error) throw error;
  revalidateVendor(vendorId);
}

// ---------- Package slots & slot items ----------

export async function addPackageSlot(packageId: string, vendorId: string, formData: FormData): Promise<void> {
  await assertAdminSession();
  const categoryId = String(formData.get("category_id") ?? "");
  const selectionsCount = Number(formData.get("selections_count"));
  if (!categoryId || !Number.isFinite(selectionsCount) || selectionsCount < 1) return;

  const { count } = await supabaseAdmin
    .from("package_slots")
    .select("id", { count: "exact", head: true })
    .eq("package_id", packageId);

  const { error } = await supabaseAdmin.from("package_slots").insert({
    package_id: packageId,
    category_id: categoryId,
    selections_count: selectionsCount,
    sort_order: count ?? 0,
  });
  if (error) throw error;

  revalidateVendor(vendorId);
}

export async function deletePackageSlot(slotId: string, vendorId: string): Promise<void> {
  await assertAdminSession();
  const { error } = await supabaseAdmin.from("package_slots").delete().eq("id", slotId);
  if (error) throw error;
  revalidateVendor(vendorId);
}

export async function addPackageSlotItem(slotId: string, vendorId: string, formData: FormData): Promise<void> {
  await assertAdminSession();
  const itemId = String(formData.get("item_id") ?? "");
  if (!itemId) return;

  const { error } = await supabaseAdmin.from("package_slot_items").insert({
    slot_id: slotId,
    item_id: itemId,
    is_default: formData.get("is_default") === "on",
  });
  if (error) throw error;

  revalidateVendor(vendorId);
}

export async function deletePackageSlotItem(slotItemId: string, vendorId: string): Promise<void> {
  await assertAdminSession();
  const { error } = await supabaseAdmin.from("package_slot_items").delete().eq("id", slotItemId);
  if (error) throw error;
  revalidateVendor(vendorId);
}

// ---------- Enquiries & tasting requests ----------

export async function updateEnquiryStatus(enquiryId: string, formData: FormData): Promise<void> {
  await assertAdminSession();
  const status = String(formData.get("status") ?? "");
  if (!["new", "accepted", "declined", "booked", "expired"].includes(status)) return;

  const { error } = await supabaseAdmin
    .from("enquiries")
    .update({
      status: status as "new" | "accepted" | "declined" | "booked" | "expired",
      vendor_responded_at: status === "accepted" || status === "declined" ? new Date().toISOString() : undefined,
    })
    .eq("id", enquiryId);
  if (error) throw error;

  revalidatePath("/admin/enquiries");
}

export async function updateTastingStatus(tastingId: string, formData: FormData): Promise<void> {
  await assertAdminSession();
  const status = String(formData.get("status") ?? "");
  if (!["new", "contacted", "completed", "cancelled"].includes(status)) return;

  const { error } = await supabaseAdmin
    .from("tasting_requests")
    .update({ status: status as "new" | "contacted" | "completed" | "cancelled" })
    .eq("id", tastingId);
  if (error) throw error;

  revalidatePath("/admin/tasting");
}
