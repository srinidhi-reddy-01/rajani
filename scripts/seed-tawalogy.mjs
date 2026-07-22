// One-off seed for the Tawalogy by Shriji Rasoi onboarding (onboarding/tawalogy.md).
// Uses the service-role key server-side. Safe to re-run: profile fields are set
// idempotently, categories/items are created only if missing, and each package's
// slots/slot-items are dropped and rebuilt fresh on every run so slot rules always
// match this file exactly. Does NOT touch vendors.status.

import { createClient } from "@supabase/supabase-js";

const VENDOR_ID = "877771c8-e5a9-43cc-9f31-92d9464b8270";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

function mustSucceed(label, { data, error }) {
  if (error) {
    console.error(`FAILED: ${label}`, error);
    process.exit(1);
  }
  return data;
}

// ---------- 1. Vendor profile fields ----------

const vendorUpdate = {
  name: "Tawalogy by Shriji Rasoi",
  description:
    "Pure vegetarian and Jain food specialists with 18 years of catering experience. " +
    "House warmings, birthday parties, corporate events and wedding functions. " +
    'Customisable menus, starting from ₹400 per person. "Smells like Home, Tastes like Heaven."',
  established_year: 2008,
  cuisine_specialities: ["North Indian", "Jain Food Special"],
  event_specialities: ["Wedding", "Corporate event"],
  is_verified: false,
};

const updatedVendor = mustSucceed(
  "update vendor profile",
  await supabase.from("vendors").update(vendorUpdate).eq("id", VENDOR_ID).select().single()
);

// ---------- 2. Menu categories + items (no dish prices) ----------

const CATEGORY_SPEC = [
  { name: "Welcome drinks", items: ["Mojito", "Jaljeera", "Fruit Punch"] },
  { name: "Soups", items: ["Tomato Soup", "Hot and Sour Soup", "Manchow Soup"] },
  { name: "Starters", items: ["Kebab", "Mini Samosa", "Veg Manchurian", "Noodles"] },
  { name: "Dal", items: ["Dal Fry", "Dal Tadka", "Dal Makhani"] },
  { name: "Curries", items: ["Paneer Curry", "Seasonal Veg Curry"] },
  { name: "Rice", items: ["Plain Rice", "Jeera Rice", "Biryani"] },
  { name: "Breads", items: ["Phulka", "Poori", "Tawa Paratha"] },
  { name: "Desserts", items: ["Halwa", "Kheer", "Gulab Jamun", "Ice Cream"] },
  // Included with every package, not user-selectable. Modeled as a category whose
  // package slot always requires picking every item in it (selections_count ===
  // pool size), so there's never an alternate to swap in — effectively "included".
  {
    name: "Accompaniments",
    items: ["Green Salad", "Papad", "Pickle", "Raita", "Chutney", "Mouth Freshener", "Water Bottles (250ml)"],
  },
];

const existingCategories = mustSucceed(
  "fetch existing categories",
  await supabase.from("menu_categories").select("id, name").eq("vendor_id", VENDOR_ID)
);
const categoryIdByName = new Map(existingCategories.map((c) => [c.name, c.id]));

const categoriesCreated = [];
for (let i = 0; i < CATEGORY_SPEC.length; i++) {
  const { name } = CATEGORY_SPEC[i];
  if (categoryIdByName.has(name)) continue;
  const row = mustSucceed(
    `create category "${name}"`,
    await supabase
      .from("menu_categories")
      .insert({ vendor_id: VENDOR_ID, name, sort_order: i + 1 })
      .select()
      .single()
  );
  categoryIdByName.set(name, row.id);
  categoriesCreated.push(name);
}

const existingItems = mustSucceed(
  "fetch existing items",
  await supabase.from("menu_items").select("id, name, category_id").eq("vendor_id", VENDOR_ID)
);
const itemIdByCategoryAndName = new Map(existingItems.map((it) => [`${it.category_id}::${it.name}`, it.id]));

