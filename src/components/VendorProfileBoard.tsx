"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { VendorProfile } from "@/lib/queries/vendors";
import { formatInr, quotePerPlate, QUOTE_DISCLAIMER } from "@/lib/pricing";
import { PlateCountControl } from "@/components/PlateCountControl";

export function VendorProfileBoard({ vendor }: { vendor: VendorProfile }) {
  const [plates, setPlates] = useState(500);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(
    vendor.packages.find((p) => p.is_default)?.id ?? vendor.packages[0]?.id ?? null
  );

  const packageQuotes = useMemo(
    () =>
      vendor.packages.map((pkg) => ({
        pkg,
        quotePp: quotePerPlate(pkg.base_price_pp, vendor.pricing_tiers, plates),
      })),
    [vendor.packages, vendor.pricing_tiers, plates]
  );

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/"
        className="w-fit rounded-sm text-sm text-ink-muted transition hover:text-royal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600"
      >
        ← Back to caterers
      </Link>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h1 className="text-2xl font-semibold text-royal-700">{vendor.name}</h1>
          {vendor.gbp_rating != null && (
            <span className="whitespace-nowrap text-sm text-ink-muted">
              <span className="text-gold-500">★</span> {vendor.gbp_rating.toFixed(1)}
              {vendor.gbp_rating_count != null && <span> ({vendor.gbp_rating_count} ratings)</span>}
            </span>
          )}
        </div>
        {vendor.area && <p className="text-sm text-ink-muted">{vendor.area}</p>}
        <div className="flex flex-wrap gap-1.5">
          {[...vendor.cuisine_specialities, ...vendor.event_specialities].map((tag) => (
            <span key={tag} className="rounded-full bg-royal-100 px-2 py-0.5 text-xs text-royal-700">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="sticky top-0 z-10 -mx-6 border-y border-border bg-surface/95 px-6 py-3 backdrop-blur">
        <PlateCountControl plates={plates} onChange={setPlates} />
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-royal-700">Packages</h2>
        {packageQuotes.length === 0 ? (
          <p className="text-sm text-ink-muted">No packages published yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {packageQuotes.map(({ pkg, quotePp }) => {
              const selected = pkg.id === selectedPackageId;
              return (
                <button
                  key={pkg.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setSelectedPackageId(pkg.id)}
                  className={`flex min-h-11 cursor-pointer flex-col gap-1 rounded-2xl border p-4 text-left shadow-card transition duration-150 ease-out hover:-translate-y-0.5 hover:shadow-card-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600 ${
                    selected
                      ? "border-royal-600 bg-royal-50 ring-2 ring-royal-100"
                      : "border-border bg-surface hover:border-gold-500"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-medium text-ink">{pkg.name}</h3>
                    <div className="flex items-center gap-1.5">
                      {pkg.is_default && (
                        <span className="rounded-full bg-gold-100 px-2 py-0.5 text-xs text-gold-600">Default</span>
                      )}
                      {selected && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-royal-600 text-xs text-white">
                          ✓
                        </span>
                      )}
                    </div>
                  </div>
                  {pkg.description && <p className="text-sm text-ink-muted">{pkg.description}</p>}
                  <p className="mt-2 text-lg font-semibold text-gold-600">
                    {formatInr(quotePp)} <span className="text-sm font-normal text-ink-muted">/ plate</span>
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-royal-700">Menu</h2>
        {vendor.menu_categories.length === 0 ? (
          <p className="text-sm text-ink-muted">No menu published yet.</p>
        ) : (
          vendor.menu_categories.map((category) => {
            const activeItems = category.menu_items.filter((item) => item.is_active);
            if (activeItems.length === 0) return null;
            return (
              <div key={category.id} className="flex flex-col gap-2">
                <h3 className="font-medium text-ink">{category.name}</h3>
                <ul className="divide-y divide-border rounded-2xl border border-border bg-surface shadow-card">
                  {activeItems.map((item) => (
                    <li key={item.id} className="flex min-h-11 items-center justify-between gap-4 px-4 py-2.5">
                      <span className="flex items-center gap-2 text-sm text-ink">
                        <span
                          className={`inline-block h-2.5 w-2.5 shrink-0 rounded-sm border ${
                            item.is_veg ? "border-green-600 bg-green-500" : "border-red-600 bg-red-500"
                          }`}
                          aria-label={item.is_veg ? "Veg" : "Non-veg"}
                        />
                        {item.name}
                      </span>
                      <span className="whitespace-nowrap text-sm font-medium text-gold-600">
                        {formatInr(quotePerPlate(item.base_price_pp, vendor.pricing_tiers, plates))}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })
        )}
      </section>

      <p className="text-xs text-ink-muted">{QUOTE_DISCLAIMER}</p>
    </div>
  );
}
