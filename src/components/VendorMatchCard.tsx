import Link from "next/link";
import type { MatchedVendor } from "@/lib/queries/discover";
import { formatInr } from "@/lib/pricing";

export function VendorMatchCard({
  vendor,
  budgetLabel,
}: {
  vendor: MatchedVendor;
  budgetLabel?: "above" | "below";
}) {
  const previewPackages = [...vendor.packages].sort((a, b) => a.base_price_pp - b.base_price_pp).slice(0, 2);
  const extraCount = vendor.packages.length - previewPackages.length;

  return (
    <Link
      href={`/vendors/${vendor.slug}`}
      className="group flex cursor-pointer flex-col gap-3 rounded-2xl border border-border bg-surface p-5 shadow-card transition duration-150 ease-out hover:-translate-y-0.5 hover:border-gold-500 hover:shadow-card-hover focus-visible:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-medium text-ink group-hover:text-royal-700">{vendor.name}</h3>
        {vendor.gbp_rating != null && (
          <span className="whitespace-nowrap text-sm text-ink-muted">
            <span className="text-gold-500">★</span> {vendor.gbp_rating.toFixed(1)} Google rating
            {vendor.gbp_rating_count != null && <span> ({vendor.gbp_rating_count})</span>}
          </span>
        )}
      </div>

      {vendor.area && <p className="text-sm text-ink-muted">{vendor.area}</p>}

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

      <ul className="flex flex-col gap-1 border-t border-gold-100 pt-2">
        {previewPackages.map((pkg) => (
          <li key={pkg.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-ink">{pkg.name}</span>
            <span className="font-semibold text-gold-600">{formatInr(pkg.base_price_pp)}/plate</span>
          </li>
        ))}
        {extraCount > 0 && <li className="text-xs text-ink-muted">+{extraCount} more package{extraCount > 1 ? "s" : ""}</li>}
      </ul>
    </Link>
  );
}
