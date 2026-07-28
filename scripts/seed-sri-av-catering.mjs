// One-off seed for Sri AV catering (vendor already exists - never creates a vendor
// row). Adds the Non-Veg (₹600/plate) and Veg (₹500/plate) packages and their
// dishes using ONLY this vendor's existing 14 menu_categories - no new categories,
// no schema changes. Idempotent: categories/items are found-or-created by
// (category, name); packages are found-or-created by name; each package's
// package_slots/package_slot_items are cleared and recreated every run so reruns
// never duplicate. Every slot's selections_count equals its pool size (all dishes
// included, nothing optional to pick) - the same "included, not selectable" trick
// used elsewhere in this codebase for fixed inclusions.
//
// Service inclusions (LED counters, golden plates, water bottles, welcome girls,
// catering boys) are not dishes - there's no separate table for them, so they're
// folded into each package's free-text `description`, matching how other vendors'
// package descriptions already summarize non-food inclusions.

import { createClient } from "@supabase/supabase-js";

const VENDOR_ID = "e5119c8e-c838-4953-9d56-a585b09a2494";

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

// ---------- 0. Confirm the vendor UUID resolves to Sri AV before writing anything ----------

const vendor = mustSucceed(
  "fetch vendor by id",
  await supabase.from("vendors").select("id, name, slug, status").eq("id", VENDOR_ID).single()
);
if (!/sri\s*av/i.test(vendor.name)) {
  console.error(`REFUSING TO PROCEED: vendor ${VENDOR_ID} is "${vendor.name}", not Sri AV Catering.`);
  process.exit(1);
}
console.log(`Confirmed vendor: "${vendor.name}" (${vendor.id}, slug=${vendor.slug}, status=${vendor.status})`);

// ---------- 1. Dishes, grouped under this vendor's EXISTING categories only ----------
// (isVeg is per-dish; a veg dish can appear in the Non-Veg package's category list.)

const DISH_ISVEG = {
  "Badam Milk": true,
  "Watermelon Juice": true,
  "Spring Roll": true,
  "Corn Samosa": true,
  "Green Salad": true,
  "Sprouts Salad": true,
  "Mirchi Bajji": true,
  "French Fries": true,
  "Pani Puri": true,
  "Samosa Cutlet": true,
  "Dahi Vada": true,
  "Onion-Lemon-Carrot Salad": true,
  "Soft Noodles": true,
  "Manchuria (Wet)": true,
  "Schezwan Fried Rice": true,
  "Masala Dosa": true,
  "Sambar Idly": true,
  "Rumali Roti": true,
  "Pulka": true,
  "Butter Naan": true,
  "Mutton Biryani": false,
  "Bagara Rice": true,
  "Plain Rice": true,
  "Veg Biryani": true,
  "Pulihora": true,
  "Tomato Rice": true,
  "Red Chicken": false,
  "Green Chicken": false,
  "Chicken 65": false,
  "Apollo Fish Fry": false,
  "Paneer Masala": true,
  "Bagara Baingan": true,
  "Bendakaya Fry (Okra Fry)": true,
  "Paneer Butter Masala": true,
  "Mixed Veg Curry": true,
  "Mirchi Masala Curry": true,
  "Palakura Pappu (Spinach Dal)": true,
  "Sambar": true,
  "Mango Dal": true,
  "Curd": true,
  "Raita": true,
  "Tomato Pickle": true,
  "Gongura Pickle": true,
  "Kandi Podi": true,
  "Karam Podi": true,
  "Ghee": true,
  "Papad": true,
  "Kaddu ka Kheer": true,
  "Jalebi (Live Counter)": true,
  "Honeymoon Delight": true,
  "Fresh Fruit Counter (5 varieties)": true,
  "Kheer": true,
  "Ice Cream": true,
  "Sweet Pan": true,
  "Fire Pan": true,
};

