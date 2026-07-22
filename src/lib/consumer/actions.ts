"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { notifyNewEnquiry, notifyNewMatchRequest, notifyNewTastingRequest } from "@/lib/email";
import type { EnquirySelection, PackageItemSelection } from "@/lib/types/database";

const PHONE_REGEX = /^[6-9]\d{9}$/;
const MAX_ENQUIRIES_PER_PHONE_PER_DAY = 10;

// The guided flow's captured context, carried from /discover through to the profile page.
export type CtaContext = {
  plates: number;
  cuisines: string[];
  budgetPp: number | null;
  eventDate: string;
  eventType: string;
  packageId: string | null;
  packageName: string | null;
  quotedPp: number | null;
  selection: PackageItemSelection[];
};

export type CtaState = { status: "idle" | "success"; error?: string };

function todayRangeIso(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function submitEnquiry(
  vendorId: string,
  context: CtaContext,
  _prevState: CtaState,
  formData: FormData
): Promise<CtaState> {
  const phone = String(formData.get("phone") ?? "").trim();
  if (!PHONE_REGEX.test(phone)) {
    return { status: "idle", error: "Enter a valid 10-digit Indian mobile number." };
  }

  const { start, end } = todayRangeIso();
  const { count, error: countError } = await supabaseAdmin
    .from("enquiries")
    .select("id", { count: "exact", head: true })
    .eq("user_phone", phone)
    .gte("created_at", start)
    .lt("created_at", end);
  if (countError) throw countError;
  if ((count ?? 0) >= MAX_ENQUIRIES_PER_PHONE_PER_DAY) {
    return { status: "idle", error: "You've reached today's enquiry limit. Please try again tomorrow." };
  }

  const selection: EnquirySelection = {
    cuisines: context.cuisines,
    package_id: context.packageId,
    package_name: context.packageName,
    selection: context.selection,
  };
  const eventType = context.eventType || "Other";
  const eventDate = context.eventDate || new Date().toISOString().slice(0, 10);
  const plates = context.plates || 500;

  const { error } = await supabaseAdmin.from("enquiries").insert({
    vendor_id: vendorId,
    user_phone: phone,
    // The guided flow no longer collects meal_type; dinner is the common case for
    // Hyderabad wedding/event catering and the column has no default to fall back on.
    event_type: eventType,
    event_date: eventDate,
    plates,
    meal_type: "dinner",
    budget_pp: context.budgetPp,
    menu_selection: selection,
    quoted_pp: context.quotedPp ?? 0,
  });
  if (error) throw error;

  await notifyNewEnquiry({
    vendorId,
    phone,
    plates,
    eventDate,
    eventType,
    budgetPp: context.budgetPp,
    cuisines: context.cuisines,
    packageName: context.packageName,
    quotedPp: context.quotedPp,
    selection: context.selection,
  });

  return { status: "success" };
}

export async function submitMatchRequest(_prevState: CtaState, formData: FormData): Promise<CtaState> {
  const phone = String(formData.get("phone") ?? "").trim();
  if (!PHONE_REGEX.test(phone)) {
    return { status: "idle", error: "Enter a valid 10-digit Indian mobile number." };
  }

  const plates = formData.get("plates") ? Number(formData.get("plates")) : null;
  const budgetPp = formData.get("budget_pp") ? Number(formData.get("budget_pp")) : null;
  const cuisines = String(formData.get("cuisines") ?? "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);

  const name = String(formData.get("name") ?? "").trim() || null;
  const eventType = String(formData.get("event_type") ?? "").trim() || null;
  const eventDate = String(formData.get("event_date") ?? "").trim() || null;
  const normalizedPlates = plates && Number.isFinite(plates) ? plates : null;
  const normalizedBudgetPp = budgetPp && Number.isFinite(budgetPp) ? budgetPp : null;

  const { error } = await supabaseAdmin.from("match_requests").insert({
    user_phone: phone,
    user_name: name,
    event_type: eventType,
    event_date: eventDate,
    plates: normalizedPlates,
    budget_pp: normalizedBudgetPp,
    cuisines,
  });
  if (error) throw error;

  await notifyNewMatchRequest({
    phone,
    name,
    eventType,
    eventDate,
    plates: normalizedPlates,
    budgetPp: normalizedBudgetPp,
    cuisines,
  });

  return { status: "success" };
}

export async function submitTastingRequest(
  vendorId: string,
  context: CtaContext,
  _prevState: CtaState,
  formData: FormData
): Promise<CtaState> {
  const phone = String(formData.get("phone") ?? "").trim();
  if (!PHONE_REGEX.test(phone)) {
    return { status: "idle", error: "Enter a valid 10-digit Indian mobile number." };
  }

  const { error } = await supabaseAdmin.from("tasting_requests").insert({
    vendor_id: vendorId,
    user_phone: phone,
    context: {
      plates: context.plates,
      cuisines: context.cuisines,
      budget_pp: context.budgetPp,
      event_date: context.eventDate,
      event_type: context.eventType,
      package_id: context.packageId,
      package_name: context.packageName,
      quoted_pp: context.quotedPp,
      selection: context.selection,
    },
  });
  if (error) throw error;

  await notifyNewTastingRequest({
    vendorId,
    phone,
    plates: context.plates,
    eventDate: context.eventDate,
    eventType: context.eventType,
    budgetPp: context.budgetPp,
    cuisines: context.cuisines,
    packageName: context.packageName,
    quotedPp: context.quotedPp,
    selection: context.selection,
  });

  return { status: "success" };
}
