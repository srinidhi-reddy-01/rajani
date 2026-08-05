// Bulk image assignment for menu_items.image_url, across every vendor. Sourced images
// live in scripts/data/menu_item_images.json (curated, verified images.unsplash.com
// photo URLs keyed by a short slug - same hotlinking convention already used for vendor
// cover images, no download/attribution needed under the Unsplash License).
//
// Three-tier resolver per item (most specific wins):
//   1. DISH_ALIASES: normalized dish name -> image key (exact match, highest fidelity).
//   2. INGREDIENT_KEYWORDS: when no exact dish match, scan the name for an ingredient
//      keyword (English + common Telugu/Hindi transliterations) and use a photo of that
//      ingredient - "if the exact dish isn't available, show the main ingredient"
//      (e.g. baingan ka bharta -> a brinjal/eggplant photo). Keywords are grouped into
//      priority tiers (protein > vegetable/fruit > grain > nut > spice/aromatic) because
//      Indian dish names often lead with a flavour/prep word ("Chilli Paneer", "Chatpata
//      Pineapple Tikka") rather than the headline ingredient - within a name, the
//      highest-priority tier with any match wins; ties within a tier go to whichever
//      keyword appears earliest in the string.
//   3. CATEGORY_FALLBACK: category name -> image key (or a function of is_veg for
//      buckets that mix veg/non-veg), used only when neither of the above matched.
// Anything matching none of the three (garbage/typo names in an unmapped category) is
// left on a review list, untouched - never guessed.
//
// Recomputes and overwrites EVERY item's image_url on every run (not just nulls) - every
// image on this table so far was set by this script, never hand-picked by an admin via
// the per-item "Image URL" admin field, so re-deriving from an improved resolver is safe
// and is the point of rerunning (replace a generic category photo with a more specific
// ingredient one now that the keyword/photo library has grown).

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
  "sambar idly": "idly",
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
  // Sapthagiri's locked "Common Items" section (White Rice/Curd/Papad/Fryums/Ghee/Raitha)
  // - the pre-existing "Common Items" category fallback (curry_generic) was tuned for a
  // different vendor's unrelated catch-all category and would be wrong here, so these get
  // exact aliases instead so category fallback never triggers for this section.
  "white rice": "plain_rice",
  "raitha": "raita",
  "curd": "raita",
  "fryums": "papad",
  "ghee": "milk_glass",
};

// ---------- Ingredient keyword fallback (tiered: protein > veg/fruit > grain > nut > spice) ----------

