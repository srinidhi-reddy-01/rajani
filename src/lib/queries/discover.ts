import { supabase } from "@/lib/supabase/client";
import type { Package, Vendor } from "@/lib/types/database";

export type MatchedVendor = Pick<
  Vendor,
  "id" | "name" | "slug" | "area" | "gbp_rating" | "gbp_rating_count" | "cuisine_specialities"
> & {
  packages: Package[];
  lowestPackagePrice: number;
};

export type DiscoverCriteria = {
  cuisines?: string[];
  budgetPp?: number;
  sort?: "match" | "price";
};

export type DiscoverResult = {
  matched: MatchedVendor[];
  others: (MatchedVendor & { budgetLabel: "above" | "below" })[];
};

type VendorWithPackagesRow = Pick<
  Vendor,
  "id" | "name" | "slug" | "area" | "gbp_rating" | "gbp_rating_count" | "cuisine_specialities"
> & {
  packages: Package[];
};

const BUDGET_BAND_TOLERANCE = 0.1;

export async function getMatchedVendors(criteria: DiscoverCriteria): Promise<DiscoverResult> {
  const { data, error } = await supabase
    .from("vendors")
    .select("id, name, slug, area, gbp_rating, gbp_rating_count, cuisine_specialities, packages(*)")
    .eq("status", "live")
    .returns<VendorWithPackagesRow[]>();
  if (error) throw error;

  const candidates: MatchedVendor[] = (data ?? [])
    .map((v) => {
      const activePackages = (v.packages ?? []).filter((p) => p.is_active);
      if (activePackages.length === 0) return null;
      const lowestPackagePrice = Math.min(...activePackages.map((p) => p.base_price_pp));
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
