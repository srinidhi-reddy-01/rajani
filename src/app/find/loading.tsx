export default function FindLoading() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-8 rounded-2xl border border-border bg-surface p-6 shadow-card sm:p-8">
        <div className="flex gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="h-1.5 flex-1 animate-pulse rounded-full bg-border" />
          ))}
        </div>
        <div className="h-8 w-2/3 animate-pulse rounded bg-border" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-12 w-20 animate-pulse rounded-full bg-border" />
          ))}
        </div>
      </div>
    </main>
  );
}