const INGREDIENT_TIERS = [
  {
    // Proteins reuse existing dish-tier photos where a dedicated one already exists
    // (curry_chicken/curry_mutton/fish_fry/eggs) - no new sourcing needed for those.
    name: "protein",
    keywords: {
      paneer_cubes: ["paneer", "panner"],
      curry_chicken: ["chicken"],
      curry_mutton: ["mutton"],
      fish_fry: ["fish", "chepa"],
      eggs: ["egg", "anda", "guddu"],
      prawns_raw: ["prawns", "royyala", "shrimp"],
      soychunks: ["meal maker", "nutrila", "soya"],
    },
  },
  {
    name: "vegetable_fruit",
    keywords: {
      babycorn: ["babycorn", "baby corn"],
      rawbanana: ["aratikaya", "arati"],
      brinjal: ["brinjal", "baigan", "vankaya", "eggplant", "guttivankaya"],
      okra: ["okra", "bhindi", "bendi", "bendakaya"],
      cauliflower: ["cauliflower", "gobi"],
      capsicum: ["capsicum"],
      tomato: ["tomato"],
      spinach: ["spinach", "palak", "palakura"],
      corn: ["corn", "makkai"],
      greenpeas: ["green peas", "greenpeas", "peas", "mutter", "matar"],
      mushroom: ["mushroom"],
      cabbage: ["cabbage"],
      carrot: ["carrot"],
      beans: ["beans", "chikkudu", "alasanda", "anapa"],
      pumpkin: ["pumpkin", "gummadikaya"],
      drumstick: ["drumstick", "munakkaya", "munaga", "mulakkada"],
      potato: ["potato", "aloo", "alu"],
      onion: ["onion", "kanda", "pyaza", "ulli"],
      garlic: ["garlic"],
      ginger: ["ginger", "allam"],
      coconut: ["coconut", "kobbari", "nariyal"],
      fenugreek: ["methi", "fenugreek"],
      cucumber: ["cucumber", "dosakaya"],
      ivygourd: ["dondakaya", "tindora"],
      ridgegourd: ["beerakaya", "bheerakaya"],
      bottlegourd: ["sorakaya"],
      yam: ["chamagadda", "kandagadda", "suran"],
      gongura: ["gongura"],
      apple: ["apple"],
      pineapple: ["pineapple"],
      grapes: ["grape"],
      fig: ["anjeer"],
      mango: ["mango", "mamidi"],
      dates: ["dates", "khajur"],
      tamarind: ["tamarind", "chintapandu", "chinta", "imli"],
      watermelon: ["watermelon"],
      papaya: ["papaya"],
      orange: ["orange"],
      plum: ["alubukara"],
      banana: ["banana"],
      strawberry: ["strawberry"],
      guava: ["guava", "jama"],
      sapota: ["sapota", "chiku"],
      muskmelon: ["muskmelon"],
      pear: ["pear"],
      dragonfruit: ["dragon fruit", "dragonfruit"],
      cherry: ["cherry"],
      litchi: ["litchi", "lichi", "lychee"],
      pomegranate: ["pomegranate"],
    },
  },
  {
    name: "grain",
    keywords: {
      pasta: ["pasta"],
      semolina: ["rava", "sooji"],
      gramflour: ["besan"],
    },
  },
  {
    name: "nut",
    keywords: {
      cashew: ["kaju", "cashew"],
      almond: ["badam", "almond"],
      pistachio: ["pista", "pistachio"],
    },
  },
  {
    name: "spice_aromatic",
    keywords: {
      mint: ["pudina", "mint"],
      lemon: ["lemon", "nimbu"],
      chili: ["mirchi", "chilli", "chili"],
      coriander: ["kothimeer", "kothmir", "coriander", "cilantro"],
      saffron: ["kesar", "saffron"],
      jaggery: ["bellam", "jaggery"],
      curryleaves: ["karivepaku"],
      milk_glass: ["milk"],
      cheese_cubes: ["cheese"],
      chocolate: ["chocolate", "choco"],
    },
  },
];

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchIngredient(normalizedName) {
  for (const tier of INGREDIENT_TIERS) {
    let best = null; // { key, pos }
    for (const [key, terms] of Object.entries(tier.keywords)) {
      for (const term of terms) {
        const re = new RegExp(`\\b${escapeRegExp(term)}\\b`, "i");
        const m = normalizedName.match(re);
        if (m && (best === null || m.index < best.pos)) best = { key, pos: m.index };
      }
    }
    if (best) return best.key;
  }
  return null;
}

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

  // ---- Sapthagiri category-name strings not already covered above ----
  "Hot Items": "fritters",
  "Salad Counter": "salads",
  "Indian Bread": "breads",
  "Veg Curries": "curry_veg_north",
  "Special Rice Items": "rice_generic",
  "Fry Items": "fry_items",
  "Dal Items": "dal",
  "Semi Liquids": "rasam_sambar",
  "Fresh Chutneys": "chutneys_pickles",
  "Pickles": "chutneys_pickles",
  "Common Items": "curry_generic", // superseded per-item by the DISH_ALIASES fix above
  "Ice Cream": "ice_cream",
  "Mineral Water": null, // a water bottle photo isn't worth sourcing for one item per menu
  "Mouth Freshener": "paan",
  "Refreshments": "welcome_drinks",
  "Starters veg": "starters_veg",
  "Chinese Items": "noodles",
  "Ice Creams": "ice_cream",
  "Pan Counter": "paan",
  "Chat Counter": "chaat",
  "Fruit Stall": "fruit_counter",
};

