import { getLiveVendorsWithPackages } from "@/lib/queries/discover";
import { getCuisines, getEventTypes } from "@/lib/queries/lookups";
import { DiscoveryClient } from "@/components/DiscoveryClient";

// This page has no dynamic Next.js APIs, so it's statically prerendered - admin
// server actions call revalidatePath("/discover") on every vendor mutation, but
// data can also change outside admin actions (seed scripts, direct SQL). A short
// ISR interval is the safety net for that case.
export const revalidate = 60;

export default async function DiscoverPage() {
  const [vendors, cuisines, eventTypes] = await Promise.all([
    getLiveVendorsWithPackages(),
    getCuisines(),
    getEventTypes(),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10">
      <DiscoveryClient vendors={vendors} cuisines={cuisines} eventTypes={eventTypes} />
    </main>
  );
}
