// One-off DB-only fix for Chikka's Catering (menu_items.is_veg, a plain boolean
// column - "not null default true", no separate food_type enum or vendor_dishes
// table). Classifies strictly by explicit protein tokens in the dish NAME, not by
// dish-type suffix ("65"/"biryani"/"fry"/"manchuria"/"majestic"/"pakora" are
// suffix-neutral - the protein word is what decides it). Everything without a
// protein token defaults to veg, EXCEPT a dish name that is nothing but a bare
// suffix word with no other qualifier (e.g. just "Manchuria" alone) - those are
// genuinely ambiguous and go to a review list untouched, never guessed.
//
// Idempotent: only rows whose current is_veg differs from the computed value are
// updated; everything else (including review-list items) is left alone. No deletes,
// no schema changes, scoped entirely to this one vendor UUID.

import { createClient } from "@supabase/supabase-js";

const VENDOR_ID = "4cbe985e-0973-4213-8abb-81e4cb59f278";

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

// ---------- 0. Confirm vendor, inspect current distribution ----------

const vendor = mustSucceed(
  "fetch vendor",
  await supabase.from("vendors").select("id, name").eq("id", VENDOR_ID).single()
);
if (!/chikka/i.test(vendor.name)) {
  console.error(`REFUSING TO PROCEED: vendor ${VENDOR_ID} is "${vendor.name}", not Chikka's Catering.`);
  process.exit(1);
}
console.log(`Confirmed vendor: "${vendor.name}" (${VENDOR_ID})`);

const categories = mustSucceed(
  "fetch categories",
  await supabase.from("menu_categories").select("id, name").eq("vendor_id", VENDOR_ID)
);
const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));

const items = mustSucceed(
  "fetch items",
  await supabase.from("menu_items").select("id, name, category_id, is_veg").eq("vendor_id", VENDOR_ID).order("category_id")
);

const before = { veg: items.filter((i) => i.is_veg).length, nonVeg: items.filter((i) => !i.is_veg).length };
console.log(`\nColumn: menu_items.is_veg boolean not null default true`);
console.log(`Current distribution (${items.length} items): veg=${before.veg}, non-veg=${before.nonVeg}`);

// ---------- 1. Classifier ----------

// Word-boundary tokens: common/short English words, higher false-positive-substring
// risk, so matched strictly as whole words.
const PROTEIN_WORD_BOUNDARY = ["chicken", "mutton", "lamb", "goat", "fish", "prawns?", "shrimp", "crab", "egg", "anda", "meat"];
// Plain-substring tokens: distinctive loanwords/Telugu terms that are often
// compounded without a space (e.g. "Natukodi", "Royyala") - safe to match as substrings.
const PROTEIN_SUBSTRING = ["keema", "kheema", "kodi", "mamsam", "chepa", "royyal", "guddu"];

const PROTEIN_REGEX = new RegExp(`\\b(${PROTEIN_WORD_BOUNDARY.join("|")})\\b`, "i");
const PROTEIN_SUBSTRING_REGEX = new RegExp(PROTEIN_SUBSTRING.join("|"), "i");

// Bare suffix words the brief calls out as genuinely dish-type-neutral. A dish name
// made up ONLY of these (plus filler words) - no protein token, no other qualifier -
// is the "genuinely ambiguous" case: reviewed, not guessed.
const AMBIGUOUS_SUFFIX_WORDS = new Set([
  "65", "biryani", "fry", "manchuria", "manchurian", "majestic", "mejistic", "mejistick",
  "pakora", "pakoda", "curry", "kabab", "kebab", "roll", "tikka", "kofta", "koftha",
  "korma", "kurma", "sizzler", "stick", "masala", "platter",
]);
const FILLER_WORDS = new Set(["of", "the", "with", "and", "or", "ka", "ki", "wala", "style", "dry", "wet", "hot", "live", "counter", "special", "mix", "mixed", "seasonal"]);

