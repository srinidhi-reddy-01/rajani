import Link from "next/link";
import Image from "next/image";
import { FadeIn } from "@/components/motion/FadeIn";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { MatchMeForm } from "@/components/MatchMeForm";
import { WorryCard } from "@/components/WorryCard";
import { getCuisines, getEventTypes } from "@/lib/queries/lookups";
import { PresentationIcon, PriceTagIcon, TasteIcon } from "@/components/icons/ValuePropIcons";
import { DISCOUNT_PERCENT } from "@/lib/pricing";

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

const WORRIES = [
  {
    title: "Taste",
    icon: <TasteIcon className="h-7 w-7" />,
    body: "Don't book blind. Order a sample tasting box from any caterer and taste the actual menu before you decide.",
  },
  {
    title: "Presentation",
    icon: <PresentationIcon className="h-7 w-7" />,
    body: "See real photos from real events — plating, buffet counters and live stations from each caterer's recent functions.",
  },
  {
    title: "Trust in price",
    icon: <PriceTagIcon className="h-7 w-7" />,
    body: "Transparent per-plate prices, upfront. Quotes adjust instantly to your plate count — no phone calls, no haggling, no surprises.",
  },
] as const;

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
            <h1 className="text-5xl font-semibold tracking-tight text-cream-50 sm:text-6xl">Āgata</h1>
          </FadeIn>
          <FadeIn delay={0.08}>
            <p className="text-lg text-cream-50/80">
              Find a Hyderabad caterer for your wedding, birthday, or event — with real prices, upfront.
            </p>
          </FadeIn>
          <FadeIn delay={0.16}>
            <Link
              href="/discover"
              className="flex h-12 cursor-pointer items-center rounded-lg bg-gold-500 px-8 text-base font-medium text-cream-50 transition-colors duration-200 ease-out hover:bg-gold-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream-50"
            >
              Browse caterers
            </Link>
          </FadeIn>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 py-20 sm:py-28">
        <ScrollReveal>
          <h2 className="text-balance text-center text-3xl font-semibold tracking-tight text-charcoal-900 sm:text-4xl">
            Every host worries about three things
          </h2>
        </ScrollReveal>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {WORRIES.map((w, i) => (
            <ScrollReveal key={w.title} delay={i * 0.08}>
              <WorryCard title={w.title} body={w.body} icon={w.icon} />
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden px-4 py-20 text-center sm:py-28">
        <Image
          src="https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=1600&q=75&auto=format&fit=crop"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900 via-charcoal-900/85 to-charcoal-900/55" />
        <ScrollReveal className="relative mx-auto flex max-w-xl flex-col items-center gap-4">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-cream-50 sm:text-4xl">
            You enjoy the event. We&apos;ll handle the food.
          </h2>
          <p className="text-base text-cream-50/85 sm:text-lg">
            Spend the day with your loved ones, not chasing the caterer. Every Āgata booking comes with a
            dedicated event manager for the day — and {Math.round(DISCOUNT_PERCENT * 100)}% off your booking value.
          </p>
          <p className="text-xs text-cream-50/60">T&amp;C apply.</p>
          <Link
            href="/discover"
            className="mt-2 flex h-12 cursor-pointer items-center rounded-lg bg-gold-500 px-8 text-base font-medium text-cream-50 transition-colors duration-200 ease-out hover:bg-gold-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream-50"
          >
            Find your caterer
          </Link>
        </ScrollReveal>
      </section>

      <section className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-8 px-4 py-16 sm:grid-cols-3">
        {FEATURES.map((f, i) => (
          <FadeIn key={f.title} delay={i * 0.06}>
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold tracking-tight text-charcoal-900">{f.title}</h2>
              <p className="text-sm text-ink-muted">{f.body}</p>
            </div>
          </FadeIn>
        ))}
      </section>

      <section className="mx-auto w-full max-w-2xl px-4 pb-20 pt-4">
        <MatchMeForm cuisines={cuisines} eventTypes={eventTypes} />
      </section>
    </main>
  );
}
