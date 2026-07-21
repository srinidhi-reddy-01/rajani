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
      <span className="font-medium text-neutral-700">Plates</span>
      <input
        type="number"
        min={1}
        value={plates}
        onChange={(e) => {
          const next = Number(e.target.value);
          onChange(Number.isFinite(next) && next > 0 ? next : 1);
        }}
        className="w-28 rounded-md border border-neutral-300 px-3 py-1.5 text-sm focus:border-neutral-500 focus:outline-none"
      />
    </label>
  );
}
