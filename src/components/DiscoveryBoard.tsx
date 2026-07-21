"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { VendorForDiscovery } from "@/lib/queries/vendors";
import { formatInr, quotePerPlate, QUOTE_DISCLAIMER } from "@/lib/pricing";
import { PlateCountControl } from "@/components/PlateCountControl";

export function DiscoveryBoard({ vendors }: { vendors: VendorForDiscovery[] }) {
  const [plates, setPlates] = useState(500);

  const cards = useMemo(
    () =>
      vendors.map((v) => ({
        vendor: v,
        quotePp: v.defaultPackage ? quotePerPlate(v.defaultPackage.base_price_pp, v.pricing_tiers, plates) : null,
      })),
    [vendors, plates]
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-neutral-900">Caterers in Hyderabad</h1>
        <PlateCountControl plates={plates} onChange={setPlates} />
      </div>

      {cards.length === 0 ? (
        <p className="text-neutral-500">No caterers live yet — check back soon.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(({ vendor, quotePp }) => (
            <Link
              key={vendor.id}
              href={`/vendors/${vendor.slug}`}
              className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-4 transition hover:border-neutral-400 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg font-medium text-neutral-900">{vendor.name}</h2>
                {vendor.gbp_rating != null && (
                  <span className="whitespace-nowrap text-sm text-neutral-600">
                    ★ {vendor.gbp_rating.toFixed(1)}
                    {vendor.gbp_rating_count != null && (
                      <span className="text-neutral-400"> ({vendor.gbp_rating_count})</span>
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

              <div className="mt-2 border-t border-neutral-100 pt-2">
                {quotePp != null ? (
                  <p className="text-base font-semibold text-neutral-900">
                    {formatInr(quotePp)} <span className="text-sm font-normal text-neutral-500">/ plate</span>
                  </p>
                ) : (
                  <p className="text-sm text-neutral-400">Quote unavailable</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <p className="text-xs text-neutral-400">{QUOTE_DISCLAIMER}</p>
    </div>
  );
}
