import { notFound } from "next/navigation";
import { getVendorProfile } from "@/lib/queries/vendors";
import { VendorProfileBoard } from "@/components/VendorProfileBoard";

export default async function VendorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const vendor = await getVendorProfile(slug);

  if (!vendor) notFound();

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      <VendorProfileBoard vendor={vendor} />
    </main>
  );
}
