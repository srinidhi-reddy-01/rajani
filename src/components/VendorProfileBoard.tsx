"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { VendorProfile } from "@/lib/queries/vendors";
import { formatInr, quotePerPlate, QUOTE_DISCLAIMER } from "@/lib/pricing";
import { submitEnquiry, submitTastingRequest } from "@/lib/consumer/actions";
import { CtaModal } from "@/components/CtaModal";

type GuidedContext = {
  plates: number;
  cuisines: string[];
  budgetPp: number | null;
  eventDate: string;
  eventType: string;
};

const ctaButtonClass =
  "h-14 flex-1 cursor-pointer rounded-lg text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600";

export function VendorProfileBoard({ vendor, guidedContext }: { vendor: VendorProfile; guidedContext: GuidedContext }) {
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(
    vendor.packages.find((p) => p.is_default)?.id ?? vendor.packages[0]?.id ?? null
  );
  const [openModal, setOpenModal] = useState<"enquire" | "tasting" | null>(null);

  const selectedPackage = vendor.packages.find((p) => p.id === selectedPackageId) ?? null;

  const ctaContext = {
    plates: guidedContext.plates,
    cuisines: guidedContext.cuisines,
    budgetPp: guidedContext.budgetPp,
    eventDate: guidedContext.eventDate,
    eventType: guidedContext.eventType,
    packageId: selectedPackage?.id ?? null,
    packageName: selectedPackage?.name ?? null,
    quotedPp: selectedPackage ? quotePerPlate(selectedPackage.base_price_pp, guidedContext.plates) : null,
  };

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/discover"
        className="w-fit rounded-sm text-sm text-ink-muted transition hover:text-royal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600"
      >
        ← Back to caterers
      </Link>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            {vendor.logo_url && (
              <Image
                src={vendor.logo_url}
                alt={`${vendor.name} logo`}
                width={48}
                height={48}
                className="h-12 w-12 rounded-lg border border-border object-cover"
              />
            )}
            <h1 className="text-2xl font-semibold text-royal-700">{vendor.name}</h1>
          </div>
          {vendor.gbp_rating != null && (
            <span className="whitespace-nowrap text-sm text-ink-muted">
              <span className="text-gold-500">★</span> {vendor.gbp_rating.toFixed(1)} Google rating
              {vendor.gbp_rating_count != null && <span> ({vendor.gbp_rating_count} ratings)</span>}
            </span>
          )}
        </div>
        {vendor.area && <p className="text-sm text-ink-muted">{vendor.area}</p>}
        {vendor.description && <p className="text-sm text-ink">{vendor.description}</p>}
        <div className="flex flex-wrap gap-1.5">
          {[...vendor.cuisine_specialities, ...vendor.event_specialities].map((tag) => (
            <span key={tag} className="rounded-full bg-royal-100 px-2 py-0.5 text-xs text-royal-700">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {vendor.vendor_media.length > 0 && (
        <div className="flex gap-3 overflow-x-auto">
          {vendor.vendor_media.map((m) => (
            <Image
              key={m.id}
              src={m.url}
              alt={`${vendor.name} photo`}
              width={200}
              height={150}
              className="h-36 w-48 shrink-0 rounded-2xl border border-border object-cover"
            />
          ))}
        </div>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-royal-700">Packages</h2>
        {vendor.packages.length === 0 ? (
          <p className="text-sm text-ink-muted">No packages published yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {vendor.packages.map((pkg) => {
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
                    {formatInr(pkg.base_price_pp)} <span className="text-sm font-normal text-ink-muted">/ plate</span>
                  </p>
                  {pkg.min_plates && <p className="text-xs text-ink-muted">Minimum {pkg.min_plates} plates</p>}
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
                      <span className="whitespace-nowrap text-sm font-medium text-gold-600">{formatInr(item.base_price_pp)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })
        )}
      </section>

      <p className="text-xs text-ink-muted">{QUOTE_DISCLAIMER}</p>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 p-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-4xl gap-3">
          <button type="button" onClick={() => setOpenModal("tasting")} className={`${ctaButtonClass} border border-royal-700 text-royal-700 hover:bg-royal-100`}>
            Get sample box
          </button>
          <button type="button" onClick={() => setOpenModal("enquire")} className={`${ctaButtonClass} bg-royal-700 text-white hover:bg-royal-800`}>
            Enquire for booking
          </button>
        </div>
      </div>

      <CtaModal
        open={openModal === "enquire"}
        onClose={() => setOpenModal(null)}
        title="Enquire for booking"
        action={submitEnquiry.bind(null, vendor.id, ctaContext)}
      />
      <CtaModal
        open={openModal === "tasting"}
        onClose={() => setOpenModal(null)}
        title="Get a sample box"
        action={submitTastingRequest.bind(null, vendor.id, ctaContext)}
      />
    </div>
  );
}
