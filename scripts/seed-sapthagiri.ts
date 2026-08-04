// Idempotent seed for Sapthagiri Hospitality Services' three catering menus, sourced
// entirely from ./sapthagiri_menus.json (already extracted/verified - never re-derived
// here). Run with:
//   node --env-file=.env.local scripts/seed-sapthagiri.ts --dry-run
//   node --env-file=.env.local scripts/seed-sapthagiri.ts
//
// Not a real DB transaction: supabase-js/PostgREST has no client-side multi-statement
// transaction primitive (same limitation as every other script in scripts/, e.g.
// fix-chikkas-veg-classification.mjs, seed-sri-av-catering.mjs). Safety instead comes
// from idempotency - every write is a find-or-create/update keyed on an application-level
// natural key, so a script that dies partway through is safe to just re-run.
//
// Schema mapping (see supabase/migrations/0001, 0020):
//   menu  -> packages row (name = menu_name; there's no menu_code column, so `name` is
//            the only stable key - packages has no unique constraint on (vendor_id, name)
//            either, so idempotency here is application-level: find by name, else insert)
//   section -> one menu_categories row (shared across menus, deduped by EXACT (vendor_id,
//            name) match - menu_categories DOES have that unique constraint) + one
//            package_slots row per menu (two, for the one choose_split section)
//   item  -> one menu_items row per exact (category, spelling) - shared/reused across
//            menus and slots via package_slot_items, matching the existing demo-vendor
//            pattern (0008_demo_vendor_slotted_packages.sql)
//
// Known, deliberate simplifications (see conversation record, not re-litigated here):
//   - "Ice Cream" (HOUSE_VEG) and "Ice Creams" (HOUSE_SPECIAL_VEG/COMBO_VEG) are
//     different exact strings in the source JSON, so they become two distinct
//     categories - not merged, per "dedupe on exact (category, spelling)".
//   - "Kesar Jilebi" appears in two Chat Counter subgroups ("Chat & Kachori" and
//     "Agra UP Special - Live Items"); menu_items.group_label is one column per item,
//     so first-subgroup-wins (logged below).
//   - Fruit Stall's Indian/Imported split is also given group_label = "Indian" /
//     "Imported" (same subgroup mechanism as Refreshments/Starters/Chat Counter) so the
//     two slots are visibly labelled in the UI, per the "label them" requirement.
//   - None of the source JSON specifies is_default per item, so every package_slot_item
//     is inserted with is_default=false and reruns never touch is_default on an existing
//     row (only sort_order self-heals) - an admin toggling defaults later is preserved.

import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRY_RUN = process.argv.includes("--dry-run");

const VENDOR_ID = "6911ebd7-fd31-4a66-951f-312ed234de35";
const PAYLOAD_PATH = path.join(__dirname, "..", "sapthagiri_menus.json");

type SelectionRule =
  | { type: "choose"; count: number }
  | { type: "all" }
  | { type: "choose_split"; indian: number; imported: number };

type Subgroup = { name: string; items: string[] };

type Section = {
  seq: number;
  name: string;
  selection_rule: SelectionRule;
  items: string[];
  subgroups?: Subgroup[];
  note?: string;
};

type Menu = {
  menu_name: string;
  menu_code: string;
  price_per_pax: number;
  currency: string;
  cuisine: string;
  is_veg: boolean;
  sections: Section[];
};

type Payload = {
  vendor: { id: string; name: string };
  terms: string[];
  menus: Menu[];
};

function mustSucceed<T>(label: string, result: { data: T | null; error: { message: string } | null }): T {
  const { data, error } = result;
  if (error || data === null) {
    console.error(`FAILED: ${label}`, error ?? "no data returned");
    process.exit(1);
  }
  return data;
}

// For plain writes with no .select() chained - PostgREST returns data: null on a
// successful write by default (Prefer: return=minimal), so only .error indicates failure.
function mustSucceedVoid(label: string, result: { error: { message: string } | null }): void {
  if (result.error) {
    console.error(`FAILED: ${label}`, result.error);
    process.exit(1);
  }
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL as string, process.env.SUPABASE_SERVICE_ROLE_KEY as string, {
  auth: { persistSession: false },
});