const itemsCreated = [];
for (const { name: categoryName, items } of CATEGORY_SPEC) {
  const categoryId = categoryIdByName.get(categoryName);
  for (const itemName of items) {
    const key = `${categoryId}::${itemName}`;
    if (itemIdByCategoryAndName.has(key)) continue;
    const row = mustSucceed(
      `create item "${itemName}" (${categoryName})`,
      await supabase
        .from("menu_items")
        .insert({
          vendor_id: VENDOR_ID,
          category_id: categoryId,
          name: itemName,
          is_veg: true,
          base_price_pp: null,
        })
        .select()
        .single()
    );
    itemIdByCategoryAndName.set(key, row.id);
    itemsCreated.push(`${categoryName} / ${itemName}`);
  }
}

function itemId(categoryName, itemName) {
  const id = itemIdByCategoryAndName.get(`${categoryIdByName.get(categoryName)}::${itemName}`);
  if (!id) throw new Error(`Missing item "${itemName}" in category "${categoryName}"`);
  return id;
}

// ---------- 3. Packages + slot rules ----------
// Each slot: { category, pick, pool, defaults }. `pool` restricts which items of the
// category are offered in this package (defaults to the full category); `defaults`
// are pre-selected up to `pick` count.

const PACKAGE_SPEC = [
  {
    name: "₹799 Grand Package",
    base_price_pp: 799,
    min_plates: 50,
    is_default: true,
    description:
      "Full festive spread. Includes salad, papad, pickle, raita, chutney, mouth freshener, water bottles, " +
      "melamine plates and eco-friendly disposables. Biryani ₹50/plate extra. 5% GST applicable. Minimum 50 plates.",
    slots: [
      { category: "Welcome drinks", pick: 1, defaults: ["Mojito"] },
      { category: "Soups", pick: 1, defaults: ["Tomato Soup"] },
      { category: "Starters", pick: 3, defaults: ["Kebab", "Mini Samosa", "Veg Manchurian"] },
      { category: "Dal", pick: 1, defaults: ["Dal Tadka"] },
      { category: "Curries", pick: 2, defaults: ["Paneer Curry", "Seasonal Veg Curry"] },
      { category: "Rice", pick: 1, defaults: ["Plain Rice"] },
      { category: "Breads", pick: 1, defaults: ["Phulka"] },
      { category: "Desserts", pick: 3, defaults: ["Halwa", "Kheer", "Gulab Jamun"] },
      {
        category: "Accompaniments",
        pick: 7,
        defaults: ["Green Salad", "Papad", "Pickle", "Raita", "Chutney", "Mouth Freshener", "Water Bottles (250ml)"],
      },
    ],
  },
  {
    name: "₹699 Classic Package",
    base_price_pp: 699,
    min_plates: 50,
    is_default: false,
    description:
      "Compact celebration menu. Includes salad, papad, pickle, raita, chutney, mouth freshener, water bottles, " +
      "melamine plates and eco-friendly disposables. Biryani ₹50/plate extra. 5% GST applicable. Minimum 50 plates.",
    slots: [
      // Restricted pool: Mojito/Jaljeera only, per spec.
      { category: "Welcome drinks", pick: 1, pool: ["Mojito", "Jaljeera"], defaults: ["Mojito"] },
      { category: "Starters", pick: 2, defaults: ["Kebab", "Mini Samosa"] },
      { category: "Dal", pick: 1, defaults: ["Dal Tadka"] },
      { category: "Curries", pick: 2, defaults: ["Paneer Curry", "Seasonal Veg Curry"] },
      { category: "Rice", pick: 1, defaults: ["Plain Rice"] },
      { category: "Breads", pick: 1, defaults: ["Phulka"] },
      { category: "Desserts", pick: 2, defaults: ["Halwa", "Kheer"] },
      {
        category: "Accompaniments",
        pick: 7,
        defaults: ["Green Salad", "Papad", "Pickle", "Raita", "Chutney", "Mouth Freshener", "Water Bottles (250ml)"],
      },
    ],
  },
];

