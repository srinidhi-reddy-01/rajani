import Link from "next/link";
import { getMatchedVendors } from "@/lib/queries/discover";
import { VendorMatchCard } from "@/components/VendorMatchCard";
import { QUOTE_DISCLAIMER } from "@/lib/pricing";

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ plates?: string; cuisines?: string; budget?: string; date?: string; eventType?: string; sort?: string }>;
}) {
  const { plates, cuisines, budget, date, eventType, sort } = await searchParams;
  const cuisineList = cuisines ? cuisines.split(",").filter(Boolean) : [];
  const budgetPp = budget ? Number(budget) : undefined;
  const sortMode = sort === "price" ? "price" : "match";

  const { matched, others } = await getMatchedVendors({ cuisines: cuisineList, budgetPp, sort: sortMode });

  const criteriaParams = new URLSearchParams();
  if (plates) criteriaParams.set("plates", plates);
  if (cuisines) criteriaParams.set("cuisines", cuisines);
  if (budget) criteriaParams.set("budget", budget);
  if (date) criteriaParams.set("date", date);
  if (eventType) criteriaParams.set("eventType", eventType);

  const priceSortHref = `/discover?${criteriaParams.toString()}&sort=price`;
  const matchSortHref = `/discover?${criteriaParams.toString()}&sort=match`;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-royal-700">Caterers matched for you</h1>
          <p className="mt-1 flex flex-wrap gap-x-3 text-sm text-ink-muted">
            {plates && <span>{plates} plates</span>}
            {eventType && <span>{eventType}</span>}
            {date && <span>{date}</span>}
            {budgetPp && <span>₹{budgetPp}/plate budget</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Link href="/find" className="text-ink-muted hover:text-royal-700">
            Change details
          </Link>
          <span className="text-border">|</span>
          <Link href={matchSortHref} className={sortMode === "match" ? "font-medium text-royal-700" : "text-ink-muted hover:text-royal-700"}>
            Best match
          </Link>
          <Link href={priceSortHref} className={sortMode === "price" ? "font-medium text-royal-700" : "text-ink-muted hover:text-royal-700"}>
            Price: low to high
          </Link>
        </div>
      </div>

      {matched.length === 0 && others.length === 0 ? (
        <p className="text-sm text-ink-muted">No caterers are live yet — check back soon.</p>
      ) : (
        <>
          {matched.length > 0 && (
            <section className="flex flex-col gap-4">
              {budgetPp && sortMode === "match" && <h2 className="text-sm font-medium text-ink-muted">Within your budget</h2>}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {matched.map((vendor) => (
                  <VendorMatchCard key={vendor.id} vendor={vendor} />
                ))}
              </div>
            </section>
          )}

          {others.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="text-sm font-medium text-ink-muted">More options</h2>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {others.map((vendor) => (
                  <VendorMatchCard key={vendor.id} vendor={vendor} budgetLabel={vendor.budgetLabel} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <p className="text-xs text-ink-muted">{QUOTE_DISCLAIMER}</p>
    </main>
  );
}
