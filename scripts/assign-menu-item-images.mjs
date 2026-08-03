// One-time (but idempotent) bulk image assignment for menu_items.image_url, across every
// vendor. Sourced images live in scripts/data/menu_item_images.json (105 curated, verified
// images.unsplash.com photo URLs keyed by a short dish/category slug - same hotlinking
// convention already used for vendor cover images, no download/attribution needed under the
// Unsplash License).
//
// Two-stage resolver per item, mirroring the "specific beats generic, ambiguous goes to
// review" approach used in fix-chikkas-veg-classification.mjs:
//   1. DISH_ALIASES: normalized dish name -> image key (exact match, highest fidelity).
//   2. CATEGORY_FALLBACK: category name -> image key (or a function of is_veg for buckets
//      that mix veg/non-veg), used only when no dish alias matched.
// Anything matching neither (garbage/typo names in an unmapped category) is left on a
// review list, untouched - never guessed.
//
// Idempotent: only rows where image_url IS NULL are updated, so reruns after an admin
// manually overrides an item's image never clobber that override.

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGE_MAP = JSON.parse(fs.readFileSync(path.join(__dirname, "data/menu_item_images.json"), "utf8"));

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

const norm = (s) =>
  s
    .toLowerCase()
    .trim()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();

// ---------- Dish-name aliases (normalized name -> image key) ----------

const DISH_ALIASES = {
  "veg manchurian": "veg_manchurian",
  "paneer butter masala": "paneer_butter_masala",
  "gulab jamun": "gulab_jamun",
  "poori": "poori",
  "dal tadka": "dal_tadka",
  "veg biryani": "biryani_veg",
  "butter naan": "butter_naan",
  "paneer tikka": "paneer_tikka",
  "chicken curry": "curry_chicken",
  "chicken biryani": "biryani_nonveg",
  "double ka meetha": "double_ka_meetha",
  "phulka": "phulka",
  "bagara rice": "bagara_rice",
  "chicken 65": "chicken_65",
  "gobi 65": "gobi_65",
  "chicken lollipop": "chicken_lollipop",
  "sweet corn soup": "sweet_corn_soup",
  "hot sour soup": "hot_sour_soup",
  "hot and sour soup": "hot_sour_soup",
  "rose milk": "rose_milk",
  "mango panna": "mango_panna",
  "buttermilk": "buttermilk",
  "mutton sukka": "mutton_sukka",
  "tomato shorba": "tomato_shorba",
  "gutti vankaya kura": "gutti_vankaya_kura",
  "mutton curry": "curry_mutton",
  "chicken chettinad": "chicken_chettinad",
  "kesari bath": "kesari_bath",
  "green salad": "green_salad",
  "green garden salad": "green_salad",
  "fish fry": "fish_fry",
  "fruit punch": "fruit_punch",
  "strawberry punch": "fruit_punch",
  "mirchi ka salan": "mirchi_ka_salan",
  "tomato salan": "mirchi_ka_salan",
  "mini samosa": "samosa",
  "irani samosa": "samosa",
  "samosa": "samosa",
  "jeera rice": "jeera_rice",
  "pickle": "pickle",
  "gongura pickle": "pickle",
  "russian salad": "russian_salad",
  "mirchi bajji": "mirchi_bajji",
  "cut mirchi": "mirchi_bajji",
  "pesarattu": "pesarattu",
  "dal fry": "dal_tadka",
  "papad": "papad",
  "grapes": "fruit_counter",
  "pineapple": "fruit_counter",
  "watermelon": "fruit_counter",
  "fruit counter": "fruit_counter",
  "veg bullets": "fritters",
  "gold coin": "fritters",
  "onion pakoda": "fritters",
  "veg 65": "gobi_65",
  "rajma masala": "rajma_masala",
  "babycorn masala": "babycorn_masala",
  "capsicum masala": "babycorn_masala",
  "coconut rice": "coconut_rice",
  "curd rice": "curd_rice",
  "peas pulav": "peas_pulav",
  "kaju pulav": "rice_generic",
  "veg pulav": "rice_generic",
  "mint rice": "rice_generic",
  "tomato soup": "tomato_soup",
  "manchow soup": "manchow_soup",
  "plain rice": "plain_rice",
  "ice cream": "ice_cream",
  "raita": "raita",
  "jaljeera": "jaljeera",
  "rumali roti": "rumali_roti",
  "kulcha": "kulcha",
  "paneer kulcha": "kulcha",
  "bagara baingan": "bagara_baingan",
  "lemon rice": "lemon_rice",
  "pulihora": "lemon_rice",
  "aava pulihora": "lemon_rice",
  "chutney": "chutneys_pickles",
  "badam milk": "rose_milk",
  "tandoori roti": "breads",
  "chapathi": "phulka",
  "pulka": "phulka",
  "naan": "butter_naan",
  "kothimeer naan": "butter_naan",
  "veg dum biryani": "biryani_veg",
  "panasakaya biryani": "biryani_veg",
  "biryani": "biryani_veg",
  "dosa counter": "dosa",
  "tandoori prawns": "tandoori_prawns",
  "mysore pak": "mysore_pak",
  "chinese counter": "noodles",
  "noodles": "noodles",
  "idly": "idly",
  "sambar": "sambar",
  "butter garlic prawns": "butter_garlic_prawns",
  "wada": "wada",
  "masala wada": "wada",
  "chaat counter": "chaat",
  "sweet paan": "paan",
  "mouth freshener": "paan",
  "mango dal": "dal",
  "palak dal": "dal",
  "upma": "upma",
  "mysore bonda": "mysore_bonda",
  "tomato bath": "tomato_bath",
  "tomato rice": "tomato_bath",
  "liver fry": "fry_items",
  "mutton fry": "fry_items",
  "aloo fry": "fry_items",
  "kandha fry": "fry_items",
  "chama fry": "fry_items",
  "brinjal fry": "fry_items",
  "gobi fry": "fry_items",
  "bisibele bath": "bisibele_bath",
  "bisbelli bath": "bisibele_bath",
  "omlette": "eggs",
  "boild eg": "eggs",
  "kebab": "kebab",
  "seasonal veg curry": "curry_veg_north",
  "kheer": "kheer",
  "halwa": "kheer",
  "litchi punch": "litchi_punch",
  "lemonade": "lemonade",
  "baby corn manchurian": "veg_manchurian",
  "veg spring rolls": "veg_manchurian",
  "veg lollipop": "chicken_lollipop",
  "harabhara kabab": "harabhara_kabab",
  "mexican salad": "salads",
  "kosambari": "salads",
  "laccha parota": "laccha_parota",
  "muli parota": "laccha_parota",
  "veg parota": "laccha_parota",
  "palak poori": "poori",
  "vankaya karam": "gutti_vankaya_kura",
  "vankaya allam pacchimirchi": "gutti_vankaya_kura",
  "stuffed donda": "gutti_vankaya_kura",
  "guttivankaya": "gutti_vankaya_kura",
  "mixed veg coconut": "curry_veg_south",
  "aratikaya": "curry_veg_south",
  "cabbage coconut": "curry_veg_south",
  "beans coconut": "curry_veg_south",
  "kanda bachhali": "curry_veg_south",
  "capsicum karam": "curry_veg_north",
  "methi chaman": "curry_veg_north",
  "aloo curry": "curry_veg_north",
  "veg kurma": "curry_veg_north",
  "aloo kurma": "curry_veg_north",
  "kofta masala": "curry_veg_north",
  "paneer matar": "paneer_butter_masala",
  "paneer curry": "paneer_butter_masala",
  "dum aloo": "dum_aloo",
  "fried rice": "fried_rice",
  "mojito": "mojito",
  "dal makhani": "dal_makhani",
  "tawa paratha": "tawa_paratha",
  "mango rice": "mango_rice",
  "mango juice": "mango_juice",
  "aloo tikki": "aloo_tikki",
  "soft noodles": "noodles",
  "manchuria": "veg_manchurian",
  "schezwan fried rice": "fried_rice",
  "masala dosa": "dosa",
  "sambar idly": "idly",
};

