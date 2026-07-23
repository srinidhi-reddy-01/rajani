"use client";

import { useEffect, useRef, useState } from "react";

export function MultiSelectDropdown({
  label,
  options,
  selected,
  onChange,
  className = "",
}: {
  label: string;
  options: { id: string | number; name: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function toggle(name: string) {
    onChange(selected.includes(name) ? selected.filter((s) => s !== name) : [...selected, name]);
  }

  const buttonText = selected.length === 0 ? label : selected.length === 1 ? selected[0] : `${label} · ${selected.length} selected`;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex h-11 w-full items-center justify-between gap-2 whitespace-nowrap rounded-lg border px-4 text-sm font-medium transition-colors duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600 ${
          selected.length > 0 ? "border-royal-600 bg-royal-50 text-royal-700" : "border-border bg-surface text-ink hover:border-royal-600"
        }`}
      >
        <span className="truncate">{buttonText}</span>
        <span aria-hidden className={`shrink-0 text-ink-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-multiselectable="true"
          className="absolute left-0 top-[calc(100%+6px)] z-30 w-64 max-w-[80vw] rounded-2xl border border-border bg-surface p-2 shadow-elevated"
        >
          <div className="flex max-h-64 flex-col gap-0.5 overflow-y-auto">
            {options.map((o) => {
              const isSelected = selected.includes(o.name);
              return (
                <label
                  key={o.id}
                  className="flex min-h-10 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink transition-colors duration-200 ease-out hover:bg-ivory"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggle(o.name)}
                    className="h-4 w-4 shrink-0 rounded accent-royal-600"
                  />
                  {o.name}
                </label>
              );
            })}
          </div>
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="mt-1 w-full cursor-pointer rounded-lg px-2.5 py-2 text-left text-xs font-medium text-ink-muted transition-colors duration-200 ease-out hover:bg-ivory hover:text-ink"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
