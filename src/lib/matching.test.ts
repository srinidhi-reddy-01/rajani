import { describe, expect, it } from "vitest";
import { matchVendors, type DiscoverableVendor } from "@/lib/matching";

function vendor(overrides: Partial<DiscoverableVendor> & { id: string; basePricePp: number }): DiscoverableVendor {
  const { basePricePp, ...rest } = overrides;
  return {
    name: rest.id,
    slug: rest.id,
    area: null,
    gbp_rating: null,
    gbp_rating_count: null,
    cuisine_specialities: [],
    event_specialities: [],
    cover_image_url: null,
    owner_photo_url: null,
    logo_url: null,
    events_completed: 0,
    is_verified: false,
    fssai_license_number: null,
    packages: [
      {
        id: `${rest.id}-pkg`,
        vendor_id: rest.id,
        name: "Package",
        description: null,
        base_price_pp: basePricePp,
        min_plates: null,
        is_default: true,
        is_active: true,
        created_at: "2026-01-01T00:00:00Z",
      },
    ],
    ...rest,
  };
}

// Regression test for the bug where the event-type dropdown updated UI state but
// never reached matchVendors (no `eventTypes` field on MatchCriteria at all, and
// DiscoverableVendor didn't even carry event_specialities from the query).
describe("matchVendors - event type soft filter", () => {
  // Prices deliberately chosen so the cheapest vendor (wedding-caterer) does NOT
  // match the "Birthday party" filter - a real reordering test, not one where the
  // filtered and unfiltered orders coincidentally line up.
  const wedding = vendor({ id: "wedding-caterer", event_specialities: ["Wedding"], basePricePp: 100 });
  const birthday = vendor({ id: "birthday-caterer", event_specialities: ["Birthday party"], basePricePp: 500 });
  const both = vendor({ id: "both-caterer", event_specialities: ["Wedding", "Birthday party"], basePricePp: 700 });
  const vendors = [wedding, birthday, both];

  it("with no event type selected, orders purely by price (original order)", () => {
    const { matched } = matchVendors(vendors, { plates: 500 });
    expect(matched.map((v) => v.id)).toEqual(["wedding-caterer", "birthday-caterer", "both-caterer"]);
    expect(matched.every((v) => v.matchesFilters)).toBe(true);
  });

  it("selecting Birthday party ranks matching vendors first, without hiding the rest", () => {
    const { matched } = matchVendors(vendors, { plates: 500, eventTypes: ["Birthday party"] });

    // Never empty, never hides anyone - all 3 still present.
    expect(matched).toHaveLength(3);

    // Matches (birthday, both) come before the non-match (wedding-only), even
    // though wedding-caterer is the cheapest of the three.
    expect(matched.map((v) => v.id)).toEqual(["birthday-caterer", "both-caterer", "wedding-caterer"]);
    expect(matched.find((v) => v.id === "birthday-caterer")?.matchesFilters).toBe(true);
    expect(matched.find((v) => v.id === "both-caterer")?.matchesFilters).toBe(true);
    expect(matched.find((v) => v.id === "wedding-caterer")?.matchesFilters).toBe(false);
  });

  it("clearing the filter (no eventTypes) returns to the original price-only order", () => {
    const filtered = matchVendors(vendors, { plates: 500, eventTypes: ["Birthday party"] });
    const cleared = matchVendors(vendors, { plates: 500, eventTypes: [] });

    expect(filtered.matched.map((v) => v.id)).not.toEqual(cleared.matched.map((v) => v.id));
    expect(cleared.matched.map((v) => v.id)).toEqual(["wedding-caterer", "birthday-caterer", "both-caterer"]);
  });

  it("cuisine and event type both act as a combined OR soft filter", () => {
    const andhraOnly = vendor({ id: "andhra-only", cuisine_specialities: ["Andhra"], event_specialities: [], basePricePp: 600 });
    const list = [wedding, andhraOnly];

    const { matched } = matchVendors(list, { plates: 500, cuisines: ["Andhra"], eventTypes: ["Wedding"] });
    // Both satisfy at least one of the two active filters, so both are "matches" -
    // order falls back to price, no divider needed.
    expect(matched.every((v) => v.matchesFilters)).toBe(true);
  });

  it("a vendor matching neither active filter still shows, just deprioritised", () => {
    const noMatch = vendor({ id: "no-match", cuisine_specialities: ["Chinese"], event_specialities: ["Corporate event"], basePricePp: 100 });
    const { matched } = matchVendors([wedding, noMatch], { plates: 500, eventTypes: ["Wedding"] });

    expect(matched).toHaveLength(2);
    expect(matched[0].id).toBe("wedding-caterer");
    expect(matched[1].id).toBe("no-match");
    expect(matched[1].matchesFilters).toBe(false);
  });
});
