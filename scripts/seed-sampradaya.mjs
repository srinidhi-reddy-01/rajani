// One-off seed for RS Sampradaya Caterers (onboarding/sampradaya.md). Extends the
// seed-tawalogy.mjs pattern: service-role key, no migration, idempotent.
//
// Profile + all categories/items are created every run. Packages are gated on
// PACKAGE_SPEC[i].price !== null - every package in the brochure is still "TBD" as
// of this file, so this run creates ZERO packages by design (see the printed
// summary). Once Sri fills in a real ₹/plate figure, edit the `price` field below
// and rerun; that package (and only that one) will be created/updated.
//
// Slot-rule caveats (documented so a reviewer can sanity-check before relying on
// them): the brochure's "X/Y N" shorthand (e.g. "Sambar/Rasam 1") is modeled as a
// pick from the FIRST-named category only, since a package_slot can only reference
// one menu_categories row. A few brochure items don't map to any category in this
// vendor's own list (Majjiga/Pachi Pulusu in Imperial, Veg Manchurian addition and
// "Khadi" in Wedding Delight/Grandeur) and are skipped, not invented. "Display"
// counters are modeled with the same included-not-selectable trick as Common items
// (pick count === pool size, so there's nothing to swap to).

import { createClient } from "@supabase/supabase-js";

const VENDOR_NAME_SEARCH = "sampradaya";
const CLEAN_NAME = "RS Sampradaya Caterers";

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

function firstN(items, n) {
  return items.slice(0, n);
}

// ---------- 0. Find-or-create the vendor ----------

const existingMatches = mustSucceed(
  "search vendors by name",
  await supabase.from("vendors").select("id, name, status").ilike("name", `%${VENDOR_NAME_SEARCH}%`)
);

let VENDOR_ID;
if (existingMatches.length > 0) {
  VENDOR_ID = existingMatches[0].id;
  console.log(`Found existing sourced vendor: "${existingMatches[0].name}" (${VENDOR_ID}, status=${existingMatches[0].status})`);
} else {
  const created = mustSucceed(
    "create vendor",
    await supabase
      .from("vendors")
      .insert({ name: CLEAN_NAME, slug: "rs-sampradaya-caterers", status: "sourced" })
      .select()
      .single()
  );
  VENDOR_ID = created.id;
  console.log(`No existing vendor matched "${VENDOR_NAME_SEARCH}" - created new row (${VENDOR_ID})`);
}

// ---------- 1. Vendor profile fields ----------
// Phone/address/area/GBP fields are left untouched - "use whatever the sourced row
// already has" (this is the point of updating rather than recreating: keep GBP data).
// Status is never touched here - Sri reviews and flips live in admin.

const vendorUpdate = {
  name: CLEAN_NAME,
  description:
    "Pure vegetarian catering for weddings, functions and corporate events, plus daily lunch box services. " +
    "Nine packages from economy thalis to grand wedding spreads with live counters — dosa, chaat, Chinese, paan and more.",
  cuisine_specialities: ["Telangana", "South Indian"],
  event_specialities: ["Wedding", "Corporate event"],
};

const updatedVendor = mustSucceed(
  "update vendor profile",
  await supabase.from("vendors").update(vendorUpdate).eq("id", VENDOR_ID).select().single()
);

// ---------- 2. Menu categories + items (no dish prices) ----------

