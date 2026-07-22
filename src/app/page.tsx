import Link from "next/link";
import Image from "next/image";
import { FadeIn } from "@/components/motion/FadeIn";
import { MatchMeForm } from "@/components/MatchMeForm";
import { getCuisines, getEventTypes } from "@/lib/queries/lookups";

const FEATURES = [
  {
    title: "Browse caterers instantly",
    body: "See real packages and prices from Hyderabad caterers the moment you land — no forms first.",
  },
  {
    title: "Filter as you go",
    body: "Plates, budget, cuisine, event type — every filter is optional, and prices update live.",
  },
  {
    title: "Book directly",
    body: "Check availability or request a sample box. Our team follows up — no middleman markup.",
  },
];

export default async function Home() {
  const [cuisines, eventTypes] = await Promise.all([getCuisines(), getEventTypes()]);

  return (
    <main className="flex flex-col">
      <section className="relative overflow-hidden bg-charcoal-900 px-4 py-24 text-center sm:py-32">
        <Image
          src="https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=1600&q=75&auto=format&fit=crop"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900 via-charcoal-900/80 to-charcoal-900/40" />
        <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-6">
          <FadeIn>
            <h1 className="font-serif text-5xl font-semibold text-cream-50 sm:text-6xl">Rajani</h1>
          </FadeIn>
          <FadeIn delay={0.08}>
            <p className="text-lg text-cream-50/80">
              Find a Hyderabad caterer for your wedding, birthday, or event — with real prices, upfront.
            </p>
          </FadeIn>
          <FadeIn delay={0.16}>
            <Link
              href="/discover"
              className="flex h-12 cursor-pointer items-center rounded-lg bg-gold-500 px-8 text-base font-medium text-charcoal-900 transition hover:bg-gold-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream-50"
            >
              Browse caterers
            </Link>
          </FadeIn>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-8 px-4 py-16 sm:grid-cols-3">
        {FEATURES.map((f, i) => (
          <FadeIn key={f.title} delay={i * 0.06}>
            <div className="flex flex-col gap-2">
              <h2 className="font-serif text-lg font-semibold text-charcoal-900">{f.title}</h2>
              <p className="text-sm text-ink-muted">{f.body}</p>
            </div>
          </FadeIn>
        ))}
      </section>

      <section className="mx-auto w-full max-w-2xl px-4 pb-16">
        <MatchMeForm cuisines={cuisines} eventTypes={eventTypes} />
      </section>
    </main>
  );
}
