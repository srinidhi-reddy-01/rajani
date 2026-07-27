import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getVendorProfile } from "@/lib/queries/vendors";
import { VendorProfileBoard } from "@/components/VendorProfileBoard";
import { vendorCoverImage } from "@/lib/images";
import { getFallbackCoverImageUrl } from "@/lib/queries/settings";
import { formatInr, quotePerPlate } from "@/lib/pricing";

// #12: per-vendor OG/Twitter meta so a shared link (e.g. on WhatsApp) previews the
// vendor's photo, name, rating, and starting price instead of the generic site card.
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const vendor = await getVendorProfile(slug);
  if (!vendor) return {};

  const lowestPrice =
    vendor.packages.length > 0 ? Math.min(...vendor.packages.map((p) => quotePerPlate(p.base_price_pp, 500))) : null;
  const ratingText = vendor.gbp_rating != null ? `★ ${vendor.gbp_rating.toFixed(1)} Google rating · ` : "";
  const priceText = lowestPrice != null ? `Packages from ${formatInr(lowestPrice)}/plate` : "Real packages, real prices";
  const description = `${ratingText}${priceText}`;
  const fallbackCoverImageUrl = await getFallbackCoverImageUrl();
  const image = vendorCoverImage(vendor.id, vendor.cover_image_url ?? vendor.logo_url, fallbackCoverImageUrl);

  return {
    title: `${vendor.name} — Āgata`,
    description,
    openGraph: { title: vendor.name, description, images: [image], type: "website" },
    twitter: { card: "summary_large_image", title: vendor.name, description, images: [image] },
  };
}

export default async function VendorPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ plates?: string; cuisines?: string; budget?: string; date?: string; eventType?: string }>;
}) {
  const { slug } = await params;
  const { plates, cuisines, budget, date, eventType } = await searchParams;
  const [vendor, fallbackCoverImageUrl] = await Promise.all([getVendorProfile(slug), getFallbackCoverImageUrl()]);

  if (!vendor) notFound();

  const guidedContext = {
    plates: plates ? Number(plates) : 500,
    cuisines: cuisines ? cuisines.split(",").filter(Boolean) : [],
    budgetPp: budget ? Number(budget) : null,
    eventDate: date ?? "",
    eventType: eventType ?? "",
  };

  return (
    <main className="pb-28">
      <VendorProfileBoard vendor={vendor} guidedContext={guidedContext} fallbackCoverImageUrl={fallbackCoverImageUrl} />
    </main>
  );
}