const payload: Payload = JSON.parse(fs.readFileSync(PAYLOAD_PATH, "utf8"));
if (payload.vendor.id !== VENDOR_ID) {
  console.error(`REFUSING: payload vendor id ${payload.vendor.id} does not match target ${VENDOR_ID}`);
  process.exit(1);
}

// ---------- 0. Confirm vendor before writing anything ----------

const vendor = mustSucceed<{ id: string; name: string; status: string }>(
  "fetch vendor",
  await supabase.from("vendors").select("id, name, status").eq("id", VENDOR_ID).single()
);
if (!/sapthagiri/i.test(vendor.name)) {
  console.error(`REFUSING TO PROCEED: vendor ${VENDOR_ID} is "${vendor.name}", not Sapthagiri.`);
  process.exit(1);
}
console.log(`Confirmed vendor: "${vendor.name}" (${VENDOR_ID}, status=${vendor.status})`);

// ---------- 1. Build the full plan from the JSON (no DB calls yet) ----------

function buildGroupLabelMap(section: Section): Map<string, string> {
  const map = new Map<string, string>();
  for (const group of section.subgroups ?? []) {
    for (const item of group.items) {
      if (!map.has(item)) map.set(item, group.name); // first-subgroup-wins
      else if (map.get(item) !== group.name) {
        console.log(
          `  note: "${item}" in section "${section.name}" belongs to multiple subgroups (` +
            `"${map.get(item)}" kept, "${group.name}" ignored)`
        );
      }
    }
  }
  return map;
}

type SlotSpec = { selectionsCount: number | undefined; isLocked: boolean; itemNames: string[]; label: string };

function buildSlotSpecs(section: Section): SlotSpec[] {
  if (section.selection_rule.type === "all") {
    return [{ selectionsCount: undefined, isLocked: true, itemNames: section.items, label: "all" }];
  }
  if (section.selection_rule.type === "choose") {
    return [{ selectionsCount: section.selection_rule.count, isLocked: false, itemNames: section.items, label: "choose" }];
  }
  // choose_split
  const indianGroup = section.subgroups?.find((g) => g.name.toLowerCase() === "indian");
  const importedGroup = section.subgroups?.find((g) => g.name.toLowerCase() === "imported");
  if (!indianGroup || !importedGroup) {
    console.error(`FAILED: section "${section.name}" is choose_split but is missing an Indian/Imported subgroup`);
    process.exit(1);
  }
  return [
    { selectionsCount: section.selection_rule.indian, isLocked: false, itemNames: indianGroup.items, label: "Indian" },
    { selectionsCount: section.selection_rule.imported, isLocked: false, itemNames: importedGroup.items, label: "Imported" },
  ];
}

type CategoryPlan = { name: string; firstSeq: number; items: Map<string, { groupLabel: string | null }> };
const categoryPlans = new Map<string, CategoryPlan>();

function planItems(categoryName: string, seq: number, itemNames: string[], groupLabelMap: Map<string, string>) {
  let plan = categoryPlans.get(categoryName);
  if (!plan) {
    plan = { name: categoryName, firstSeq: seq, items: new Map() };
    categoryPlans.set(categoryName, plan);
  }
  for (const name of itemNames) {
    const groupLabel = groupLabelMap.get(name) ?? null;
    const existing = plan.items.get(name);
    if (!existing) {
      plan.items.set(name, { groupLabel });
    } else if (existing.groupLabel !== groupLabel && groupLabel !== null) {
      // Only warn if a real (non-null) label conflicts with a previously-seen one -
      // doesn't happen in this dataset, but fail loud rather than silently pick one.
      console.log(`  note: "${name}" in category "${categoryName}" has conflicting group labels ("${existing.groupLabel}" vs "${groupLabel}") - keeping the first`);
    }
  }
  return plan;
}

type MenuPlan = {
  menuName: string;
  pricePerPax: number;
  cuisine: string;
  sections: { categoryName: string; slots: SlotSpec[] }[];
};

