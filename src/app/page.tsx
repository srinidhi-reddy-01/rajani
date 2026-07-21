import Link from "next/link";

const FEATURES = [
  {
    title: "Tell us your event",
    body: "Plates, cuisine, budget, date, and event type — five quick questions, no login.",
  },
  {
    title: "See matched caterers",
    body: "Real packages and prices from Hyderabad caterers, ranked to your budget.",
  },
  {
    title: "Book directly",
    body: "Enquire or request a sample box. Our team follows up — no middleman markup.",
  },
];

export default function Home() {
  return (
    <main className="flex flex-col">
      <section className="border-b border-border bg-royal-700 px-6 py-20 text-center text-white">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-6">
          <h1 className="text-4xl font-semibold sm:text-5xl">Rajani</h1>
          <p className="text-lg text-royal-100">
            Find a Hyderabad caterer for your wedding, birthday, or event — with real prices, upfront.
          </p>
          <Link
            href="/find"
            className="h-12 cursor-pointer rounded-lg bg-gold-500 px-8 text-base font-medium text-royal-800 transition hover:bg-gold-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white flex items-center"
          >
            Find your caterer
          </Link>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-8 px-6 py-16 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-royal-700">{f.title}</h2>
            <p className="text-sm text-ink-muted">{f.body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