// ---------- Category fallback (category name -> image key, or a resolver fn(isVeg)) ----------

const CATEGORY_FALLBACK = {
  "Welcome snacks (non-veg)": "welcome_snacks_nonveg",
  "Welcome drinks": "welcome_drinks",
  "Welcome snacks (veg)": "welcome_snacks_veg",
  "Veg North Indian curry": "curry_veg_north",
  "Starters": (isVeg) => (isVeg ? "starters_veg" : "starters_nonveg"),
  "Desserts": "sweets",
  "Veg biryani & rice": "biryani_veg",
  "Chat counter": "chaat",
  "South Indian tiffins": "tiffins",
  "Veg South Indian curry": "curry_veg_south",
  "Soups": "soups",
  "Rice & biryani": (isVeg) => (isVeg ? "biryani_veg" : "biryani_nonveg"),
  "Sweets": "sweets",
  "Breads": "breads",
  "Chutneys & pickles": "chutneys_pickles",
  "Roti items": "breads",
  "Mutton curry": "curry_mutton",
  "Curries": (isVeg) => (isVeg ? "curry_veg_north" : "curry_generic"),
  "Dals": "dal",
  "Rotis": "breads",
  "North Indian curries": (isVeg) => (isVeg ? "curry_veg_north" : "curry_chicken"),
  "South Indian curries": (isVeg) => (isVeg ? "curry_veg_south" : "curry_chicken"),
  "Starters veg": "starters_veg",
  "Starters non-veg": "starters_nonveg",
  "Main curries veg": "curry_veg_north",
  "Main curries non-veg": "curry_chicken",
  "Ice creams": "ice_cream",
  "Salad counter": "salads",
  "Breakfast": "tiffins",
  "Hot items": "fritters",
  "Hots (bajjis & wadas)": "fritters",
  "Non-veg biryani": "biryani_nonveg",
  "Fry": "fry_items",
  "Egg curry": "curry_egg",
  "Salads": "salads",
  "Dal": "dal",
  "South Indian rice": "rice_generic",
  "Fruit counter": "fruit_counter",
  "Chicken curry": "curry_chicken",
  "North Indian rice": "rice_generic",
  "Powders": "chutneys_pickles",
  "Rasam": "rasam_sambar",
  "Sambar": "rasam_sambar",
  "Paan": "paan",
  "Live counters": "live_counter",
  "Pickles & chutneys": "chutneys_pickles",
  "Accompaniments": "chutneys_pickles",
  "Ice cream": "ice_cream",
  "Common items": "curry_generic",
  "Live Counters": "live_counter",
  "Raita": "raita",
  "Rice & Breads": "rice_generic",
  "Rice": "rice_generic",
  "Curd & raita": "raita",
  "Eggs": "eggs",
  "Paan & mouth fresheners": "paan",
  "Veg fry": "fry_items",
  "Chinese (veg)": "noodles",
  "Sambar & rasam": "rasam_sambar",
  "Punjabi dhaba (optional)": "curry_veg_north",
  "Bakery counter": "sweets",
  // "Continental (optional)" (pizza/pasta/burger) has no matching curated photo -
  // deliberately left unmapped, same as goidl (garbage category name): review list, not guessed.
};

