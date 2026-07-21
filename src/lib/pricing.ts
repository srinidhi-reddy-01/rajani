// Platform-wide plate-count multiplier. 500 plates = base price (multiplier 1). The three
// anchor points (100 -> +10%, 500 -> 0%, 1000 -> -10%) are NOT collinear as a single line
// (the 100->500 segment is -2.5%/100 plates; the 500->1000 segment is -2%/100 plates), so
// this is piecewise linear with the kink at 500, clamped flat outside [100, 1000].
export function getPlateMultiplier(plates: number): number {
  if (plates <= 100) return 1.1;
  if (plates >= 1000) return 0.9;

  if (plates <= 500) {
    const pct = 10 - ((plates - 100) / 400) * 10;
    return 1 + pct / 100;
  }

  const pct = -((plates - 500) / 500) * 10;
  return 1 + pct / 100;
}

// base_price_pp is a flat per-plate price at the 500-plate baseline (see 0004 migration -
// pricing_tiers is deprecated and unread). Every display of a price runs through here.
export function quotePerPlate(basePricePp: number, plates: number): number {
  return basePricePp * getPlateMultiplier(plates);
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