const menuPlans: MenuPlan[] = [];
for (const menu of payload.menus) {
  const sections: MenuPlan["sections"] = [];
  for (const section of menu.sections) {
    const groupLabelMap = buildGroupLabelMap(section);
    planItems(section.name, section.seq, section.items, groupLabelMap);
    const slots = buildSlotSpecs(section);
    // Fruit Stall's split slots need their own group_label too, applied on top of
    // whatever buildGroupLabelMap already captured (same items, same subgroup names).
    for (const slot of slots) {
      if (slot.label === "Indian" || slot.label === "Imported") {
        for (const name of slot.itemNames) {
          const plan = categoryPlans.get(section.name)!;
          const existing = plan.items.get(name);
          if (existing && existing.groupLabel === null) existing.groupLabel = slot.label;
        }
      }
    }
    sections.push({ categoryName: section.name, slots });
  }
  menuPlans.push({ menuName: menu.menu_name, pricePerPax: menu.price_per_pax, cuisine: menu.cuisine, sections });
}

console.log(`\nPlan: ${categoryPlans.size} distinct categories, ${menuPlans.length} packages.`);

// ---------- 2. Fetch existing DB state for this vendor ----------

const existingCategories = mustSucceed(
  "fetch existing categories",
  await supabase.from("menu_categories").select("id, name, sort_order").eq("vendor_id", VENDOR_ID)
);
const categoryIdByName = new Map(existingCategories.map((c) => [c.name, c.id] as const));

const existingItems: { id: string; category_id: string; name: string; group_label: string | null }[] = [];
{
  // paginate - PostgREST caps a single select() at 1000 rows
  for (let from = 0; ; from += 1000) {
    const page = mustSucceed(
      `fetch existing items [${from}-${from + 999}]`,
      await supabase.from("menu_items").select("id, category_id, name, group_label").eq("vendor_id", VENDOR_ID).range(from, from + 999)
    );
    existingItems.push(...page);
    if (page.length < 1000) break;
  }
}
const itemIdByKey = new Map<string, { id: string; category_id: string; name: string; group_label: string | null }>(
  existingItems.map((i) => [`${i.category_id}:::${i.name}`, i])
);

const existingPackages = mustSucceed(
  "fetch existing packages",
  await supabase.from("packages").select("id, name, base_price_pp, description, is_active").eq("vendor_id", VENDOR_ID)
);
const packageByName = new Map(existingPackages.map((p) => [p.name, p] as const));

const existingSlots = existingPackages.length
  ? mustSucceed(
      "fetch existing slots",
      await supabase
        .from("package_slots")
        .select("id, package_id, category_id, selections_count, is_locked")
        .in(
          "package_id",
          existingPackages.map((p) => p.id)
        )
    )
  : [];
function slotKey(packageId: string, categoryId: string, isLocked: boolean, selectionsCount: number | undefined) {
  return isLocked ? `${packageId}:::${categoryId}:::locked` : `${packageId}:::${categoryId}:::${selectionsCount}`;
}
const slotByKey = new Map(existingSlots.map((s) => [slotKey(s.package_id, s.category_id, s.is_locked, s.selections_count), s] as const));

// ---------- 3. Diff ----------

const categoriesToInsert: { vendor_id: string; name: string; sort_order: number }[] = [];
for (const plan of categoryPlans.values()) {
  if (!categoryIdByName.has(plan.name)) {
    categoriesToInsert.push({ vendor_id: VENDOR_ID, name: plan.name, sort_order: plan.firstSeq });
  }
}

console.log(`\n=== Categories: ${categoriesToInsert.length} to create, ${categoryPlans.size - categoriesToInsert.length} already exist ===`);
for (const c of categoriesToInsert) console.log(`  + ${c.name} (sort_order ${c.sort_order})`);

// ---------- 4. Apply categories (need real ids before planning items/packages) ----------

if (!DRY_RUN && categoriesToInsert.length > 0) {
  const inserted = mustSucceed("insert categories", await supabase.from("menu_categories").insert(categoriesToInsert).select("id, name"));
  for (const c of inserted) categoryIdByName.set(c.name, c.id);
}
if (DRY_RUN) {
  // Dry-run still needs ids to plan items/slots against - use placeholders.
  for (const c of categoriesToInsert) categoryIdByName.set(c.name, `PLANNED:${c.name}`);
}

// ---------- 5. Items diff ----------

