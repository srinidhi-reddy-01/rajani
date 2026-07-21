import { notFound } from "next/navigation";
import { getVendorProfile } from "@/lib/queries/vendors";
import { VendorProfileBoard } from "@/components/VendorProfileBoard";

export default async function VendorPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ plates?: string; cuisines?: string; budget?: string; date?: string; eventType?: string }>;
}) {
  const { slug } = await params;
  const { plates, cuisines, budget, date, eventType } = await searchParams;
  const vendor = await getVendorProfile(slug);

  if (!vendor) notFound();

  const guidedContext = {
    plates: plates ? Number(plates) : 500,
    cuisines: cuisines ? cuisines.split(",").filter(Boolean) : [],
    budgetPp: budget ? Number(budget) : null,
    eventDate: date ?? "",
    eventType: eventType ?? "",
  };

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10 pb-28">
      <VendorProfileBoard vendor={vendor} guidedContext={guidedContext} />
    </main>
  );
}
