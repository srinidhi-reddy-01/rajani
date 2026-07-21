"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { assertAdminSession } from "@/lib/admin/auth";
import { ALL_VENDOR_STATUSES, STANDARD_MENU_CATEGORIES, computeGoLiveGate, getVendorDetail } from "@/lib/admin/queries";
import type { Vendor } from "@/lib/types/database";

function revalidateVendor(vendorId: string): void {
  revalidatePath("/admin");
  revalidatePath(`/admin/vendors/${vendorId}`);
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ---------- Vendor pipeline status ----------

export async function setVendorStatus(vendorId: string, formData: FormData): Promise<void> {
  await assertAdminSession();
  const newStatus = String(formData.get("status") ?? "");
  const returnTo = String(formData.get("__returnTo") ?? "/admin");
  if (!ALL_VENDOR_STATUSES.includes(newStatus as (typeof ALL_VENDOR_STATUSES)[number])) return;

  if (newStatus === "live") {
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

  const { error } = await supabaseAdmin
    .from("vendors")
    .update({ status: newStatus as Vendor["status"] })
    .eq("id", vendorId);
  if (error) throw error;

  revalidateVendor(vendorId);
}

export async function deleteVendor(vendorId: string, returnTo: string): Promise<void> {
  await assertAdminSession();
  const { error } = await supabaseAdmin.from("vendors").delete().eq("id", vendorId);
  if (error) throw error;
  revalidatePath("/admin");
  redirect(returnTo);
}

export async function deleteAllDemoVendors(): Promise<void> {
  await assertAdminSession();
  const { error } = await supabaseAdmin.from("vendors").delete().eq("is_demo", true);
  if (error) throw error;
  revalidatePath("/admin");
}

export type CreateVendorState = { status: "idle" | "success"; error?: string };

export async function createVendor(_prevState: CreateVendorState, formData: FormData): Promise<CreateVendorState> {
  await assertAdminSession();
  const name = String(formData.get("name") ?? "").trim();
  const baseSlug = slugify(name);
  if (!name || !baseSlug) return { status: "idle", error: "Enter a valid name." };

  let slug = baseSlug;
  let attempt = 0;
  while (attempt < 50) {
    const { data: existing } = await supabaseAdmin.from("vendors").select("id").eq("slug", slug).maybeSingle();
    if (!existing) break;
    attempt += 1;
    slug = `${baseSlug}-${attempt + 1}`;
  }

  const { data: vendor, error } = await supabaseAdmin
    .from("vendors")
    .insert({
      name,
      slug,
      phone: String(formData.get("phone") ?? "").trim() || null,
      area: String(formData.get("area") ?? "").trim() || null,
      status: "sourced",
    })
    .select("id")
    .single();
  if (error) throw error;

  const { error: catError } = await supabaseAdmin
    .from("menu_categories")
    .insert(STANDARD_MENU_CATEGORIES.map((categoryName, i) => ({ vendor_id: vendor.id, name: categoryName, sort_order: i })));
  if (catError) throw catError;

  revalidatePath("/admin");
  redirect(`/admin/vendors/${vendor.id}`);
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
      description: String(formData.get("description") ?? "").trim() || null,
      serviceable_everywhere: formData.get("serviceable_everywhere") === "on",
      pricing_model: String(formData.get("pricing_model") ?? "flexible") as "final" | "flexible",
    })
    .eq("id", vendorId);
  if (error) throw error;

  revalidateVendor(vendorId);
}

export async function updateVendorCuisines(vendorId: string, formData: FormData): Promise<void> {
  await assertAdminSession();
  const selected = formData.getAll("cuisines").map(String).slice(0, 2);
  const { error } = await supabaseAdmin.from("vendors").update({ cuisine_specialities: selected }).eq("id", vendorId);
  if (error) throw error;
  revalidateVendor(vendorId);
}

export async function updateVendorEventTypes(vendorId: string, formData: FormData): Promise<void> {
  await assertAdminSession();
  const selected = formData.getAll("event_types").map(String).slice(0, 2);
  const { error } = await supabaseAdmin.from("vendors").update({ event_specialities: selected }).eq("id", vendorId);
  if (error) throw error;
  revalidateVendor(vendorId);
}

export async function addCuisineOption(vendorId: string, formData: FormData): Promise<void> {
  await assertAdminSession();
  const name = String(formData.get("new_cuisine") ?? "").trim();
  if (!name) return;
  const { error } = await supabaseAdmin.from("cuisines").insert({ name });
  if (error && !error.message.toLowerCase().includes("duplicate")) throw error;
  revalidateVendor(vendorId);
}

