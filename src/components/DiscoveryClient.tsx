"use client";

import { useMemo, useState } from "react";
import type { Cuisine, EventType } from "@/lib/types/database";
import type { DiscoverableVendor, MatchedVendor } from "@/lib/matching";
import { matchVendors } from "@/lib/matching";
import { VendorMatchCard } from "@/components/VendorMatchCard";
import { MatchMeForm } from "@/components/MatchMeForm";
import { MultiSelectDropdown } from "@/components/MultiSelectDropdown";
import { QUOTE_DISCLAIMER, formatInr } from "@/lib/pricing";

const PLATE_STEP = 50;
const MIN_PLATES = 50;

const chipBase =
  "flex h-11 shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-sm font-medium transition-colors duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600";
const chipInactive = "border-border bg-surface text-ink hover:border-gold-500";
const chipActive = "border-royal-600 bg-royal-700 text-cream-50";

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Renders a vendor grid that's already sorted matches-first (see matchVendors);
// when a cuisine/event-type filter is active and the group actually contains a
// mix, splits it visually at the true->false boundary with a quiet divider -
// the non-matching vendors are never hidden, just deprioritised.
function VendorFilterGroup({
  vendors,
  plates,
  contextQuery,
  hasSoftFilter,
  fallbackCoverImageUrl,
}: {
  vendors: (MatchedVendor & { budgetLabel?: "above" | "below" })[];
  plates: number;
  contextQuery: string;
  hasSoftFilter: boolean;
  fallbackCoverImageUrl: string | null;
}) {
  const primary = hasSoftFilter ? vendors.filter((v) => v.matchesFilters) : vendors;
  const secondary = hasSoftFilter ? vendors.filter((v) => !v.matchesFilters) : [];

  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {primary.map((vendor) => (
          <VendorMatchCard
            key={vendor.id}
            vendor={vendor}
            plates={plates}
            budgetLabel={vendor.budgetLabel}
            contextQuery={contextQuery}
            fallbackCoverImageUrl={fallbackCoverImageUrl}
          />
        ))}
      </div>
      {secondary.length > 0 && (
        <>
          <div className="flex items-center gap-3 text-xs text-ink-muted">
            <span className="h-px flex-1 bg-border" />
            Also available
            <span className="h-px flex-1 bg-border" />
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {secondary.map((vendor) => (
              <VendorMatchCard
                key={vendor.id}
                vendor={vendor}
                plates={plates}
                budgetLabel={vendor.budgetLabel}
                contextQuery={contextQuery}
                fallbackCoverImageUrl={fallbackCoverImageUrl}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}

export function DiscoveryClient({
  vendors,
  cuisines,
  eventTypes,
  fallbackCoverImageUrl,
}: {
  vendors: DiscoverableVendor[];
  cuisines: Cuisine[];
  eventTypes: EventType[];
  fallbackCoverImageUrl: string | null;
}) {
  const [plates, setPlates] = useState(500);
  const [budgetPp, setBudgetPp] = useState<number | "">("");
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [eventDate, setEventDate] = useState("");
  const [sort, setSort] = useState<"match" | "price">("match");

  const { matched, others } = useMemo(
    () =>
      matchVendors(vendors, {
        plates,
        cuisines: selectedCuisines,
        eventTypes: selectedEventTypes,
        budgetPp: budgetPp === "" ? null : budgetPp,
        sort,
      }),
    [vendors, plates, selectedCuisines, selectedEventTypes, budgetPp, sort]
  );

  const contextQuery = new URLSearchParams({
    plates: String(plates),
    ...(selectedCuisines.length > 0 ? { cuisines: selectedCuisines.join(",") } : {}),
    ...(budgetPp !== "" ? { budget: String(budgetPp) } : {}),
    ...(eventDate ? { date: eventDate } : {}),
    ...(selectedEventTypes.length > 0 ? { eventType: selectedEventTypes.join(", ") } : {}),
  }).toString();

  const hasSoftFilter = selectedCuisines.length > 0 || selectedEventTypes.length > 0;
  const hasActiveFilters = hasSoftFilter || budgetPp !== "" || eventDate !== "" || sort !== "match";

  function clearAllFilters() {
    setSelectedCuisines([]);
    setSelectedEventTypes([]);
    setBudgetPp("");
    setEventDate("");
    setSort("match");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Caterers matched for you</h1>
        <p className="mt-1 text-sm text-ink-muted">All filters are optional — adjust anything to see prices update live.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <MultiSelectDropdown label="Event type" options={eventTypes} selected={selectedEventTypes} onChange={setSelectedEventTypes} className="w-44" />
        <MultiSelectDropdown label="Cuisine" options={cuisines} selected={selectedCuisines} onChange={setSelectedCuisines} className="w-44" />
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="h-11 cursor-pointer rounded-lg px-3 text-sm font-medium text-ink-muted underline-offset-2 transition-colors duration-200 ease-out hover:text-ink hover:underline"
          >
            Clear all filters
          </button>
        )}
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        <div className={`${chipBase} ${chipInactive} gap-2`}>
          <button
            type="button"
            aria-label="Decrease plates"
            onClick={() => setPlates((p) => Math.max(MIN_PLATES, p - PLATE_STEP))}
            className="cursor-pointer px-1 text-ink-muted hover:text-royal-700"
          >
            −
          </button>
          <input
            type="number"
            value={plates}
            step={PLATE_STEP}
            min={MIN_PLATES}
            onChange={(e) => {
              const next = Number(e.target.value);
              setPlates(Number.isFinite(next) && next > 0 ? next : MIN_PLATES);
            }}
            className="w-14 border-none bg-transparent text-center focus:outline-none"
          />
          <button
            type="button"
            aria-label="Increase plates"
            onClick={() => setPlates((p) => p + PLATE_STEP)}
            className="cursor-pointer px-1 text-ink-muted hover:text-royal-700"
          >
            +
          </button>
          <span className="text-ink-muted">plates</span>
        </div>

        <label className={`${chipBase} ${chipInactive}`}>
          <span aria-hidden>₹</span>
          <input
            type="number"
            min={1}
            placeholder="Any budget"
            value={budgetPp}
            onChange={(e) => setBudgetPp(e.target.value ? Number(e.target.value) : "")}
            className="w-24 border-none bg-transparent focus:outline-none"
          />
          <span className="text-ink-muted">/plate</span>
        </label>

        <label className={`${chipBase} ${chipInactive}`}>
          <input
            type="date"
            min={todayIso()}
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="border-none bg-transparent focus:outline-none"
          />
        </label>

        <button
          type="button"
          onClick={() => setSort("match")}
          aria-pressed={sort === "match"}
          className={`${chipBase} ${sort === "match" ? chipActive : chipInactive}`}
        >
          Best match
        </button>
        <button
          type="button"
          onClick={() => setSort("price")}
          aria-pressed={sort === "price"}
          className={`${chipBase} ${sort === "price" ? chipActive : chipInactive}`}
        >
          Price: low to high
        </button>
      </div>

      {matched.length === 0 && others.length === 0 ? (
        <p className="text-sm text-ink-muted">No caterers are live yet — check back soon.</p>
      ) : (
        <>
          {matched.length > 0 && (
            <section className="flex flex-col gap-4">
              {budgetPp !== "" && sort === "match" && <h2 className="text-sm font-medium text-ink-muted">Within your budget</h2>}
              <VendorFilterGroup
                vendors={matched}
                plates={plates}
                contextQuery={contextQuery}
                hasSoftFilter={hasSoftFilter}
                fallbackCoverImageUrl={fallbackCoverImageUrl}
              />
            </section>
          )}

          {others.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="text-sm font-medium text-ink-muted">More options</h2>
              <VendorFilterGroup
                vendors={others}
                plates={plates}
                contextQuery={contextQuery}
                hasSoftFilter={hasSoftFilter}
                fallbackCoverImageUrl={fallbackCoverImageUrl}
              />
            </section>
          )}
        </>
      )}

      <p className="text-xs text-ink-muted">
        {budgetPp !== "" ? `Budget shown as ${formatInr(Number(budgetPp))}/plate. ` : ""}
        {QUOTE_DISCLAIMER}
      </p>

      <div className="mt-6 border-t border-border pt-10">
        <MatchMeForm cuisines={cuisines} eventTypes={eventTypes} />
      </div>
    </div>
  );
}