// Each tier only "claims" a match if IMAGE_MAP actually has a photo for that key -
// a keyword match against a key with no sourced photo (e.g. drumstick, honestly
// omitted by the sourcing pass - no good match found) must fall through to the next
// tier rather than leaving the item unmatched entirely.
function resolveKey(itemName, categoryName, isVeg) {
  const normalized = norm(itemName);

  const alias = DISH_ALIASES[normalized];
  if (alias && IMAGE_MAP[alias]) return { key: alias, via: "dish name" };

  const ingredientKey = matchIngredient(normalized);
  if (ingredientKey && IMAGE_MAP[ingredientKey]) return { key: ingredientKey, via: "ingredient" };

  const fallback = CATEGORY_FALLBACK[categoryName];
  const fallbackKey = typeof fallback === "function" ? fallback(isVeg) : fallback;
  if (fallbackKey && IMAGE_MAP[fallbackKey]) return { key: fallbackKey, via: "category" };

  return null;
}

// ---------- 1. Load everything ----------

const categories = mustSucceed("fetch categories", await supabase.from("menu_categories").select("id, name"));
const catNameById = new Map(categories.map((c) => [c.id, c.name]));

// PostgREST caps a single select() at 1000 rows by default - paginate to get everything.
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

// ---------- 2. Classify (recompute for every item, regardless of current image_url) ----------

const toUpdate = [];
const reviewList = [];
const tierUsage = new Map();
let changed = 0;
let unchanged = 0;

for (const item of items) {
  const categoryName = catNameById.get(item.category_id) ?? "unknown";
  const resolved = resolveKey(item.name, categoryName, item.is_veg);

  if (!resolved || !IMAGE_MAP[resolved.key]) {
    reviewList.push({ name: item.name, category: categoryName });
    continue;
  }

  const url = IMAGE_MAP[resolved.key];
  tierUsage.set(resolved.via, (tierUsage.get(resolved.via) ?? 0) + 1);
  if (item.image_url !== url) {
    changed += 1;
    toUpdate.push({ id: item.id, name: item.name, category: categoryName, key: resolved.key, via: resolved.via, url });
  } else {
    unchanged += 1;
  }
}

console.log(`\n=== Plan ===`);
console.log(`${toUpdate.length} item(s) will get a new/changed image_url (${changed} changed, ${unchanged} already correct).`);
console.log(`Left unmatched, no image assigned (${reviewList.length}):`);
for (const r of reviewList.slice(0, 40)) console.log(`  ${r.name} | ${r.category}`);
if (reviewList.length > 40) console.log(`  ... and ${reviewList.length - 40} more`);

console.log(`\nResolution tier usage:`);
for (const [via, n] of [...tierUsage.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${n}\t${via}`);

console.log(`\nSample of 20 changes:`);
for (const u of toUpdate.slice(0, 20)) console.log(`  "${u.name}" (${u.category}) -> ${u.key} [${u.via}]`);

// ---------- 3. Apply ----------

if (process.env.DRY_RUN === "1") {
  console.log("\nDRY_RUN=1 set - no updates applied.");
  process.exit(0);
}

// Plain per-row .update() (not upsert): upsert's ON CONFLICT DO UPDATE still requires
// the INSERT branch's row to satisfy every NOT NULL column with no default (vendor_id,
// category_id, name) even though it always resolves to the update branch - a payload of
// just {id, image_url} fails that validation. .update() only ever touches the columns
// given and never constructs an insert row, so it has no such requirement.
let applied = 0;
const CONCURRENCY = 25;
for (let i = 0; i < toUpdate.length; i += CONCURRENCY) {
  const batch = toUpdate.slice(i, i + CONCURRENCY);
  const results = await Promise.all(
    batch.map((u) => supabase.from("menu_items").update({ image_url: u.url }).eq("id", u.id))
  );
  results.forEach((r, idx) => {
    if (r.error) console.error(`FAILED updating "${batch[idx].name}" (${batch[idx].id})`, r.error);
    else applied += 1;
  });
}
console.log(`\nApplied ${applied} update(s).`);

// ---------- 4. Verify ----------

const { count: withImage } = await supabase.from("menu_items").select("id", { count: "exact", head: true }).not("image_url", "is", null);
const { count: total } = await supabase.from("menu_items").select("id", { count: "exact", head: true });
console.log(`\n=== Final ===`);
console.log(`menu_items with image_url set: ${withImage} / ${total}`);
