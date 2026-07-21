"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { VendorProfile } from "@/lib/queries/vendors";
import { formatInr, quotePerPlate, QUOTE_DISCLAIMER } from "@/lib/pricing";
import { PlateCountControl } from "@/components/PlateCountControl";

export function VendorProfileBoard({ vendor }: { vendor: VendorProfile }) {
  const [plates, setPlates] = useState(500);

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
      <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-800">
        ← Back to caterers
      </Link>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h1 className="text-2xl font-semibold text-neutral-900">{vendor.name}</h1>
          {vendor.gbp_rating != null && (
            <span className="whitespace-nowrap text-sm text-neutral-600">
              ★ {vendor.gbp_rating.toFixed(1)}
              {vendor.gbp_rating_count != null && (
                <span className="text-neutral-400"> ({vendor.gbp_rating_count} ratings)</span>
              )}
            </span>
          )}
        </div>
        {vendor.area && <p className="text-sm text-neutral-500">{vendor.area}</p>}
        <div className="flex flex-wrap gap-1.5">
          {[...vendor.cuisine_specialities, ...vendor.event_specialities].map((tag) => (
            <span key={tag} className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="sticky top-0 z-10 -mx-6 border-y border-neutral-200 bg-white/95 px-6 py-3 backdrop-blur">
        <PlateCountControl plates={plates} onChange={setPlates} />
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-neutral-900">Packages</h2>
        {packageQuotes.length === 0 ? (
          <p className="text-sm text-neutral-400">No packages published yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {packageQuotes.map(({ pkg, quotePp }) => (
              <div
                key={pkg.id}
                className={`flex flex-col gap-1 rounded-lg border p-4 ${
                  pkg.is_default ? "border-neutral-900" : "border-neutral-200"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-medium text-neutral-900">{pkg.name}</h3>
                  {pkg.is_default && (
                    <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-xs text-white">Default</span>
                  )}
                </div>
                {pkg.description && <p className="text-sm text-neutral-500">{pkg.description}</p>}
                <p className="mt-2 text-lg font-semibold text-neutral-900">
                  {formatInr(quotePp)} <span className="text-sm font-normal text-neutral-500">/ plate</span>
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-neutral-900">Menu</h2>
        {vendor.menu_categories.length === 0 ? (
          <p className="text-sm text-neutral-400">No menu published yet.</p>
        ) : (
          vendor.menu_categories.map((category) => {
            const activeItems = category.menu_items.filter((item) => item.is_active);
            if (activeItems.length === 0) return null;
            return (
              <div key={category.id} className="flex flex-col gap-2">
                <h3 className="font-medium text-neutral-800">{category.name}</h3>
                <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-200">
                  {activeItems.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-4 px-4 py-2.5">
                      <span className="flex items-center gap-2 text-sm text-neutral-800">
                        <span
                          className={`inline-block h-2.5 w-2.5 shrink-0 rounded-sm border ${
                            item.is_veg ? "border-green-600 bg-green-500" : "border-red-600 bg-red-500"
                          }`}
                          aria-label={item.is_veg ? "Veg" : "Non-veg"}
                        />
                        {item.name}
                      </span>
                      <span className="whitespace-nowrap text-sm text-neutral-600">
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

      <p className="text-xs text-neutral-400">{QUOTE_DISCLAIMER}</p>
    </div>
  );
}
