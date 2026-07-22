"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import type { SlotWithItems } from "@/lib/queries/vendors";

export type SlotSelection = Record<string, string[]>; // slotId -> selected item ids

function initialSelection(slots: SlotWithItems[]): SlotSelection {
  const initial: SlotSelection = {};
  for (const slot of slots) {
    initial[slot.id] = slot.options.filter((o) => o.isDefault).slice(0, slot.selectionsCount).map((o) => o.itemId);
  }
  return initial;
}

export function isSelectionComplete(slots: SlotWithItems[], selection: SlotSelection): boolean {
  return slots.every((slot) => (selection[slot.id]?.length ?? 0) === slot.selectionsCount);
}

export function PackageSelector({
  slots,
  onChange,
}: {
  slots: SlotWithItems[];
  onChange: (selection: SlotSelection) => void;
}) {
  // The parent remounts this component with a fresh `key` whenever the selected package
  // changes, so the lazy initializer alone is enough to re-seed defaults per package.
  const [selection, setSelection] = useState<SlotSelection>(() => initialSelection(slots));

  useEffect(() => {
    onChange(selection);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection]);

  function toggle(slotId: string, itemId: string, max: number) {
    setSelection((prev) => {
      const current = prev[slotId] ?? [];
      if (current.includes(itemId)) {
        return { ...prev, [slotId]: current.filter((id) => id !== itemId) };
      }
      if (current.length >= max) return prev;
      return { ...prev, [slotId]: [...current, itemId] };
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {slots.map((slot) => {
        const picked = selection[slot.id] ?? [];
        return (
          <div key={slot.id} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-ink">{slot.categoryName}</h4>
              <span
                className={`text-xs font-medium ${
                  picked.length === slot.selectionsCount ? "text-green-600" : "text-ink-muted"
                }`}
              >
                Pick {slot.selectionsCount} · {picked.length} selected
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {slot.options.map((option) => {
                const selected = picked.includes(option.itemId);
                const disabled = !selected && picked.length >= slot.selectionsCount;
                return (
                  <motion.button
                    key={option.itemId}
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    aria-pressed={selected}
                    disabled={disabled}
                    onClick={() => toggle(slot.id, option.itemId, slot.selectionsCount)}
                    className={`flex min-h-11 cursor-pointer flex-col overflow-hidden rounded-xl border text-left transition disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600 ${
                      selected ? "border-royal-600 bg-royal-50 ring-2 ring-royal-100" : "border-border bg-surface hover:border-gold-500"
                    }`}
                  >
                    {option.imageUrl && (
                      <div className="relative h-20 w-full">
                        <Image src={option.imageUrl} alt="" fill sizes="150px" className="object-cover" />
                      </div>
                    )}
                    <div className="flex items-center gap-2 px-3 py-2">
                      <span
                        className={`inline-block h-2.5 w-2.5 shrink-0 rounded-sm border ${
                          option.isVeg ? "border-green-600 bg-green-500" : "border-red-600 bg-red-500"
                        }`}
                        aria-label={option.isVeg ? "Veg" : "Non-veg"}
                      />
                      <span className="text-sm text-ink">{option.name}</span>
                      {selected && <span className="ml-auto text-royal-700">✓</span>}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
