export default function DiscoverLoading() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10">
      <div className="flex items-center justify-between">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-border" />
        <div className="h-5 w-40 animate-pulse rounded-lg bg-border" />
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
            <div className="h-40 w-full animate-pulse bg-border" />
            <div className="flex flex-col gap-3 p-5">
              <div className="h-5 w-3/4 animate-pulse rounded bg-border" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-border" />
              <div className="h-4 w-full animate-pulse rounded bg-border" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
