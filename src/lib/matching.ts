// Pure, client-safe vendor matching/ranking. No DB access - takes an already-fetched
// vendor list so the discover page can recompute live as filters change, with zero
// network round-trips per keystroke.
import type { Package, Vendor } from "@/lib/types/database";
import { quotePerPlate } from "@/lib/pricing";

export type DiscoverableVendor = Pick<
  Vendor,
  | "id"
  | "name"
  | "slug"
  | "area"
  | "gbp_rating"
  | "gbp_rating_count"
  | "cuisine_specialities"
  | "cover_image_url"
  | "owner_photo_url"
  | "events_completed"
  | "is_verified"
> & {
  packages: Package[];
};

export type MatchedVendor = DiscoverableVendor & { lowestPackagePrice: number };

export type MatchCriteria = {
  plates: number;
  cuisines?: string[];
  budgetPp?: number | null;
  sort?: "match" | "price";
};

export type MatchResult = {
  matched: MatchedVendor[];
  others: (MatchedVendor & { budgetLabel: "above" | "below" })[];
};

const BUDGET_BAND_TOLERANCE = 0.1;

export function matchVendors(vendors: DiscoverableVendor[], criteria: MatchCriteria): MatchResult {
  const candidates: MatchedVendor[] = vendors
    .map((v) => {
      const activePackages = v.packages.filter((p) => p.is_active);
      if (activePackages.length === 0) return null;
      const lowestPackagePrice = Math.min(...activePackages.map((p) => quotePerPlate(p.base_price_pp, criteria.plates)));
      return { ...v, packages: activePackages, lowestPackagePrice };
    })
    .filter((v): v is MatchedVendor => v !== null);

  const selectedCuisines = criteria.cuisines ?? [];
  const matchesCuisine = (v: MatchedVendor): boolean =>
    selectedCuisines.length === 0 || v.cuisine_specialities.some((c) => selectedCuisines.includes(c));

  const byCuisineThenPrice = (a: MatchedVendor, b: MatchedVendor): number => {
    const cuisineDelta = Number(matchesCuisine(b)) - Number(matchesCuisine(a));
    return cuisineDelta !== 0 ? cuisineDelta : a.lowestPackagePrice - b.lowestPackagePrice;
  };

  if (criteria.sort === "price") {
    return { matched: [...candidates].sort((a, b) => a.lowestPackagePrice - b.lowestPackagePrice), others: [] };
  }

  if (!criteria.budgetPp) {
    return { matched: [...candidates].sort(byCuisineThenPrice), others: [] };
  }

  const bandMin = criteria.budgetPp * (1 - BUDGET_BAND_TOLERANCE);
  const bandMax = criteria.budgetPp * (1 + BUDGET_BAND_TOLERANCE);

  const matched: MatchedVendor[] = [];
  const others: (MatchedVendor & { budgetLabel: "above" | "below" })[] = [];

  for (const v of candidates) {
    if (v.lowestPackagePrice >= bandMin && v.lowestPackagePrice <= bandMax) {
      matched.push(v);
    } else {
      others.push({ ...v, budgetLabel: v.lowestPackagePrice > bandMax ? "above" : "below" });
    }
  }

  matched.sort(byCuisineThenPrice);
  others.sort(byCuisineThenPrice);

  return { matched, others };
}
