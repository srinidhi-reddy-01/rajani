"use client";

import { useMemo, useState } from "react";
import type { Cuisine, EventType } from "@/lib/types/database";
import type { DiscoverableVendor } from "@/lib/matching";
import { matchVendors } from "@/lib/matching";
import { VendorMatchCard } from "@/components/VendorMatchCard";
import { QUOTE_DISCLAIMER, formatInr } from "@/lib/pricing";

const PLATE_STEP = 50;
const MIN_PLATES = 50;

const chipBase =
  "flex h-11 shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600";
const chipInactive = "border-border bg-surface text-ink hover:border-gold-500";
const chipActive = "border-royal-600 bg-royal-700 text-cream-50";

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function DiscoveryClient({
  vendors,
  cuisines,
  eventTypes,
}: {
  vendors: DiscoverableVendor[];
  cuisines: Cuisine[];
  eventTypes: EventType[];
}) {
  const [plates, setPlates] = useState(500);
  const [budgetPp, setBudgetPp] = useState<number | "">("");
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [eventType, setEventType] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [sort, setSort] = useState<"match" | "price">("match");

  const { matched, others } = useMemo(
    () =>
      matchVendors(vendors, {
        plates,
        cuisines: selectedCuisines,
        budgetPp: budgetPp === "" ? null : budgetPp,
        sort,
      }),
    [vendors, plates, selectedCuisines, budgetPp, sort]
  );

  function toggleCuisine(name: string) {
    setSelectedCuisines((prev) => (prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]));
  }

  const contextQuery = new URLSearchParams({
    plates: String(plates),
    ...(selectedCuisines.length > 0 ? { cuisines: selectedCuisines.join(",") } : {}),
    ...(budgetPp !== "" ? { budget: String(budgetPp) } : {}),
    ...(eventDate ? { date: eventDate } : {}),
    ...(eventType ? { eventType } : {}),
  }).toString();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-royal-700">Caterers matched for you</h1>
        <p className="text-sm text-ink-muted">All filters are optional — adjust anything to see prices update live.</p>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        <div className={`${chipBase} ${chipInactive} gap-2`}>
          <span aria-hidden>🍽️</span>
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
          <span aria-hidden>📅</span>
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
          <span aria-hidden>✨</span> Best match
        </button>
        <button
          type="button"
          onClick={() => setSort("price")}
          aria-pressed={sort === "price"}
          className={`${chipBase} ${sort === "price" ? chipActive : chipInactive}`}
        >
          <span aria-hidden>↕️</span> Price: low to high
        </button>

        {eventTypes.map((et) => (
          <button
            key={et.id}
            type="button"
            onClick={() => setEventType((prev) => (prev === et.name ? "" : et.name))}
            aria-pressed={eventType === et.name}
            className={`${chipBase} ${eventType === et.name ? chipActive : chipInactive}`}
          >
            <span aria-hidden>🎉</span> {et.name}
          </button>
        ))}

        {cuisines.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => toggleCuisine(c.name)}
            aria-pressed={selectedCuisines.includes(c.name)}
            className={`${chipBase} ${selectedCuisines.includes(c.name) ? chipActive : chipInactive}`}
          >
            <span aria-hidden>🍛</span> {c.name}
          </button>
        ))}
      </div>

      {matched.length === 0 && others.length === 0 ? (
        <p className="text-sm text-ink-muted">No caterers are live yet — check back soon.</p>
      ) : (
        <>
          {matched.length > 0 && (
            <section className="flex flex-col gap-4">
              {budgetPp !== "" && sort === "match" && <h2 className="text-sm font-medium text-ink-muted">Within your budget</h2>}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {matched.map((vendor) => (
                  <VendorMatchCard key={vendor.id} vendor={vendor} plates={plates} contextQuery={contextQuery} />
                ))}
              </div>
            </section>
          )}

          {others.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="text-sm font-medium text-ink-muted">More options</h2>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {others.map((vendor) => (
                  <VendorMatchCard key={vendor.id} vendor={vendor} plates={plates} budgetLabel={vendor.budgetLabel} contextQuery={contextQuery} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <p className="text-xs text-ink-muted">
        {budgetPp !== "" ? `Budget shown as ${formatInr(Number(budgetPp))}/plate. ` : ""}
        {QUOTE_DISCLAIMER}
      </p>
    </div>
  );
}
