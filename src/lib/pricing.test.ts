import { describe, expect, it } from "vitest";
import { getPlateMultiplier } from "@/lib/pricing";

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
