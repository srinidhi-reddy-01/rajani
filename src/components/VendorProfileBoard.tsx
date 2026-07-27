"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import type { VendorProfile } from "@/lib/queries/vendors";
import type { PackageItemSelection } from "@/lib/types/database";
import { formatInr, quotePerPlate, QUOTE_DISCLAIMER } from "@/lib/pricing";
import { submitEnquiry, submitTastingRequest } from "@/lib/consumer/actions";
import { CtaModal } from "@/components/CtaModal";
import { vendorCoverImage } from "@/lib/images";
import { PackageSelector, type SlotSelection } from "@/components/PackageSelector";

type GuidedContext = {
  plates: number;
  cuisines: string[];
  budgetPp: number | null;
  eventDate: string;
  eventType: string;
};

const ctaButtonClass =
  "h-14 flex-1 cursor-pointer rounded-xl text-sm font-medium transition-colors duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600 disabled:cursor-not-allowed disabled:opacity-40";

function AnimatedPrice({ amount, suffix }: { amount: number; suffix?: string }) {
  const rounded = Math.round(amount);
  return (
    <span className="inline-flex overflow-hidden align-bottom">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={rounded}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -10, opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          {formatInr(rounded)}
          {suffix}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function VendorProfileBoard({
  vendor,
  guidedContext,
  fallbackCoverImageUrl,
}: {
  vendor: VendorProfile;
  guidedContext: GuidedContext;
  fallbackCoverImageUrl: string | null;
}) {
  const [plates, setPlates] = useState(guidedContext.plates);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(
    vendor.packages.find((p) => p.is_default)?.id ?? vendor.packages[0]?.id ?? null
  );
  const [slotSelection, setSlotSelection] = useState<SlotSelection>({});
  const [openModal, setOpenModal] = useState<"enquire" | "tasting" | null>(null);

  const galleryPhotos = vendor.vendor_media.filter((m) => m.kind === "gallery");
  const testimonials = vendor.vendor_media.filter((m) => m.kind === "testimonial");

  const selectedPackage = vendor.packages.find((p) => p.id === selectedPackageId) ?? null;
  const hasSlots = (selectedPackage?.slots.length ?? 0) > 0;

  // Menu customisation is entirely optional and never blocks "Check availability" (#3).
  // The chooser renders expanded by default (no collapse toggle), so whenever a
  // package has slots the enquiry carries the itemised selection - preselected
  // defaults if the user never touched it, their own picks if they did.
  const itemSelection: PackageItemSelection[] = useMemo(() => {
    if (!selectedPackage || !hasSlots) return [];
    return selectedPackage.slots.map((slot) => {
      const selectedIds = slotSelection[slot.id] ?? [];
      const selectedOptions = slot.options.filter((o) => selectedIds.includes(o.itemId));
      return {
        category_id: slot.categoryId,
        category_name: slot.categoryName,
        selections_count: slot.selectionsCount,
        selected_item_ids: selectedOptions.map((o) => o.itemId),
        selected_item_names: selectedOptions.map((o) => o.name),
      };
    });
  }, [selectedPackage, hasSlots, slotSelection]);

  const ctaContext = {
    plates,
    cuisines: guidedContext.cuisines,
    budgetPp: guidedContext.budgetPp,
    eventDate: guidedContext.eventDate,
    eventType: guidedContext.eventType,
    packageId: selectedPackage?.id ?? null,
    packageName: selectedPackage?.name ?? null,
    quotedPp: selectedPackage ? quotePerPlate(selectedPackage.base_price_pp, plates) : null,
    selection: itemSelection,
  };

  return (
    <div className="flex flex-col gap-8 pb-32">
      <div className="relative h-64 w-full sm:h-80">
        <Image
          src={vendorCoverImage(vendor.id, vendor.cover_image_url, fallbackCoverImageUrl)}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900 via-charcoal-900/50 to-transparent" />
        <Link
          href="/discover"
          className="absolute left-4 top-4 rounded-full bg-charcoal-900/60 px-3 py-1.5 text-sm text-cream-50 backdrop-blur-sm transition-colors duration-200 ease-out hover:bg-charcoal-900/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream-50"
        >
          ← Back
        </Link>
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
          <div className="flex items-center gap-3">
            {vendor.logo_url && (
              <Image
                src={vendor.logo_url}
                alt={`${vendor.name} logo`}
                width={48}
                height={48}
                className="h-12 w-12 rounded-xl border border-cream-50/30 object-cover"
              />
            )}
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-cream-50 sm:text-4xl">{vendor.name}</h1>
              <p className="text-sm text-cream-50/80">
                {vendor.area}
                {vendor.area && vendor.established_year && " · "}
                {vendor.established_year && `Serving since ${vendor.established_year}`}
              </p>
            </div>
          </div>
          {vendor.gbp_rating != null && (
            <span className="whitespace-nowrap rounded-full bg-charcoal-900/60 px-3 py-1.5 text-sm text-cream-50 backdrop-blur-sm">
              <span className="text-gold-500">★</span> {vendor.gbp_rating.toFixed(1)} Google rating
              {vendor.gbp_rating_count != null && <span className="text-cream-50/70"> ({vendor.gbp_rating_count})</span>}
            </span>
          )}
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 sm:px-6">
        {vendor.description && <p className="text-sm text-ink">{vendor.description}</p>}
        <div className="flex flex-wrap gap-1.5">
          {[...vendor.cuisine_specialities, ...vendor.event_specialities].map((tag) => (
            <span key={tag} className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-gold-500/40 bg-gold-100 px-4 py-3 text-sm text-ink">
          <p>
            <span className="font-semibold text-gold-600">Book through us and get ₹1000 off your booking value</span>{" "}
            after your event. <span className="text-ink-muted">T&amp;C apply.</span>
          </p>
        </div>

        {galleryPhotos.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold tracking-tight text-ink">Presentation</h2>
            <div className="flex gap-3 overflow-x-auto">
              {galleryPhotos.map((m) => (
                <Image
                  key={m.id}
                  src={m.url}
                  alt={`${vendor.name} photo`}
                  width={200}
                  height={150}
                  className="h-36 w-48 shrink-0 rounded-3xl border border-border object-cover"
                />
              ))}
            </div>
          </div>
        )}

        {testimonials.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold tracking-tight text-ink">What hosts say</h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {testimonials.map((t) => (
                <div
                  key={t.id}
                  className="w-56 shrink-0 rounded-3xl border border-border bg-surface p-2 shadow-card"
                >
                  <div className="relative h-72 w-full overflow-hidden rounded-2xl">
                    <Image src={t.url} alt="Host testimonial screenshot" fill sizes="224px" className="object-cover" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <label className="flex items-center gap-3 text-sm text-ink-muted">
          Plates
          <input
            type="number"
            min={1}
            value={plates}
            onChange={(e) => {
              const next = Number(e.target.value);
              setPlates(Number.isFinite(next) && next > 0 ? next : 1);
            }}
            className="h-11 w-28 rounded-lg border border-border bg-surface px-3 text-sm text-ink focus:border-royal-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-royal-100"
          />
        </label>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold tracking-tight text-ink">Packages</h2>
          {vendor.packages.length === 0 ? (
            <p className="text-sm text-ink-muted">No packages published yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {vendor.packages.map((pkg) => {
                const selected = pkg.id === selectedPackageId;
                return (
                  <motion.button
                    key={pkg.id}
                    type="button"
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    aria-pressed={selected}
                    onClick={() => setSelectedPackageId(pkg.id)}
                    className={`flex min-h-11 cursor-pointer flex-col gap-1 rounded-3xl border p-4 text-left shadow-card transition-shadow duration-200 ease-out hover:shadow-card-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600 ${
                      selected
                        ? "border-royal-600 bg-royal-50 ring-2 ring-royal-100"
                        : "border-border bg-surface hover:border-royal-600"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-medium text-ink">{pkg.name}</h3>
                      <div className="flex items-center gap-1.5">
                        {pkg.is_default && (
                          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">Default</span>
                        )}
                        {selected && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-royal-600 text-xs text-cream-50">
                            ✓
                          </span>
                        )}
                      </div>
                    </div>
                    {pkg.description && <p className="text-sm text-ink-muted">{pkg.description}</p>}
                    <p className="mt-2 text-lg font-semibold text-gold-600">
                      <AnimatedPrice amount={quotePerPlate(pkg.base_price_pp, plates)} />{" "}
                      <span className="text-sm font-normal text-ink-muted">/ plate at {plates} plates</span>
                    </p>
                    {pkg.min_plates && <p className="text-xs text-ink-muted">Minimum {pkg.min_plates} plates</p>}
                  </motion.button>
                );
              })}
            </div>
          )}
          <p className="text-xs text-ink-muted">{QUOTE_DISCLAIMER}</p>
        </section>

        {selectedPackage && hasSlots && (
          <section className="flex flex-col gap-4 rounded-3xl border border-border bg-ivory p-4 sm:p-6">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-ink">Choose menu items to get the exact quote</h2>
              <p className="text-sm text-ink-muted">Optional — availability works with just the package above. Defaults are preselected.</p>
            </div>
            <PackageSelector key={selectedPackage.id} slots={selectedPackage.slots} onChange={setSlotSelection} />
          </section>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-2 p-4">
          {selectedPackage && (
            <div className="flex items-center justify-between text-xs text-ink-muted">
              <span>
                {hasSlots
                  ? `${selectedPackage.name} — ${Object.values(slotSelection).reduce((n, ids) => n + ids.length, 0)} items selected`
                  : selectedPackage.name}
              </span>
              <span className="font-semibold text-gold-600">
                <AnimatedPrice amount={quotePerPlate(selectedPackage.base_price_pp, plates)} suffix="/plate" />
              </span>
            </div>
          )}
          <p className="text-[11px] text-ink-muted">
            Don&apos;t book blind — order a sample tasting box and taste the menu before you decide.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setOpenModal("tasting")}
              className={`${ctaButtonClass} border border-border text-ink hover:bg-ivory`}
            >
              Get sample box
            </button>
            <button
              type="button"
              onClick={() => setOpenModal("enquire")}
              className={`${ctaButtonClass} bg-royal-700 text-cream-50 hover:bg-royal-800`}
            >
              Check availability
            </button>
          </div>
        </div>
      </div>

      <CtaModal
        open={openModal === "enquire"}
        onClose={() => setOpenModal(null)}
        title="Check availability"
        description="Every booking includes a dedicated event manager on the day — so you can enjoy the event, not manage it."
        action={submitEnquiry.bind(null, vendor.id, ctaContext)}
      />
      <CtaModal
        open={openModal === "tasting"}
        onClose={() => setOpenModal(null)}
        title="Get a sample box"
        description="Don't book blind — taste the actual menu before you decide. You request, our team coordinates with the caterer, and the box reaches you."
        action={submitTastingRequest.bind(null, vendor.id, ctaContext)}
      />
    </div>
  );
}
