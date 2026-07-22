import "server-only";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { formatInr } from "@/lib/pricing";
import type { PackageItemSelection } from "@/lib/types/database";

const NOTIFY_TO = "kallusrinidhireddy@gmail.com";
const FROM = "Rajani <onboarding@resend.dev>";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

async function sendNotificationEmail(subject: string, html: string): Promise<void> {
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping notification email:", subject);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to: NOTIFY_TO, subject, html });
  } catch (error) {
    console.error("Failed to send notification email:", error);
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function row(label: string, value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  return `<tr><td style="padding:4px 12px 4px 0;color:#666;white-space:nowrap;">${escapeHtml(label)}</td><td style="padding:4px 0;">${value}</td></tr>`;
}

function phoneRow(phone: string): string {
  return row("Phone", `<a href="tel:+91${phone}">+91 ${phone}</a>`);
}

function selectionHtml(selection: PackageItemSelection[] | undefined): string {
  if (!selection || selection.length === 0) return "";
  const items = selection
    .map((slot) => `<li>${escapeHtml(slot.category_name)}: ${slot.selected_item_names.map(escapeHtml).join(", ")}</li>`)
    .join("");
  return row("Menu selection", `<ul style="margin:0;padding-left:18px;">${items}</ul>`);
}

function wrapTable(rows: string): string {
  return `<table style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">${rows}</table>`;
}

async function getVendorName(vendorId: string): Promise<string> {
  try {
    const { data } = await supabaseAdmin.from("vendors").select("name").eq("id", vendorId).single();
    return data?.name ?? "Unknown vendor";
  } catch {
    return "Unknown vendor";
  }
}

// Notification emails are a courtesy, never a requirement — any failure here (bad
// vendor lookup, Resend outage, malformed params) must never block the caller's
// submission, so every notify* export swallows its own errors.
async function safely(work: () => Promise<void>): Promise<void> {
  try {
    await work();
  } catch (error) {
    console.error("Failed to build/send notification email:", error);
  }
}

export async function notifyNewEnquiry(params: {
  vendorId: string;
  phone: string;
  plates: number;
  eventDate: string;
  eventType: string;
  budgetPp: number | null;
  cuisines: string[];
  packageName: string | null;
  quotedPp: number | null;
  selection: PackageItemSelection[];
}): Promise<void> {
  await safely(async () => {
    const vendorName = await getVendorName(params.vendorId);
    const subject = `New enquiry — ${vendorName} — ${params.plates} plates — ${params.eventDate}`;
    const html = wrapTable(
      [
        row("Vendor", escapeHtml(vendorName)),
        phoneRow(params.phone),
        row("Event type", escapeHtml(params.eventType)),
        row("Event date", escapeHtml(params.eventDate)),
        row("Plates", params.plates),
        row("Budget", params.budgetPp ? `${formatInr(params.budgetPp)}/plate` : null),
        row("Cuisines", params.cuisines.join(", ")),
        row("Package", params.packageName ? escapeHtml(params.packageName) : null),
        row("Quoted price", params.quotedPp ? `${formatInr(params.quotedPp)}/plate` : null),
        selectionHtml(params.selection),
      ].join("")
    );
    await sendNotificationEmail(subject, html);
  });
}

export async function notifyNewTastingRequest(params: {
  vendorId: string;
  phone: string;
  plates: number;
  eventDate: string;
  eventType: string;
  budgetPp: number | null;
  cuisines: string[];
  packageName: string | null;
  quotedPp: number | null;
  selection: PackageItemSelection[];
}): Promise<void> {
  await safely(async () => {
    const vendorName = await getVendorName(params.vendorId);
    const subject = `New sample box request — ${vendorName} — ${params.plates} plates — ${params.eventDate}`;
    const html = wrapTable(
      [
        row("Vendor", escapeHtml(vendorName)),
        phoneRow(params.phone),
        row("Event type", escapeHtml(params.eventType)),
        row("Event date", escapeHtml(params.eventDate)),
        row("Plates", params.plates),
        row("Budget", params.budgetPp ? `${formatInr(params.budgetPp)}/plate` : null),
        row("Cuisines", params.cuisines.join(", ")),
        row("Package", params.packageName ? escapeHtml(params.packageName) : null),
        row("Quoted price", params.quotedPp ? `${formatInr(params.quotedPp)}/plate` : null),
        selectionHtml(params.selection),
      ].join("")
    );
    await sendNotificationEmail(subject, html);
  });
}

export async function notifyNewMatchRequest(params: {
  phone: string;
  name: string | null;
  eventType: string | null;
  eventDate: string | null;
  plates: number | null;
  budgetPp: number | null;
  cuisines: string[];
}): Promise<void> {
  await safely(async () => {
    const subject = `New match request — ${params.plates ?? "plates n/a"} plates — ${params.eventDate ?? "no date given"}`;
    const html = wrapTable(
      [
        phoneRow(params.phone),
        row("Name", params.name ? escapeHtml(params.name) : null),
        row("Event type", params.eventType ? escapeHtml(params.eventType) : null),
        row("Event date", params.eventDate ? escapeHtml(params.eventDate) : null),
        row("Plates", params.plates),
        row("Budget", params.budgetPp ? `${formatInr(params.budgetPp)}/plate` : null),
        row("Cuisines", params.cuisines.join(", ")),
      ].join("")
    );
    await sendNotificationEmail(subject, html);
  });
}
