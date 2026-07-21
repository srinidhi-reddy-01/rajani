import { getCuisines, getEventTypes } from "@/lib/queries/lookups";
import { GuidedFlow } from "@/components/GuidedFlow";

export default async function FindPage() {
  const [cuisines, eventTypes] = await Promise.all([getCuisines(), getEventTypes()]);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <GuidedFlow cuisines={cuisines} eventTypes={eventTypes} />
    </main>
  );
}
