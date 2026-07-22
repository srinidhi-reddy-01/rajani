import { getLiveVendorsWithPackages } from "@/lib/queries/discover";
import { getCuisines, getEventTypes } from "@/lib/queries/lookups";
import { DiscoveryClient } from "@/components/DiscoveryClient";

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