const NON_VEG_PACKAGE = {
  name: "Non-Veg Package",
  price: 600,
  description:
    "Welcome drink, starters and salads, mirchi bajji, rumali roti, mutton biryani with bagara and plain rice, " +
    "chicken and paneer curries, dal, sambar, curd, tomato pickle, live sweets counter, dessert, ice cream, " +
    "live fruit counter (5 varieties) and live pan counter. Includes LED counters, golden plates, water bottles, " +
    "welcome girls and catering boys.",
  categories: {
    "Welcome drinks": ["Badam Milk"],
    Starters: ["Spring Roll", "Corn Samosa", "Green Salad", "Sprouts Salad", "Mirchi Bajji"],
    Breads: ["Rumali Roti"],
    "Rice & biryani": ["Mutton Biryani", "Bagara Rice", "Plain Rice"],
    Curries: ["Red Chicken", "Green Chicken", "Chicken 65", "Apollo Fish Fry", "Paneer Masala", "Bagara Baingan", "Bendakaya Fry (Okra Fry)"],
    Dal: ["Palakura Pappu (Spinach Dal)", "Sambar"],
    "Curd & raita": ["Curd"],
    "Pickles & chutneys": ["Tomato Pickle"],
    Desserts: ["Kaddu ka Kheer", "Jalebi (Live Counter)", "Honeymoon Delight", "Fresh Fruit Counter (5 varieties)"],
    "Ice creams": ["Ice Cream"],
    "Paan & mouth fresheners": ["Sweet Pan", "Fire Pan"],
  },
};

const VEG_PACKAGE = {
  name: "Veg Package",
  price: 500,
  description:
    "Welcome drinks, starters and salads, chaat counter, Chinese counter, South Indian tiffins, mirchi bajji, " +
    "Indian breads, vegetable curries, dal, sambar, curd, raita, pickles, podi, ghee, papad, rice and biryani, " +
    "live sweets counter, dessert, ice cream, live fruit counter (5 varieties) and live pan counter. Includes " +
    "LED counters, golden plates, water bottles, welcome girls and catering boys.",
  categories: {
    "Welcome drinks": ["Watermelon Juice", "Badam Milk"],
    Starters: ["Spring Roll", "Corn Samosa", "French Fries", "Pani Puri", "Samosa Cutlet", "Dahi Vada", "Onion-Lemon-Carrot Salad", "Sprouts Salad"],
    "Main course": ["Soft Noodles", "Manchuria (Wet)", "Schezwan Fried Rice", "Masala Dosa", "Sambar Idly"],
    Breads: ["Rumali Roti", "Pulka", "Butter Naan"],
    Curries: ["Paneer Butter Masala", "Bagara Baingan", "Mixed Veg Curry", "Mirchi Masala Curry", "Bendakaya Fry (Okra Fry)"],
    Dal: ["Mango Dal", "Sambar"],
    "Curd & raita": ["Curd", "Raita"],
    "Pickles & chutneys": ["Tomato Pickle", "Gongura Pickle", "Kandi Podi", "Karam Podi", "Ghee", "Papad"],
    "Rice & biryani": ["Veg Biryani", "Bagara Rice", "Plain Rice", "Pulihora", "Tomato Rice"],
    Desserts: ["Kheer", "Jalebi (Live Counter)", "Honeymoon Delight", "Fresh Fruit Counter (5 varieties)"],
    "Ice creams": ["Ice Cream"],
    "Paan & mouth fresheners": ["Sweet Pan", "Fire Pan"],
  },
};

// ---------- 2. Categories: verify all needed ones already exist (no new categories) ----------

const existingCategories = mustSucceed(
  "fetch existing categories",
  await supabase.from("menu_categories").select("id, name").eq("vendor_id", VENDOR_ID)
);
const categoryIdByName = new Map(existingCategories.map((c) => [c.name, c.id]));

const neededCategoryNames = new Set([
  ...Object.keys(NON_VEG_PACKAGE.categories),
  ...Object.keys(VEG_PACKAGE.categories),
]);
const missingCategories = [...neededCategoryNames].filter((n) => !categoryIdByName.has(n));
if (missingCategories.length > 0) {
  console.error(`REFUSING TO PROCEED: these categories don't already exist on this vendor: ${missingCategories.join(", ")}`);
  process.exit(1);
}
console.log(`All ${neededCategoryNames.size} needed categories already exist on this vendor - none created.`);

// ---------- 3. Items: found-or-created, keyed by (category, name) - dedupes across both packages ----------

const existingItems = mustSucceed(
  "fetch existing items",
  await supabase.from("menu_items").select("id, name, category_id").eq("vendor_id", VENDOR_ID)
);
const itemIdByCategoryAndName = new Map(existingItems.map((it) => [`${it.category_id}::${it.name}`, it.id]));

