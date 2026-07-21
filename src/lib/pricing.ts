// pricing_tiers is deprecated (see 0004 migration) - base_price_pp is a flat per-plate
// price on its own. `plates` is accepted (unused for now) so every call site is already
// wired for the platform-wide dynamic multiplier landing in a later update.
export function quotePerPlate(basePricePp: number, plates: number): number {
  void plates;
  return basePricePp;
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
