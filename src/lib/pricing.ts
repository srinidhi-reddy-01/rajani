import type { PricingTier } from "@/lib/types/database";

// Every base_price_pp is priced at the 500-plate baseline. The vendor's pricing_tiers
// define a plate-count adjustment band; outside any band, the baseline price stands.
export function adjustmentPctForPlates(tiers: PricingTier[], plates: number): number {
  const tier = tiers.find((t) => plates >= t.min_plates && plates <= t.max_plates);
  return tier ? tier.adjustment_pct : 0;
}

export function quotePerPlate(basePricePp: number, tiers: PricingTier[], plates: number): number {
  const adjustmentPct = adjustmentPctForPlates(tiers, plates);
  return basePricePp * (1 + adjustmentPct / 100);
}

export const QUOTE_DISCLAIMER =
  "Actual price may vary by 10–15% based on dish changes and plate-count updates. Please confirm with the caterer for final booking.";

export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