export async function addEventTypeOption(vendorId: string, formData: FormData): Promise<void> {
  await assertAdminSession();
  const name = String(formData.get("new_event_type") ?? "").trim();
  if (!name) return;
  const { error } = await supabaseAdmin.from("event_types").insert({ name });
  if (error && !error.message.toLowerCase().includes("duplicate")) throw error;
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

export async function provisionStandardCategories(vendorId: string): Promise<void> {
  await assertAdminSession();
  const { data: existing } = await supabaseAdmin.from("menu_categories").select("name").eq("vendor_id", vendorId);
  const existingNames = new Set((existing ?? []).map((c) => c.name));
  const toInsert = STANDARD_MENU_CATEGORIES.filter((name) => !existingNames.has(name)).map((name, i) => ({
    vendor_id: vendorId,
    name,
    sort_order: existingNames.size + i,
  }));
  if (toInsert.length === 0) return;
  const { error } = await supabaseAdmin.from("menu_categories").insert(toInsert);
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

export async function addSuggestedMenuItem(vendorId: string, categoryId: string, name: string): Promise<void> {
  await assertAdminSession();
  const { error } = await supabaseAdmin.from("menu_items").insert({
    vendor_id: vendorId,
    category_id: categoryId,
    name,
    is_veg: true,
    meal_types: ["lunch", "dinner"],
    base_price_pp: 0,
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

// ---------- CSV menu import ----------

export type CsvImportState = {
  status: "idle" | "done";
  created: number;
  errors: { row: number; message: string }[];
};

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields.map((f) => f.trim());
}

export async function importMenuCsv(
  vendorId: string,
  _prevState: CsvImportState,
  formData: FormData
): Promise<CsvImportState> {
  await assertAdminSession();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { status: "done", created: 0, errors: [{ row: 0, message: "Choose a CSV file." }] };
  }

  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return { status: "done", created: 0, errors: [{ row: 0, message: "File is empty." }] };
  }

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const categoryIdx = header.indexOf("category");
  const nameIdx = header.indexOf("dish_name");
  const priceIdx = header.indexOf("price_pp");
  if (categoryIdx === -1 || nameIdx === -1 || priceIdx === -1) {
    return {
      status: "done",
      created: 0,
      errors: [{ row: 0, message: "Header must include category, dish_name, price_pp." }],
    };
  }

  const errors: { row: number; message: string }[] = [];
  const validRows: { category: string; name: string; price: number }[] = [];

  lines.slice(1).forEach((line, idx) => {
    const rowNum = idx + 2;
    const fields = parseCsvLine(line);
    const category = fields[categoryIdx]?.trim();
    const name = fields[nameIdx]?.trim();
    const priceRaw = fields[priceIdx]?.trim();
    const price = Number(priceRaw);

    if (!category) {
      errors.push({ row: rowNum, message: "Missing category." });
      return;
    }
    if (!name) {
      errors.push({ row: rowNum, message: "Missing dish_name." });
      return;
    }
    if (!priceRaw || !Number.isFinite(price) || price < 0) {
      errors.push({ row: rowNum, message: `Invalid price_pp "${priceRaw ?? ""}".` });
      return;
    }
    validRows.push({ category, name, price });
  });

  if (validRows.length === 0) {
    return { status: "done", created: 0, errors };
  }

  const { data: existingCategories } = await supabaseAdmin
    .from("menu_categories")
    .select("id, name")
    .eq("vendor_id", vendorId);
  const categoryByName = new Map((existingCategories ?? []).map((c) => [c.name, c.id]));

  const neededCategoryNames = [...new Set(validRows.map((r) => r.category))].filter((c) => !categoryByName.has(c));
  if (neededCategoryNames.length > 0) {
    const { count } = await supabaseAdmin
      .from("menu_categories")
      .select("id", { count: "exact", head: true })
      .eq("vendor_id", vendorId);
    const { data: inserted, error: catError } = await supabaseAdmin
      .from("menu_categories")
      .insert(neededCategoryNames.map((name, i) => ({ vendor_id: vendorId, name, sort_order: (count ?? 0) + i })))
      .select("id, name");
    if (catError) throw catError;
    for (const c of inserted ?? []) categoryByName.set(c.name, c.id);
  }

  const itemsToInsert = validRows.map((r) => ({
    vendor_id: vendorId,
    category_id: categoryByName.get(r.category)!,
    name: r.name,
    is_veg: true,
    meal_types: ["lunch", "dinner"] as const,
    base_price_pp: r.price,
  }));

  const { error: itemsError } = await supabaseAdmin.from("menu_items").insert(itemsToInsert);
  if (itemsError) throw itemsError;

  revalidateVendor(vendorId);
  return { status: "done", created: itemsToInsert.length, errors };
}

// ---------- Packages ----------

export async function addPackage(vendorId: string, formData: FormData): Promise<void> {
  await assertAdminSession();
  const name = String(formData.get("name") ?? "").trim();
  const basePricePp = Number(formData.get("base_price_pp"));
  if (!name || !Number.isFinite(basePricePp)) return;
  const minPlatesRaw = formData.get("min_plates");
  const minPlates = minPlatesRaw ? Number(minPlatesRaw) : null;

  const { error } = await supabaseAdmin.from("packages").insert({
    vendor_id: vendorId,
    name,
    description: String(formData.get("description") ?? "").trim() || null,
    base_price_pp: basePricePp,
    min_plates: minPlates && minPlates > 0 ? minPlates : null,
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
  const minPlatesRaw = formData.get("min_plates");
  const minPlates = minPlatesRaw ? Number(minPlatesRaw) : null;

  const { error } = await supabaseAdmin
    .from("packages")
    .update({
      base_price_pp: basePricePp,
      description: String(formData.get("description") ?? "").trim() || null,
      min_plates: minPlates && minPlates > 0 ? minPlates : null,
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

// ---------- Package slots & slot items (category-rule packages) ----------

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

// Exact-dishes package builder: pick specific dishes across any categories; each category's
// picks become one slot with selections_count = pick count, all marked default (no real
// choice at order time) - reuses the same slot model as category-rule packages.
export async function addExactDishesToPackage(packageId: string, vendorId: string, formData: FormData): Promise<void> {
  await assertAdminSession();
  const itemIds = formData.getAll("item_ids").map(String).filter(Boolean);
  if (itemIds.length === 0) return;

  const { data: items, error: itemsError } = await supabaseAdmin
    .from("menu_items")
    .select("id, category_id")
    .in("id", itemIds);
  if (itemsError) throw itemsError;

  const byCategory = new Map<string, string[]>();
  for (const item of items ?? []) {
    const list = byCategory.get(item.category_id) ?? [];
    list.push(item.id);
    byCategory.set(item.category_id, list);
  }

  const { count: existingSlotCount } = await supabaseAdmin
    .from("package_slots")
    .select("id", { count: "exact", head: true })
    .eq("package_id", packageId);

  let sortOrder = existingSlotCount ?? 0;
  for (const [categoryId, ids] of byCategory) {
    const { data: slot, error: slotError } = await supabaseAdmin
      .from("package_slots")
      .insert({ package_id: packageId, category_id: categoryId, selections_count: ids.length, sort_order: sortOrder })
      .select("id")
      .single();
    if (slotError) throw slotError;
    sortOrder += 1;

    const { error: slotItemsError } = await supabaseAdmin
      .from("package_slot_items")
      .insert(ids.map((itemId) => ({ slot_id: slot.id, item_id: itemId, is_default: true })));
    if (slotItemsError) throw slotItemsError;
  }

  revalidateVendor(vendorId);
}

// ---------- Vendor showcase: logo & media ----------

export type UploadState = { status: "idle" | "success"; error?: string };

export async function uploadVendorLogo(vendorId: string, _prevState: UploadState, formData: FormData): Promise<UploadState> {
  await assertAdminSession();
  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    return { status: "idle", error: "Choose an image file." };
  }

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${vendorId}/logo-${randomUUID()}.${ext}`;
  const { error: uploadError } = await supabaseAdmin.storage
    .from("vendor-media")
    .upload(path, file, { contentType: file.type || "image/jpeg" });
  if (uploadError) return { status: "idle", error: uploadError.message };

  const { data: publicUrlData } = supabaseAdmin.storage.from("vendor-media").getPublicUrl(path);

  const { error } = await supabaseAdmin.from("vendors").update({ logo_url: publicUrlData.publicUrl }).eq("id", vendorId);
  if (error) throw error;

  revalidateVendor(vendorId);
  return { status: "success" };
}

export async function uploadVendorMedia(vendorId: string, _prevState: UploadState, formData: FormData): Promise<UploadState> {
  await assertAdminSession();
  const file = formData.get("media");
  if (!(file instanceof File) || file.size === 0) {
    return { status: "idle", error: "Choose an image file." };
  }

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${vendorId}/media-${randomUUID()}.${ext}`;
  const { error: uploadError } = await supabaseAdmin.storage
    .from("vendor-media")
    .upload(path, file, { contentType: file.type || "image/jpeg" });
  if (uploadError) return { status: "idle", error: uploadError.message };

  const { data: publicUrlData } = supabaseAdmin.storage.from("vendor-media").getPublicUrl(path);

  const { error } = await supabaseAdmin.from("vendor_media").insert({ vendor_id: vendorId, url: publicUrlData.publicUrl });
  if (error) throw error;

  revalidateVendor(vendorId);
  return { status: "success" };
}

// vendorId first so callers can `.bind(null, vendorId)` and hand the client component a
// plain (mediaId) => Promise<void> - a bare arrow function can't cross the server/client
// boundary, but a bound "use server" reference can.
export async function deleteVendorMedia(vendorId: string, mediaId: string): Promise<void> {
  await assertAdminSession();
  const { error } = await supabaseAdmin.from("vendor_media").delete().eq("id", mediaId);
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
