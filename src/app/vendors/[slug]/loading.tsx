export default function VendorProfileLoading() {
  return (
    <main className="pb-28">
      <div className="h-64 w-full animate-pulse bg-charcoal-700 sm:h-80" />
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-6 sm:px-6">
        <div className="h-4 w-full animate-pulse rounded bg-border" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-border" />
        <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2">
          {Array.from({ length: 2 }, (_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-border bg-surface" />
          ))}
        </div>
      </div>
    </main>
  );
}
