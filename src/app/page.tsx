import Link from "next/link";
import Image from "next/image";
import { FadeIn } from "@/components/motion/FadeIn";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { MatchMeForm } from "@/components/MatchMeForm";
import { WorryCard } from "@/components/WorryCard";
import { getCuisines, getEventTypes } from "@/lib/queries/lookups";
import { getHomeContent } from "@/lib/queries/settings";
import { PresentationIcon, PriceTagIcon, TasteIcon } from "@/components/icons/ValuePropIcons";

// Icons are positional (not admin-editable text) - zipped with content.worries[i] by index.
const WORRY_ICONS = [<TasteIcon key="taste" className="h-7 w-7" />, <PresentationIcon key="presentation" className="h-7 w-7" />, <PriceTagIcon key="price" className="h-7 w-7" />];

export default async function Home() {
  const [cuisines, eventTypes, content] = await Promise.all([getCuisines(), getEventTypes(), getHomeContent()]);

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
            <h1 className="text-5xl font-semibold tracking-tight text-cream-50 sm:text-6xl">{content.brandName}</h1>
          </FadeIn>
          <FadeIn delay={0.08}>
            <p className="text-lg text-cream-50/80">{content.heroSubtitle}</p>
          </FadeIn>
          <FadeIn delay={0.16}>
            <Link
              href="/discover"
              className="flex h-12 cursor-pointer items-center rounded-lg bg-gold-500 px-8 text-base font-medium text-cream-50 transition-colors duration-200 ease-out hover:bg-gold-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream-50"
            >
              {content.heroCtaLabel}
            </Link>
          </FadeIn>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 py-20 sm:py-28">
        <ScrollReveal>
          <h2 className="text-balance text-center text-3xl font-semibold tracking-tight text-charcoal-900 sm:text-4xl">
            {content.worriesHeading}
          </h2>
        </ScrollReveal>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {content.worries.map((w, i) => (
            <ScrollReveal key={w.title} delay={i * 0.08}>
              <WorryCard title={w.title} body={w.body} icon={WORRY_ICONS[i]} />
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
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-cream-50 sm:text-4xl">{content.section2Heading}</h2>
          <p className="text-base text-cream-50/85 sm:text-lg">{content.section2Body}</p>
          <p className="text-xs text-cream-50/60">{content.section2Tc}</p>
          <Link
            href="/discover"
            className="mt-2 flex h-12 cursor-pointer items-center rounded-lg bg-gold-500 px-8 text-base font-medium text-cream-50 transition-colors duration-200 ease-out hover:bg-gold-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream-50"
          >
            {content.section2CtaLabel}
          </Link>
        </ScrollReveal>
      </section>

      <section className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-8 px-4 py-16 sm:grid-cols-3">
        {content.features.map((f, i) => (
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
