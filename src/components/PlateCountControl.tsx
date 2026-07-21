"use client";

export function PlateCountControl({
  plates,
  onChange,
}: {
  plates: number;
  onChange: (plates: number) => void;
}) {
  return (
    <label className="flex items-center gap-3 text-sm">
      <span className="font-medium text-ink-muted">Plates</span>
      <input
        type="number"
        min={1}
        value={plates}
        onChange={(e) => {
          const next = Number(e.target.value);
          onChange(Number.isFinite(next) && next > 0 ? next : 1);
        }}
        className="h-11 w-28 rounded-lg border border-border bg-surface px-3 text-sm text-ink transition focus:border-royal-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-royal-100"
      />
    </label>
  );
}