const existingPackages = mustSucceed(
  "fetch existing packages",
  await supabase.from("packages").select("id, name").eq("vendor_id", VENDOR_ID)
);
const packageIdByName = new Map(existingPackages.map((p) => [p.name, p.id]));

const packageSummaries = [];
for (const spec of PACKAGE_SPEC) {
  let packageId = packageIdByName.get(spec.name);
  const packageFields = {
    vendor_id: VENDOR_ID,
    name: spec.name,
    description: spec.description,
    base_price_pp: spec.base_price_pp,
    min_plates: spec.min_plates,
    is_default: spec.is_default,
    is_active: true,
  };

  if (packageId) {
    mustSucceed(
      `update package "${spec.name}"`,
      await supabase.from("packages").update(packageFields).eq("id", packageId)
    );
  } else {
    const row = mustSucceed(
      `create package "${spec.name}"`,
      await supabase.from("packages").insert(packageFields).select().single()
    );
    packageId = row.id;
  }

  // Rebuild slots from scratch every run so the rule set always matches this file
  // exactly (package_slot_items cascade-deletes with their slot).
  mustSucceed(
    `clear existing slots for "${spec.name}"`,
    await supabase.from("package_slots").delete().eq("package_id", packageId)
  );

  const slotSummaries = [];
  for (let i = 0; i < spec.slots.length; i++) {
    const slot = spec.slots[i];
    const slotRow = mustSucceed(
      `create slot "${slot.category}" for "${spec.name}"`,
      await supabase
        .from("package_slots")
        .insert({
          package_id: packageId,
          category_id: categoryIdByName.get(slot.category),
          selections_count: slot.pick,
          sort_order: i + 1,
        })
        .select()
        .single()
    );

    const poolNames = slot.pool ?? CATEGORY_SPEC.find((c) => c.name === slot.category).items;
    const slotItemRows = poolNames.map((name) => ({
      slot_id: slotRow.id,
      item_id: itemId(slot.category, name),
      is_default: slot.defaults.includes(name),
    }));
    mustSucceed(
      `insert slot items for "${slot.category}" (${spec.name})`,
      await supabase.from("package_slot_items").insert(slotItemRows)
    );

    slotSummaries.push(`${slot.category}: pick ${slot.pick} of ${poolNames.length} (${poolNames.join(", ")})`);
  }

  packageSummaries.push({ name: spec.name, base_price_pp: spec.base_price_pp, min_plates: spec.min_plates, slots: slotSummaries });
}

// ---------- Summary ----------

console.log("\n=== Vendor fields set ===");
console.log(`name: ${updatedVendor.name}`);
console.log(`description: ${updatedVendor.description}`);
console.log(`established_year: ${updatedVendor.established_year}`);
console.log(`cuisine_specialities: ${updatedVendor.cuisine_specialities.join(", ")}`);
console.log(`event_specialities: ${updatedVendor.event_specialities.join(", ")}`);
console.log(`is_verified: ${updatedVendor.is_verified}`);
console.log(`status (unchanged): ${updatedVendor.status}`);

console.log("\n=== Categories/items ===");
for (const { name, items } of CATEGORY_SPEC) {
  console.log(`${name}: ${items.join(", ")}`);
}
console.log(`\nNewly created this run — categories: ${categoriesCreated.length ? categoriesCreated.join(", ") : "(none, already existed)"}`);
console.log(`Newly created this run — items: ${itemsCreated.length ? itemsCreated.length + " item(s)" : "(none, already existed)"}`);

console.log("\n=== Packages ===");
for (const pkg of packageSummaries) {
  console.log(`\n${pkg.name} — ₹${pkg.base_price_pp}/plate, min ${pkg.min_plates} plates`);
  for (const line of pkg.slots) console.log(`  - ${line}`);
}