function resolveKey(itemName, categoryName, isVeg) {
  const alias = DISH_ALIASES[norm(itemName)];
  if (alias) return { key: alias, via: "dish name" };

  const fallback = CATEGORY_FALLBACK[categoryName];
  if (typeof fallback === "function") return { key: fallback(isVeg), via: "category (veg-aware)" };
  if (fallback) return { key: fallback, via: "category" };

  return null;
}

// ---------- 1. Load everything ----------

const categories = mustSucceed("fetch categories", await supabase.from("menu_categories").select("id, name"));
const catNameById = new Map(categories.map((c) => [c.id, c.name]));

// PostgREST caps a single select() at 1000 rows by default - paginate to get all 1592.
const items = [];
for (let from = 0; ; from += 1000) {
  const page = mustSucceed(
    `fetch menu_items [${from}-${from + 999}]`,
    await supabase.from("menu_items").select("id, name, category_id, is_veg, image_url").range(from, from + 999)
  );
  items.push(...page);
  if (page.length < 1000) break;
}

console.log(`Loaded ${items.length} menu_items across ${categories.length} categories.`);
console.log(`Already have image_url set: ${items.filter((i) => i.image_url).length} (left untouched).`);

// ---------- 2. Classify ----------

const toUpdate = [];
const reviewList = [];
const keyUsage = new Map();

for (const item of items) {
  if (item.image_url) continue; // idempotent: never override an existing/admin-set image

  const categoryName = catNameById.get(item.category_id) ?? "unknown";
  const resolved = resolveKey(item.name, categoryName, item.is_veg);

  if (!resolved || !IMAGE_MAP[resolved.key]) {
    reviewList.push({ name: item.name, category: categoryName });
    continue;
  }

  toUpdate.push({ id: item.id, name: item.name, category: categoryName, key: resolved.key, via: resolved.via, url: IMAGE_MAP[resolved.key] });
  keyUsage.set(resolved.key, (keyUsage.get(resolved.key) ?? 0) + 1);
}

console.log(`\n=== Plan ===`);
console.log(`Will assign an image to ${toUpdate.length} item(s).`);
console.log(`Left unmatched, no image assigned (${reviewList.length}):`);
for (const r of reviewList) console.log(`  ${r.name} | ${r.category}`);

console.log(`\nImage key usage (top 20):`);
[...keyUsage.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20)
  .forEach(([key, n]) => console.log(`  ${n}\t${key}`));

console.log(`\nSample of 15 assignments:`);
for (const u of toUpdate.slice(0, 15)) console.log(`  "${u.name}" (${u.category}) -> ${u.key} [${u.via}]`);

// ---------- 3. Apply ----------

if (process.env.DRY_RUN === "1") {
  console.log("\nDRY_RUN=1 set - no updates applied.");
  process.exit(0);
}

let applied = 0;
for (const u of toUpdate) {
  const { error } = await supabase.from("menu_items").update({ image_url: u.url }).eq("id", u.id);
  if (error) {
    console.error(`FAILED updating "${u.name}" (${u.id})`, error);
    continue;
  }
  applied += 1;
}
console.log(`\nApplied ${applied} update(s).`);

// ---------- 4. Verify ----------

const { count: withImage } = await supabase.from("menu_items").select("id", { count: "exact", head: true }).not("image_url", "is", null);
const { count: total } = await supabase.from("menu_items").select("id", { count: "exact", head: true });
console.log(`\n=== Final ===`);
console.log(`menu_items with image_url set: ${withImage} / ${total}`);
