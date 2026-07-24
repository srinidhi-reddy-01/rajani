// Pure, client-safe vendor matching/ranking. No DB access - takes an already-fetched
// vendor list so the discover page can recompute live as filters change, with zero
// network round-trips per keystroke.
import type { Package, PricedPackage, Vendor } from "@/lib/types/database";
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
  | "event_specialities"
  | "cover_image_url"
  | "owner_photo_url"
  | "logo_url"
  | "events_completed"
  | "is_verified"
> & {
  packages: Package[];
};

export type MatchedVendor = Omit<DiscoverableVendor, "packages"> & {
  packages: PricedPackage[];
  lowestPackagePrice: number;
  // Whether this vendor satisfies at least one active soft filter (cuisine or
  // event type). Always true when no soft filter is selected. Vendors are always
  // sorted with matches first within whichever list they land in, so the UI can
  // find the flip from true->false to place an "Also available" divider.
  matchesFilters: boolean;
};

export type MatchCriteria = {
  plates: number;
  cuisines?: string[];
  eventTypes?: string[];
  budgetPp?: number | null;
  sort?: "match" | "price";
};

export type MatchResult = {
  matched: MatchedVendor[];
  others: (MatchedVendor & { budgetLabel: "above" | "below" })[];
};

const BUDGET_BAND_TOLERANCE = 0.1;

// Soft filter, not a hard one: most caterers can serve any event, so a vendor
// that doesn't declare the selected cuisine/event type still shows - it just
// ranks below the ones that do, under a divider. Matches on cuisine OR event
// type (whichever filters are active), never both required at once.
function matchesSoftFilters(
  v: Pick<DiscoverableVendor, "cuisine_specialities" | "event_specialities">,
  selectedCuisines: string[],
  selectedEventTypes: string[]
): boolean {
  if (selectedCuisines.length === 0 && selectedEventTypes.length === 0) return true;
  const cuisineMatch = selectedCuisines.length > 0 && v.cuisine_specialities.some((c) => selectedCuisines.includes(c));
  const eventMatch = selectedEventTypes.length > 0 && v.event_specialities.some((e) => selectedEventTypes.includes(e));
  return cuisineMatch || eventMatch;
}

export function matchVendors(vendors: DiscoverableVendor[], criteria: MatchCriteria): MatchResult {
  const selectedCuisines = criteria.cuisines ?? [];
  const selectedEventTypes = criteria.eventTypes ?? [];

  const candidates: MatchedVendor[] = vendors
    .map((v) => {
      // Unpriced packages ("priced later" is a real onboarding state - see 0012
      // migration) never render on the consumer site - a vendor with only unpriced
      // packages simply has no candidates and drops out of discovery entirely.
      const activePackages = v.packages.filter(
        (p): p is Package & { base_price_pp: number } => p.is_active && p.base_price_pp !== null
      );
      if (activePackages.length === 0) return null;
      const lowestPackagePrice = Math.min(...activePackages.map((p) => quotePerPlate(p.base_price_pp, criteria.plates)));
      return {
        ...v,
        packages: activePackages,
        lowestPackagePrice,
        matchesFilters: matchesSoftFilters(v, selectedCuisines, selectedEventTypes),
      };
    })
    .filter((v): v is MatchedVendor => v !== null);

  const byFilterMatchThenPrice = (a: MatchedVendor, b: MatchedVendor): number => {
    const filterDelta = Number(b.matchesFilters) - Number(a.matchesFilters);
    return filterDelta !== 0 ? filterDelta : a.lowestPackagePrice - b.lowestPackagePrice;
  };

  // "Price: low to high" is an explicit user override of ranking - it still
  // respects the soft filter (matches first) but ignores the budget band
  // grouping entirely, unlike "match" mode below.
  if (criteria.sort === "price") {
    return { matched: [...candidates].sort(byFilterMatchThenPrice), others: [] };
  }

  if (!criteria.budgetPp) {
    return { matched: [...candidates].sort(byFilterMatchThenPrice), others: [] };
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

  matched.sort(byFilterMatchThenPrice);
  others.sort(byFilterMatchThenPrice);

  return { matched, others };
}