const itemsToInsert: { vendor_id: string; category_id: string; name: string; is_veg: boolean; group_label: string | null }[] = [];
const itemsToUpdate: { id: string; group_label: string | null }[] = [];

for (const plan of categoryPlans.values()) {
  const categoryId = categoryIdByName.get(plan.name)!;
  for (const [name, meta] of plan.items) {
    const key = `${categoryId}:::${name}`;
    const existing = itemIdByKey.get(key);
    if (!existing) {
      itemsToInsert.push({ vendor_id: VENDOR_ID, category_id: categoryId, name, is_veg: true, group_label: meta.groupLabel });
    } else if (existing.group_label !== meta.groupLabel) {
      itemsToUpdate.push({ id: existing.id, group_label: meta.groupLabel });
    }
  }
}

console.log(`\n=== Items: ${itemsToInsert.length} to create, ${itemsToUpdate.length} to update (group_label), rest unchanged ===`);
const totalPlannedItems = [...categoryPlans.values()].reduce((n, p) => n + p.items.size, 0);
console.log(`  Total distinct (category, spelling) items across all 3 menus: ${totalPlannedItems}`);

// ---------- 6. Apply items ----------

if (!DRY_RUN) {
  if (itemsToInsert.length > 0) {
    for (let i = 0; i < itemsToInsert.length; i += 500) {
      const chunk = itemsToInsert.slice(i, i + 500);
      const inserted = mustSucceed(
        `insert items [${i}-${i + chunk.length - 1}]`,
        await supabase.from("menu_items").insert(chunk).select("id, category_id, name, group_label")
      );
      for (const it of inserted) itemIdByKey.set(`${it.category_id}:::${it.name}`, it);
    }
  }
  if (itemsToUpdate.length > 0) {
    mustSucceedVoid("update item group_labels", await supabase.from("menu_items").upsert(itemsToUpdate, { onConflict: "id" }));
    for (const u of itemsToUpdate) {
      const found = [...itemIdByKey.values()].find((v) => v.id === u.id);
      if (found) found.group_label = u.group_label;
    }
  }
} else {
  for (const it of itemsToInsert) itemIdByKey.set(`${it.category_id}:::${it.name}`, { id: `PLANNED:${it.name}`, category_id: it.category_id, name: it.name, group_label: it.group_label });
}

// ---------- 7. Packages diff ----------

type PackageDiff = { insert: boolean; id?: string; row: { vendor_id: string; name: string; description: string; base_price_pp: number; is_active: boolean } };
const packageDiffs: PackageDiff[] = menuPlans.map((mp) => {
  const row = { vendor_id: VENDOR_ID, name: mp.menuName, description: mp.cuisine, base_price_pp: mp.pricePerPax, is_active: true };
  const existing = packageByName.get(mp.menuName);
  return existing ? { insert: false, id: existing.id, row } : { insert: true, row };
});

console.log(`\n=== Packages: ${packageDiffs.filter((p) => p.insert).length} to create, ${packageDiffs.filter((p) => !p.insert).length} already exist ===`);
for (const mp of menuPlans) console.log(`  ${mp.menuName}: Rs.${mp.pricePerPax}/pax, ${mp.sections.length} sections`);

// ---------- 8. Apply packages ----------

const packageIdByName = new Map<string, string>();
for (const p of packageDiffs) {
  if (p.insert) {
    if (!DRY_RUN) {
      const inserted = mustSucceed<{ id: string; name: string }>(
        "insert package",
        await supabase.from("packages").insert(p.row).select("id, name").single()
      );
      packageIdByName.set(inserted.name, inserted.id);
    } else {
      packageIdByName.set(p.row.name, `PLANNED:${p.row.name}`);
    }
  } else {
    if (!DRY_RUN) {
      mustSucceedVoid("update package", await supabase.from("packages").update(p.row).eq("id", p.id!));
    }
    packageIdByName.set(p.row.name, p.id!);
  }
}

// ---------- 9. Slots + slot items diff/apply, per menu ----------

let slotsCreated = 0;
let slotsUpdated = 0;
let slotItemsUpserted = 0;