const CATEGORY_SPEC = [
  { name: "Welcome drinks", items: ["Pineapple", "Grapes", "Fruit Punch", "Watermelon", "Litchi Punch", "Strawberry Punch", "Mango Juice", "Lemonade", "Jaljeera", "Badam Milk"] },
  { name: "Starters", items: ["Veg Bullets", "Veg Lollipop", "Gold Coin", "Veg 65", "Veg Spring Rolls", "Aloo Tikki", "Baby Corn Manchurian", "Paneer Tikka", "Samosa", "Harabhara Kabab"] },
  { name: "Salads", items: ["Green Salad", "American Salad", "Mexican Salad", "Russian Salad", "Sprouts", "Kosambari"] },
  { name: "Rotis", items: ["Rumali Roti", "Tandoori Roti", "Naan", "Butter Naan", "Baby Naan", "Kothimeer Naan", "Kulcha", "Paneer Kulcha", "Laccha Parota", "Veg Parota", "Pudina Parota", "Muli Parota", "Poori", "Masala Poori", "Palak Poori", "Chapathi", "Phulka"] },
  { name: "South Indian curries", items: ["Vankaya Karam", "Vankaya Allam Pacchimirchi", "Stuffed Brinjal", "Stuffed Donda", "Beans Coconut", "Carrot Coconut", "Mixed Veg Coconut", "Kanda Bachhali", "Panasapottu", "Aratikaya", "Aloo Curry", "Capsicum Aloo", "Cabbage Coconut", "Guttivankaya", "Vankaya Kothimeera Karam", "Capsicum Karam"] },
  { name: "North Indian curries", items: ["Bagara Baingan", "Chana Masala", "Rajma Masala", "Veg Kurma", "Capsicum Masala", "Mirchi Ka Salan", "Tomato Salan", "Paneer Butter Masala", "Methi Chaman", "Paneer Matar", "Shahi Paneer", "Dum Aloo", "Aloo Kurma", "Aloo Gobi Masala", "Babycorn Masala", "Kofta Masala", "Drumstick Masala"] },
  { name: "South Indian rice", items: ["Coconut Rice", "Lemon Rice", "Pulihora", "Aava Pulihora", "Mango Rice", "Vangi Bath", "Curd Rice", "Bisbelli Bath", "Coriander Rice", "Mint Rice"] },
  { name: "North Indian rice", items: ["Bagara Rice", "Veg Pulav", "Peas Pulav", "Veg Biryani", "Veg Dum Biryani", "Fried Rice", "Jeera Rice", "Kaju Pulav", "Tomato Rice"] },
  { name: "Fry", items: ["Bhendi Fry", "Donda Fry", "Aloo Fry", "Kandha Fry", "Kakara Fry", "Chama Fry", "Aratikaya Fry", "Carrot Fry", "Brinjal Fry", "Gobi Fry", "Beetroot Fry"] },
  { name: "Hots (bajjis & wadas)", items: ["Mirchi Bajji", "Cut Mirchi", "Aloo Bajji", "Arati Bajji", "Bread Bajji", "Aloo Bonda", "Masala Wada", "Medhu Wada", "Alasandala Wada", "Mix Dal Wada", "Onion Pakoda", "Cabbage Pakoda"] },
  { name: "Dals", items: ["Palak Dal", "Palak Chintakaya Dal", "Tomato Dal", "Dosakai Dal", "Mango Dal", "Methi Tomato Dal", "Dosakai Tomato Dal", "Thotakura Dal", "Chukkakura Dal", "Sorakaya Dal", "Bachhala Kura Dal", "Cabbage Dal", "Plain Dal", "Dal Tadka", "Dal Nawabi", "Dal Fry", "Gongura Dal", "Beerakaya Dal"] },
  { name: "Chutneys & pickles", items: ["Gongura Pickle", "Gongura Green Chilli Onion", "Gongura Tomato", "Gongura Pandumirchi", "Gongura Avakaya", "Gongura Nuvvula Pacchadi", "Tomato Pickle", "Tomato Chutney", "Tomato Coriander", "Tomato Pudina", "Mango Pickle", "Mango Menthi Baddhalu", "Grated Mango Pickle", "Mango Coconut", "Avakaya", "Coconut Chutney", "Coconut Red Chilli", "Dondakaya", "Sorakaya", "Dosa Avakai", "Dosakaya Chutney", "Dosakaya Mukkala Pachhadi", "Coriander Pickle", "Chintakaya Pachadi", "Lemon Pickle"] },
  { name: "Powders", items: ["Kandi Podi", "Putnalu", "Palli Podi", "Nuvvulu", "Curry Leaf", "Nalla Karam", "Coconut Powder", "Karam Podi", "Velluli Karam"] },
  { name: "Rasam", items: ["Tomato Rasam", "Lemon Rasam", "Ginger Rasam", "Pepper Rasam", "Mysore Rasam", "Drumstick Rasam", "Coconut Rasam", "Ulavacharu"] },
  { name: "Sambar", items: ["Drumstick Sambar", "Onion Sambar", "Tomato Sambar", "Madras Sambar", "Mukkala Pulusu", "Gummadikaya Dappalam", "Veg Dappalam", "Pappu Chaaru"] },
  { name: "Raita", items: ["Mix Veg Raita", "Onion Raita", "Mint Raita", "Boondi Raita", "Cucumber Raita"] },
  { name: "Sweets", items: ["Boondi Ladoo", "Mothichoor Ladoo", "Khaja", "Badushah", "Mysore Pak", "Chalimidi", "Gulab Jamun", "Kala Jamun", "Rasgulla", "Khova Barfi", "Kaju Barfi", "Jilebi", "Jhangiri", "Carrot Halwa", "Khaddu Halwa", "Carrot Kheer", "Khaddu Kheer", "Chakkara Pongali", "Payasam", "Kurbani Ka Meetha", "Bobbatlu", "Poornam Burelu", "Kesari", "Pineapple Kesari", "Khalakhand", "Ariselu", "Rabdi"] },
  { name: "Ice cream", items: ["Vanilla", "Strawberry", "Butterscotch", "Mango", "Chocolate", "Tutti Frutti"] },
  { name: "Paan", items: ["Saada Paan", "Sweet Paan", "Kolkata Paan", "Saunf Copra Paan", "Sugar Coated Saunf", "Plain Saunf", "Supari", "Live Paan Counter"] },
  { name: "Live counters", items: ["Chaat Counter", "Fruit Counter", "Chinese Counter", "Italian Counter", "Dosa Counter", "Bombay Chat", "Delhi Chat", "Timepass Stall (Popcorn, Sugar Candy, Chocolate Fountain, Ice Gola, Finger Chips)"] },
  { name: "Breakfast", items: ["Idly", "Wada", "Poori", "Mysore Bonda", "Rice Pongal", "Rava Pongal", "Dosa Varieties", "Pesarattu", "Upma", "Veg Upma", "Tomato Bath", "Poha", "Tea/Coffee"] },
  { name: "Common items", items: ["Plain Rice", "Ghee", "Papad/Fryums", "Curds", "Mineral Water"] },
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
        .insert({ vendor_id: VENDOR_ID, category_id: categoryId, name: itemName, is_veg: true, base_price_pp: null })
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

function categoryItems(categoryName) {
  return CATEGORY_SPEC.find((c) => c.name === categoryName).items;
}

// ---------- 3. Packages ----------
// price: null means "still TBD in the brochure" - fill in a ₹/plate number and
// rerun to create that package. suggestedDefault marks Sri's two recommended
// mid-tier picks (Classic, Luxury); whichever of those ends up priced becomes the
// default package, else the median-priced package among the ones actually created.

const PACKAGE_SPEC = [
  {
    name: "Economy",
    price: null,
    minPlates: 30,
    description: "Everyday thali spread: South Indian rice, one wet curry, fry, dal, sambar or rasam, sweet, hot, chutney and salad, with papad and curd/raita included.",
    slots: [
      { category: "South Indian rice", pick: 1 },
      { category: "South Indian curries", pick: 1 },
      { category: "Fry", pick: 1 },
      { category: "Dals", pick: 1 },
      { category: "Sambar", pick: 1 }, // brochure: "Sambar/Rasam 1" — first-named category used
      { category: "Sweets", pick: 1 },
      { category: "Hots (bajjis & wadas)", pick: 1 },
      { category: "Chutneys & pickles", pick: 1 },
      { category: "Salads", pick: 1 },
      { category: "Common items", pick: 5 }, // included, not selectable
    ],
  },
  {
    name: "Traditional",
    price: null,
    minPlates: 30,
    description: "Classic vegetarian meal built around Pulihora, one curry, dal, sambar, chutney and pickle, hot starter and sweet, with paan, curd and papad included.",
    slots: [
      { category: "South Indian curries", pick: 1 },
      { category: "Dals", pick: 1 },
      { category: "Sambar", pick: 1 },
      { category: "Chutneys & pickles", pick: 2 }, // brochure: "Chutney 1, Pickle 1" — same category here
      { category: "South Indian rice", pick: 1, pool: ["Pulihora"] }, // brochure names Pulihora specifically
      { category: "Hots (bajjis & wadas)", pick: 1 },
      { category: "Sweets", pick: 1 },
      { category: "Paan", pick: 1 },
      { category: "Common items", pick: 5 },
    ],
  },
  {
    name: "Classic",
    price: null,
    minPlates: 50,
    description: "Salad, dal, fry, two pickles, one powder, one hot, sambar, a biryani/pulao-style rice, one roti, two North Indian curries, raita and two sweets — with sweet paan, curd and ghee included.",
    suggestedDefault: true,
    slots: [
      { category: "Salads", pick: 1 },
      { category: "Dals", pick: 1 },
      { category: "Fry", pick: 1 },
      { category: "Chutneys & pickles", pick: 2 }, // brochure: "Pickles 2"
      { category: "Powders", pick: 1 },
      { category: "Hots (bajjis & wadas)", pick: 1 },
      { category: "Sambar", pick: 1 },
      { category: "North Indian rice", pick: 1, pool: ["Bagara Rice", "Veg Pulav", "Peas Pulav", "Veg Biryani", "Veg Dum Biryani", "Kaju Pulav"], defaults: ["Veg Biryani"] }, // brochure: "Biryani/Pulao/Bagara"
      { category: "Rotis", pick: 1, pool: ["Poori", "Rumali Roti"] },
      { category: "North Indian curries", pick: 2 },
      { category: "Raita", pick: 1 },
      { category: "Sweets", pick: 2 },
      { category: "Paan", pick: 1, pool: ["Sweet Paan"] },
      { category: "Common items", pick: 5 },
    ],
  },
  {
    name: "Prime",
    price: null,
    minPlates: 50,
    description: "South Indian rice, one roti, one South Indian and one North Indian curry, fry, sambar, sweet, hot, chutney and salad, with curd/raita and papad included.",
    slots: [
      { category: "South Indian rice", pick: 1 },
      { category: "Rotis", pick: 1 },
      { category: "South Indian curries", pick: 1 },
      { category: "North Indian curries", pick: 1 },
      { category: "Fry", pick: 1 },
      { category: "Sambar", pick: 1 },
      { category: "Sweets", pick: 1 },
      { category: "Hots (bajjis & wadas)", pick: 1 },
      { category: "Chutneys & pickles", pick: 1 },
      { category: "Salads", pick: 1 },
      { category: "Common items", pick: 5 },
    ],
  },
  {
    name: "Corporate Lunch",
    price: null,
    minPlates: 100,
    description: "Office-lunch box: South Indian rice, fry, a curry, dal, sambar and chutney, with curds and fryums included.",
    slots: [
      { category: "South Indian rice", pick: 1 },
      { category: "Fry", pick: 1 },
      { category: "North Indian curries", pick: 1 }, // brochure just says "Curry 1" — interpreted as North Indian style
      { category: "Dals", pick: 1 },
      { category: "Sambar", pick: 1 },
      { category: "Chutneys & pickles", pick: 1 },
      { category: "Common items", pick: 5 },
    ],
  },
  {
    name: "Luxury",
    price: null,
    minPlates: 150,
    description: "Welcome drink, South Indian rice, roti, two North Indian curries, fry, dal, sambar, sweet, hot, two chutneys, salad and ice cream — with sweet paan and curd/raita included.",
    suggestedDefault: true,
    slots: [
      { category: "Welcome drinks", pick: 1 },
      { category: "South Indian rice", pick: 1 },
      { category: "Rotis", pick: 1 },
      { category: "North Indian curries", pick: 2 },
      { category: "Fry", pick: 1 },
      { category: "Dals", pick: 1 },
      { category: "Sambar", pick: 1 },
      { category: "Sweets", pick: 1 },
      { category: "Hots (bajjis & wadas)", pick: 1 },
      { category: "Chutneys & pickles", pick: 2 },
      { category: "Salads", pick: 1 },
      { category: "Ice cream", pick: 1 },
      { category: "Paan", pick: 1, pool: ["Sweet Paan"] },
      { category: "Common items", pick: 5 },
    ],
  },
  {
    name: "Imperial",
    price: null,
    minPlates: 250,
    description: "Two welcome drinks, two starters, North and South Indian rice, three North Indian curries, one South Indian curry, two raitas, dal, three pickles, two powders, sambar, paan and salad — with chaat, fruit, dosa and Chinese live counters on display.",
    slots: [
      { category: "Welcome drinks", pick: 2 },
      { category: "Starters", pick: 2 },
      { category: "North Indian rice", pick: 1 },
      { category: "South Indian rice", pick: 1 },
      { category: "North Indian curries", pick: 3 },
      { category: "South Indian curries", pick: 1 },
      { category: "Raita", pick: 2 },
      { category: "Dals", pick: 1 },
      { category: "Chutneys & pickles", pick: 3 },
      { category: "Powders", pick: 2 },
      { category: "Sambar", pick: 1 }, // brochure: "Sambar/Rasam 1"; "Majjiga/Pachi Pulusu" mention has no matching category and is skipped
      { category: "Paan", pick: 1 },
      { category: "Salads", pick: 1 },
      { category: "Live counters", pick: 4, pool: ["Chaat Counter", "Fruit Counter", "Dosa Counter", "Chinese Counter"] },
      { category: "Common items", pick: 5 },
    ],
  },
  {
    name: "Wedding Delight",
    price: null,
    minPlates: 400,
    description: "Welcome drink, starter, salad, two rotis (incl. Poori), three North Indian curries, Veg Biryani, fry, dal, one South Indian curry, three pickles, two powders, sambar, rasam, three sweets, ice cream and a hot — with fruit chaat, paan, curd, ghee and papad included.",
    slots: [
      { category: "Welcome drinks", pick: 1 }, // brochure: "Welcome drink/soup 1" — no Soups category on this menu, welcome drink used
      { category: "Starters", pick: 1 }, // brochure also names "+ Veg Manchurian", which isn't in this vendor's Starters list and is skipped
      { category: "Salads", pick: 1 },
      { category: "Rotis", pick: 2, defaults: ["Poori"] }, // brochure: "Roti 1, Poori" — Poori called out specifically as one of the two
      { category: "North Indian curries", pick: 3 },
      { category: "North Indian rice", pick: 1, pool: ["Veg Biryani"] },
      { category: "Fry", pick: 1 },
      { category: "Dals", pick: 1 },
      { category: "South Indian curries", pick: 1 },
      { category: "Chutneys & pickles", pick: 3 },
      { category: "Powders", pick: 2 },
      { category: "Sambar", pick: 1 },
      { category: "Rasam", pick: 1 },
      { category: "Sweets", pick: 3 },
      { category: "Live counters", pick: 1, pool: ["Fruit Counter"] }, // approximates "Fruit Chat"
      { category: "Ice cream", pick: 1 },
      { category: "Hots (bajjis & wadas)", pick: 1 },
      { category: "Paan", pick: 1 },
      { category: "Common items", pick: 5 },
    ],
  },
  {
    name: "Grandeur",
    price: null,
    minPlates: 500,
    description: "The full spread: three welcome drinks, two starters, six sweets, North and South Indian rice, three hots, four rotis, North and South Indian curries, two fry, four powders, four pickles, sambar, three ice creams and salad — with dosa/Chinese/chaat/fruit counters, a Timepass stall and a paan counter on display.",
    slots: [
      { category: "Welcome drinks", pick: 3 },
      { category: "Starters", pick: 2 },
      { category: "Sweets", pick: 6 },
      { category: "North Indian rice", pick: 2 },
      { category: "South Indian rice", pick: 1 },
      { category: "Hots (bajjis & wadas)", pick: 3 },
      { category: "Rotis", pick: 4 },
      { category: "North Indian curries", pick: 3 },
      { category: "South Indian curries", pick: 2 },
      { category: "Fry", pick: 2 },
      { category: "Powders", pick: 4 },
      { category: "Chutneys & pickles", pick: 4 },
      { category: "Sambar", pick: 1 }, // brochure: "Sambar/Rasam/Khadi 1" — "Khadi" has no matching category and is skipped
      { category: "Ice cream", pick: 3 },
      { category: "Salads", pick: 1 },
      { category: "Live counters", pick: 5, pool: ["Dosa Counter", "Chinese Counter", "Chaat Counter", "Fruit Counter", "Timepass Stall (Popcorn, Sugar Candy, Chocolate Fountain, Ice Gola, Finger Chips)"] },
      { category: "Paan", pick: 1, pool: ["Live Paan Counter"] }, // approximates "Calcutta paan counter"
      { category: "Common items", pick: 5 },
    ],
  },
];

const pricedPackages = PACKAGE_SPEC.filter((p) => p.price !== null);

const existingPackages = mustSucceed(
  "fetch existing packages",
  await supabase.from("packages").select("id, name").eq("vendor_id", VENDOR_ID)
);
const packageIdByName = new Map(existingPackages.map((p) => [p.name, p.id]));

let defaultPackageName = null;
if (pricedPackages.length > 0) {
  const suggested = pricedPackages.find((p) => p.suggestedDefault);
  if (suggested) {
    defaultPackageName = suggested.name;
  } else {
    const sortedByPrice = [...pricedPackages].sort((a, b) => a.price - b.price);
    defaultPackageName = sortedByPrice[Math.floor(sortedByPrice.length / 2)].name;
  }
}

const packageSummaries = [];
for (const spec of pricedPackages) {
  let packageId = packageIdByName.get(spec.name);
  const packageFields = {
    vendor_id: VENDOR_ID,
    name: spec.name,
    description: spec.description,
    base_price_pp: spec.price,
    min_plates: spec.minPlates,
    is_default: spec.name === defaultPackageName,
    is_active: true,
  };

  if (packageId) {
    mustSucceed(`update package "${spec.name}"`, await supabase.from("packages").update(packageFields).eq("id", packageId));
  } else {
    const row = mustSucceed(`create package "${spec.name}"`, await supabase.from("packages").insert(packageFields).select().single());
    packageId = row.id;
  }

  mustSucceed(`clear existing slots for "${spec.name}"`, await supabase.from("package_slots").delete().eq("package_id", packageId));

  const slotSummaries = [];
  for (let i = 0; i < spec.slots.length; i++) {
    const slot = spec.slots[i];
    const slotRow = mustSucceed(
      `create slot "${slot.category}" for "${spec.name}"`,
      await supabase
        .from("package_slots")
        .insert({ package_id: packageId, category_id: categoryIdByName.get(slot.category), selections_count: slot.pick, sort_order: i + 1 })
        .select()
        .single()
    );

    const poolNames = slot.pool ?? categoryItems(slot.category);
    const defaultNames = slot.defaults ?? firstN(poolNames, slot.pick);
    const slotItemRows = poolNames.map((name) => ({
      slot_id: slotRow.id,
      item_id: itemId(slot.category, name),
      is_default: defaultNames.includes(name),
    }));
    mustSucceed(`insert slot items for "${slot.category}" (${spec.name})`, await supabase.from("package_slot_items").insert(slotItemRows));

    slotSummaries.push(`${slot.category}: pick ${slot.pick} of ${poolNames.length}`);
  }

  packageSummaries.push({ name: spec.name, price: spec.price, minPlates: spec.minPlates, isDefault: spec.name === defaultPackageName, slots: slotSummaries });
}

// Also handle packages that WERE priced and created in a previous run but have
// since been reverted to TBD in this file - none currently, but keeping the two
// lists visible makes that state legible if it ever happens.
const skippedPackages = PACKAGE_SPEC.filter((p) => p.price === null).map((p) => p.name);

// ---------- Summary ----------

console.log("\n=== Vendor fields set ===");
console.log(`id: ${updatedVendor.id}`);
console.log(`name: ${updatedVendor.name}`);
console.log(`slug: ${updatedVendor.slug} (unchanged)`);
console.log(`description: ${updatedVendor.description}`);
console.log(`cuisine_specialities: ${updatedVendor.cuisine_specialities.join(", ")}`);
console.log(`event_specialities: ${updatedVendor.event_specialities.join(", ")}`);
console.log(`phone (untouched, from GBP source): ${updatedVendor.phone}`);
console.log(`address (untouched, from GBP source): ${updatedVendor.address}`);
console.log(`area (untouched, from GBP source): ${updatedVendor.area}`);
console.log(`gbp_rating (untouched): ${updatedVendor.gbp_rating} (${updatedVendor.gbp_rating_count} reviews)`);
console.log(`status (unchanged): ${updatedVendor.status}`);

console.log("\n=== Categories/items ===");
console.log(`${CATEGORY_SPEC.length} categories, ${CATEGORY_SPEC.reduce((n, c) => n + c.items.length, 0)} items total`);
console.log(`Newly created this run — categories: ${categoriesCreated.length ? categoriesCreated.join(", ") : "(none, already existed)"}`);
console.log(`Newly created this run — items: ${itemsCreated.length ? itemsCreated.length + " item(s)" : "(none, already existed)"}`);

console.log("\n=== Packages ===");
if (packageSummaries.length === 0) {
  console.log("0 packages created — all 9 packages in onboarding/sampradaya.md are still priced TBD.");
  console.log(`Skipped (TBD): ${skippedPackages.join(", ")}`);
  console.log('Fill in a real "price" number in PACKAGE_SPEC (scripts/seed-sampradaya.mjs) for any package and rerun.');
} else {
  for (const pkg of packageSummaries) {
    console.log(`\n${pkg.name}${pkg.isDefault ? " (DEFAULT)" : ""} — ₹${pkg.price}/plate, min ${pkg.minPlates} plates`);
    for (const line of pkg.slots) console.log(`  - ${line}`);
  }
  if (skippedPackages.length > 0) {
    console.log(`\nStill TBD, skipped: ${skippedPackages.join(", ")}`);
  }
}
