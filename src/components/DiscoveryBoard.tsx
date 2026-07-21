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
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-royal-700">Caterers in Hyderabad</h1>
        <PlateCountControl plates={plates} onChange={setPlates} />
      </div>

      {cards.length === 0 ? (
        <p className="text-ink-muted">No caterers live yet — check back soon.</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(({ vendor, quotePp }) => (
            <Link
              key={vendor.id}
              href={`/vendors/${vendor.slug}`}
              className="group flex cursor-pointer flex-col gap-2 rounded-2xl border border-border bg-surface p-5 shadow-card transition duration-150 ease-out hover:-translate-y-0.5 hover:border-gold-500 hover:shadow-card-hover focus-visible:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg font-medium text-ink group-hover:text-royal-700">{vendor.name}</h2>
                {vendor.gbp_rating != null && (
                  <span className="whitespace-nowrap text-sm text-ink-muted">
                    <span className="text-gold-500">★</span> {vendor.gbp_rating.toFixed(1)}
                    {vendor.gbp_rating_count != null && <span> ({vendor.gbp_rating_count})</span>}
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

              <div className="mt-2 border-t border-gold-100 pt-2">
                {quotePp != null ? (
                  <p className="text-base font-semibold text-gold-600">
                    {formatInr(quotePp)} <span className="text-sm font-normal text-ink-muted">/ plate</span>
                  </p>
                ) : (
                  <p className="text-sm text-ink-muted">Quote unavailable</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <p className="text-xs text-ink-muted">{QUOTE_DISCLAIMER}</p>
    </div>
  );
}
