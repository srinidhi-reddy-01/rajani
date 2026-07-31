import { describe, expect, it } from "vitest";
import { computeDiscountedTotal, getPlateMultiplier } from "@/lib/pricing";

describe("getPlateMultiplier", () => {
  it("clamps at +10% below 100 plates", () => {
    expect(getPlateMultiplier(50)).toBeCloseTo(1.1);
  });

  it("is +10% at exactly 100 plates", () => {
    expect(getPlateMultiplier(100)).toBeCloseTo(1.1);
  });

  it("is +5% at 300 plates", () => {
    expect(getPlateMultiplier(300)).toBeCloseTo(1.05);
  });

  it("is the base price (multiplier 1) at 500 plates", () => {
    expect(getPlateMultiplier(500)).toBeCloseTo(1.0);
  });

  it("is -5% at 750 plates", () => {
    expect(getPlateMultiplier(750)).toBeCloseTo(0.95);
  });

  it("is -10% at exactly 1000 plates", () => {
    expect(getPlateMultiplier(1000)).toBeCloseTo(0.9);
  });

  it("clamps at -10% above 1000 plates", () => {
    expect(getPlateMultiplier(1500)).toBeCloseTo(0.9);
  });
});

describe("computeDiscountedTotal", () => {
  it("computes discount and total for a round subtotal at 10%", () => {
    expect(computeDiscountedTotal(100000, 10)).toEqual({ subtotal: 100000, discount: 10000, total: 90000 });
  });

  it("rounds the discount to the nearest rupee", () => {
    // 12345 * 0.1 = 1234.5 -> rounds to 1235
    expect(computeDiscountedTotal(12345, 10)).toEqual({ subtotal: 12345, discount: 1235, total: 11110 });
  });

  it("is zero discount on a zero subtotal", () => {
    expect(computeDiscountedTotal(0, 10)).toEqual({ subtotal: 0, discount: 0, total: 0 });
  });

  it("supports a different per-vendor discount percent", () => {
    expect(computeDiscountedTotal(100000, 15)).toEqual({ subtotal: 100000, discount: 15000, total: 85000 });
  });
});