for (const mp of menuPlans) {
  const packageId = packageIdByName.get(mp.menuName)!;
  let sortOrder = 0;
  for (const section of mp.sections) {
    const categoryId = categoryIdByName.get(section.categoryName)!;
    for (const slot of section.slots) {
      sortOrder += 1;
      const key = slotKey(packageId, categoryId, slot.isLocked, slot.selectionsCount);
      const existing = slotByKey.get(key);
      let slotId: string;
      if (!existing) {
        slotsCreated += 1;
        const row: Record<string, unknown> = { package_id: packageId, category_id: categoryId, sort_order: sortOrder, is_locked: slot.isLocked };
        if (slot.selectionsCount !== undefined) row.selections_count = slot.selectionsCount; // omit for locked slots - DB default (1) applies, unused once locked
        if (!DRY_RUN) {
          const inserted = mustSucceed<{ id: string }>(
            "insert slot",
            await supabase.from("package_slots").insert(row).select("id").single()
          );
          slotId = inserted.id;
          slotByKey.set(key, { id: slotId, package_id: packageId, category_id: categoryId, selections_count: slot.selectionsCount ?? 1, is_locked: slot.isLocked });
        } else {
          slotId = `PLANNED:${mp.menuName}:${section.categoryName}:${slot.label}`;
        }
      } else {
        slotsUpdated += 1;
        slotId = existing.id;
        if (!DRY_RUN) {
          const row: Record<string, unknown> = { sort_order: sortOrder, is_locked: slot.isLocked };
          if (slot.selectionsCount !== undefined) row.selections_count = slot.selectionsCount;
          mustSucceedVoid("update slot", await supabase.from("package_slots").update(row).eq("id", slotId));
        }
      }

      const slotItemRows = slot.itemNames.map((name, idx) => {
        const item = itemIdByKey.get(`${categoryId}:::${name}`);
        if (!item) {
          console.error(`FAILED: item "${name}" in category "${section.categoryName}" was never planned`);
          process.exit(1);
        }
        return { slot_id: slotId, item_id: item.id, sort_order: idx };
      });
      slotItemsUpserted += slotItemRows.length;

      if (!DRY_RUN) {
        for (let i = 0; i < slotItemRows.length; i += 500) {
          const chunk = slotItemRows.slice(i, i + 500);
          // Deliberately omit is_default from the payload: PostgREST's upsert only
          // SETs the columns present in the row on conflict, so an existing row's
          // admin-set is_default is left untouched; new rows get the DB default (false).
          mustSucceedVoid("upsert slot items", await supabase.from("package_slot_items").upsert(chunk, { onConflict: "slot_id,item_id" }));
        }
      }
    }
  }
}

console.log(`\n=== Slots: ${slotsCreated} to create, ${slotsUpdated} to update/unchanged ===`);
console.log(`=== Slot items: ${slotItemsUpserted} rows to upsert (insert-or-refresh-sort_order) ===`);

// ---------- 10. Vendor terms ----------

console.log(`\n=== Vendor terms: ${payload.terms.length} entries -> vendors.internal_terms ===`);
if (!DRY_RUN) {
  mustSucceedVoid("update vendor internal_terms", await supabase.from("vendors").update({ internal_terms: payload.terms }).eq("id", VENDOR_ID));
}

// ---------- Done (dry run stops here) ----------

if (DRY_RUN) {
  console.log("\nDRY_RUN (--dry-run) - no writes applied.");
  process.exit(0);
}

console.log("\nApplied.");

// ---------- 11. Verify ----------

console.log("\n=== Verification ===");
for (const mp of menuPlans) {
  const packageId = packageIdByName.get(mp.menuName)!;
  const slots = mustSucceed(
    "verify slots",
    await supabase.from("package_slots").select("id, category_id, selections_count, is_locked").eq("package_id", packageId)
  );
  const slotIds = slots.map((s) => s.id);
  const items = slotIds.length
    ? mustSucceed("verify slot items", await supabase.from("package_slot_items").select("id").in("slot_id", slotIds))
    : [];
  const distinctSections = new Set(slots.map((s) => s.category_id)).size;
  console.log(
    `${mp.menuName}: ${distinctSections} sections (${slots.length} slots - Fruit Stall counts as 2), ${items.length} items`
  );
}