const itemsCreated = [];
const itemsMatched = [];
for (const pkg of [NON_VEG_PACKAGE, VEG_PACKAGE]) {
  for (const [categoryName, dishNames] of Object.entries(pkg.categories)) {
    const categoryId = categoryIdByName.get(categoryName);
    for (const dishName of dishNames) {
      const key = `${categoryId}::${dishName}`;
      if (itemIdByCategoryAndName.has(key)) {
        if (!itemsMatched.includes(`${categoryName} / ${dishName}`)) itemsMatched.push(`${categoryName} / ${dishName}`);
        continue;
      }
      const row = mustSucceed(
        `create item "${dishName}" (${categoryName})`,
        await supabase
          .from("menu_items")
          .insert({
            vendor_id: VENDOR_ID,
            category_id: categoryId,
            name: dishName,
            is_veg: DISH_ISVEG[dishName] ?? true,
            base_price_pp: null,
          })
          .select()
          .single()
      );
      itemIdByCategoryAndName.set(key, row.id);
      itemsCreated.push(`${categoryName} / ${dishName}`);
    }
  }
}

function itemId(categoryName, dishName) {
  const id = itemIdByCategoryAndName.get(`${categoryIdByName.get(categoryName)}::${dishName}`);
  if (!id) throw new Error(`Missing item "${dishName}" in category "${categoryName}"`);
  return id;
}

// ---------- 4. Packages: found-or-created by name, slots cleared+recreated each run ----------

const existingPackages = mustSucceed(
  "fetch existing packages",
  await supabase.from("packages").select("id, name").eq("vendor_id", VENDOR_ID)
);
const packageIdByName = new Map(existingPackages.map((p) => [p.name, p.id]));

const packageSummaries = [];
for (const spec of [NON_VEG_PACKAGE, VEG_PACKAGE]) {
  let packageId = packageIdByName.get(spec.name);
  const packageFields = {
    vendor_id: VENDOR_ID,
    name: spec.name,
    description: spec.description,
    base_price_pp: spec.price,
    is_active: true,
  };

  let wasCreated = false;
  if (packageId) {
    mustSucceed(`update package "${spec.name}"`, await supabase.from("packages").update(packageFields).eq("id", packageId));
  } else {
    const row = mustSucceed(`create package "${spec.name}"`, await supabase.from("packages").insert(packageFields).select().single());
    packageId = row.id;
    wasCreated = true;
  }

  mustSucceed(`clear existing slots for "${spec.name}"`, await supabase.from("package_slots").delete().eq("package_id", packageId));

  const slotSummaries = [];
  let sortOrder = 1;
  for (const [categoryName, dishNames] of Object.entries(spec.categories)) {
    const slotRow = mustSucceed(
      `create slot "${categoryName}" for "${spec.name}"`,
      await supabase
        .from("package_slots")
        .insert({ package_id: packageId, category_id: categoryIdByName.get(categoryName), selections_count: dishNames.length, sort_order: sortOrder })
        .select()
        .single()
    );
    sortOrder += 1;

    const slotItemRows = dishNames.map((dishName) => ({
      slot_id: slotRow.id,
      item_id: itemId(categoryName, dishName),
      is_default: true,
    }));
    mustSucceed(`insert slot items for "${categoryName}" (${spec.name})`, await supabase.from("package_slot_items").insert(slotItemRows));

    slotSummaries.push(`${categoryName}: ${dishNames.length} dish(es) included`);
  }

  packageSummaries.push({ name: spec.name, price: spec.price, wasCreated, slots: slotSummaries, dishCount: Object.values(spec.categories).flat().length });
}

// ---------- Summary ----------

console.log("\n=== Items ===");
console.log(`Newly created: ${itemsCreated.length ? itemsCreated.join(", ") : "(none)"}`);
console.log(`Already existed (matched, reused): ${itemsMatched.length ? itemsMatched.join(", ") : "(none)"}`);

console.log("\n=== Packages ===");
for (const pkg of packageSummaries) {
  console.log(`\n${pkg.name}${pkg.wasCreated ? " (created)" : " (already existed, updated)"} — ₹${pkg.price}/plate, ${pkg.dishCount} dishes`);
  for (const line of pkg.slots) console.log(`  - ${line}`);
}
