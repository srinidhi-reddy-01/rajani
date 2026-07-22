"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import type { MatchedVendor } from "@/lib/matching";
import { formatInr, quotePerPlate } from "@/lib/pricing";
import { vendorCoverImage } from "@/lib/images";
import { VendorAvatar } from "@/components/VendorAvatar";

export function VendorMatchCard({
  vendor,
  plates,
  budgetLabel,
  contextQuery,
}: {
  vendor: MatchedVendor;
  plates: number;
  budgetLabel?: "above" | "below";
  contextQuery?: string;
}) {
  const cheapestPackage = [...vendor.packages].sort((a, b) => a.base_price_pp - b.base_price_pp)[0];
  const fromPrice = quotePerPlate(cheapestPackage.base_price_pp, plates);
  const href = contextQuery ? `/vendors/${vendor.slug}?${contextQuery}` : `/vendors/${vendor.slug}`;

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.18, ease: "easeOut" }}>
      <Link
        href={href}
        className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition-shadow duration-200 hover:shadow-card-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600"
      >
        <div className="relative h-40 w-full">
          <Image
            src={vendorCoverImage(vendor.id, vendor.cover_image_url)}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
          {vendor.gbp_rating != null && (
            <span className="absolute right-3 top-3 rounded-full bg-charcoal-900/80 px-3 py-1 text-xs font-medium text-cream-50 backdrop-blur-sm">
              <span className="text-gold-500">★</span> {vendor.gbp_rating.toFixed(1)} Google rating
              {vendor.gbp_rating_count != null && <span className="text-cream-50/70"> ({vendor.gbp_rating_count})</span>}
            </span>
          )}
          <VendorAvatar
            name={vendor.name}
            ownerPhotoUrl={vendor.owner_photo_url}
            logoUrl={vendor.logo_url}
            className="absolute -bottom-6 left-4 h-14 w-14"
          />
        </div>

        <div className="flex flex-col gap-3 p-5 pt-9">
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-serif text-lg font-semibold text-ink group-hover:text-royal-700">{vendor.name}</h3>
              {vendor.is_verified && (
                <span
                  title="Personally verified by the Rajani team"
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-600 text-[10px] text-cream-50"
                  aria-label="Verified: personally verified by the Rajani team"
                >
                  ✓
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-2 text-sm text-ink-muted">
              {vendor.area && <span>{vendor.area}</span>}
              {vendor.events_completed > 0 && (
                <span>
                  {vendor.area && "· "}
                  {vendor.events_completed} events completed
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {vendor.cuisine_specialities.map((tag) => (
              <span key={tag} className="rounded-full bg-royal-100 px-2 py-0.5 text-xs text-royal-700">
                {tag}
              </span>
            ))}
            {budgetLabel && (
              <span className="rounded-full bg-gold-100 px-2 py-0.5 text-xs text-gold-600">
                {budgetLabel === "above" ? "Above your budget" : "Below your budget"}
              </span>
            )}
          </div>

          <p className="border-t border-gold-100 pt-3 text-base font-semibold text-gold-600">
            Packages from {formatInr(fromPrice)}/plate <span className="font-normal text-ink-muted">at your {plates} plates</span>
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