function classify(name) {
  if (PROTEIN_REGEX.test(name) || PROTEIN_SUBSTRING_REGEX.test(name)) {
    return { value: false, reason: "protein token" };
  }
  const words = name
    .toLowerCase()
    .replace(/[()]/g, " ")
    .split(/[\s/,-]+/)
    .filter(Boolean);
  const allWordsAreNeutralFiller = words.every((w) => AMBIGUOUS_SUFFIX_WORDS.has(w) || FILLER_WORDS.has(w));
  if (allWordsAreNeutralFiller) {
    return { value: null, reason: "bare suffix word only, no protein or veg qualifier" };
  }
  return { value: true, reason: "no protein token" };
}

// ---------- 2. Diff ----------

const mismatches = [];
const reviewList = [];
for (const item of items) {
  const result = classify(item.name);
  if (result.value === null) {
    reviewList.push({ name: item.name, category: categoryNameById.get(item.category_id), current: item.is_veg });
    continue;
  }
  if (result.value !== item.is_veg) {
    mismatches.push({ id: item.id, name: item.name, category: categoryNameById.get(item.category_id), current: item.is_veg, proposed: result.value });
  }
}

console.log(`\n=== Mismatches to apply (${mismatches.length}) ===`);
console.log("name | category | current | proposed");
for (const m of mismatches) {
  console.log(`${m.name} | ${m.category} | ${m.current ? "veg" : "non-veg"} | ${m.proposed ? "veg" : "non-veg"}`);
}

console.log(`\n=== Needs manual review (${reviewList.length}, left unchanged) ===`);
console.log("name | category | current");
for (const r of reviewList) {
  console.log(`${r.name} | ${r.category} | ${r.current ? "veg" : "non-veg"}`);
}

// Diagnostic only (not applied): items with no protein token per the specified list,
// but sitting in a category name that strongly implies meat/fish/egg. Likely gaps in
// the specified token list (organ meats, Urdu/Hindi "gosht"/"ghosh" for meat, bare
// "Sheek Kabab" with no protein prefix) - surfaced for manual review, not auto-changed.
const NONVEG_CATEGORY_HINT = /chicken|mutton|egg curry|non-veg|prawn/i;
const stillVegInSuspectCategory = items
  .map((item) => ({ item, result: classify(item.name) }))
  .filter(({ item, result }) => item.is_veg && (result.value === true || result.value === null) && NONVEG_CATEGORY_HINT.test(categoryNameById.get(item.category_id) ?? ""));

console.log(`\n=== Possible additional non-veg items NOT covered by the specified token list (${stillVegInSuspectCategory.length}, left unchanged - flagging only) ===`);
console.log("name | category | why suspect");
for (const { item } of stillVegInSuspectCategory) {
  console.log(`${item.name} | ${categoryNameById.get(item.category_id)} | sits in a meat/egg/fish-named category but no listed protein token in the name`);
}

// ---------- 3. Apply (only changed rows, this vendor only, idempotent) ----------

if (process.env.DRY_RUN === "1") {
  console.log("\nDRY_RUN=1 set - no updates applied.");
  process.exit(0);
}

for (const m of mismatches) {
  mustSucceed(
    `update "${m.name}" -> is_veg=${m.proposed}`,
    await supabase.from("menu_items").update({ is_veg: m.proposed }).eq("id", m.id).eq("vendor_id", VENDOR_ID)
  );
}
console.log(`\nApplied ${mismatches.length} update(s).`);

// ---------- 4. Verify ----------

const after = mustSucceed(
  "re-fetch items",
  await supabase.from("menu_items").select("is_veg").eq("vendor_id", VENDOR_ID)
);
const afterCounts = { veg: after.filter((i) => i.is_veg).length, nonVeg: after.filter((i) => !i.is_veg).length };
console.log(`\n=== Final distribution ===`);
console.log(`veg=${afterCounts.veg}, non-veg=${afterCounts.nonVeg}, total=${after.length}`);
console.log(`(before: veg=${before.veg}, non-veg=${before.nonVeg})`);
