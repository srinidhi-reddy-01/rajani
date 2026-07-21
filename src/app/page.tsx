import { getLiveVendorsForDiscovery } from "@/lib/queries/vendors";
import { DiscoveryBoard } from "@/components/DiscoveryBoard";

export default async function Home() {
  const vendors = await getLiveVendorsForDiscovery();

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <DiscoveryBoard vendors={vendors} />
    </main>
  );
}
