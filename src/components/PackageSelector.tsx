"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import type { SlotOption, SlotWithItems } from "@/lib/queries/vendors";

export type SlotSelection = Record<string, string[]>; // slotId -> selected item ids

// Locked slots (e.g. "Common Items") are always fully included and never rendered as a
// choice, so they never get an entry in SlotSelection at all - see PackageSelector below.
function initialSelection(slots: SlotWithItems[]): SlotSelection {
  const initial: SlotSelection = {};
  for (const slot of slots) {
    if (slot.isLocked) continue;
    initial[slot.id] = slot.options.filter((o) => o.isDefault).slice(0, slot.selectionsCount).map((o) => o.itemId);
  }
  return initial;
}

export function isSelectionComplete(slots: SlotWithItems[], selection: SlotSelection): boolean {
  return slots.every((slot) => slot.isLocked || (selection[slot.id]?.length ?? 0) === slot.selectionsCount);
}

// Partitions a slot's options by group_label, preserving first-seen order - a slot with
// no group labels at all (the common case) collapses to a single unlabeled group, so
// rendering stays a single flat grid exactly as before.
function groupOptions(options: SlotOption[]): { label: string | null; options: SlotOption[] }[] {
  const groups: { label: string | null; options: SlotOption[] }[] = [];
  const indexByLabel = new Map<string | null, number>();
  for (const option of options) {
    let idx = indexByLabel.get(option.groupLabel);
    if (idx === undefined) {
      idx = groups.length;
      indexByLabel.set(option.groupLabel, idx);
      groups.push({ label: option.groupLabel, options: [] });
    }
    groups[idx].options.push(option);
  }
  return groups;
}

function ItemImage({ option }: { option: SlotOption }) {
  return (
    <div className="relative h-20 w-full overflow-hidden">
      {option.imageUrl ? (
        <Image
          src={option.imageUrl}
          alt=""
          fill
          sizes="150px"
          className="object-cover transition-transform duration-200 ease-out group-hover:scale-110"
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center bg-gradient-to-br from-royal-600 to-royal-800 text-lg font-semibold text-cream-50"
          aria-hidden
        >
          {option.name.trim().charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}

function VegDot({ isVeg }: { isVeg: boolean }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-sm border ${
        isVeg ? "border-green-600 bg-green-500" : "border-red-600 bg-red-500"
      }`}
      aria-label={isVeg ? "Veg" : "Non-veg"}
    />
  );
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

  // Users should never need to manually unselect before picking something else:
  // a pick-1 slot behaves like a radio button (clicking a new item replaces the
  // current one), and a pick-N slot at capacity auto-drops the oldest selection
  // (FIFO) to make room for the new one.
  function toggle(slotId: string, itemId: string, max: number) {
    setSelection((prev) => {
      const current = prev[slotId] ?? [];
      if (current.includes(itemId)) {
        if (max === 1) return prev; // radio: clicking the already-selected item is a no-op
        return { ...prev, [slotId]: current.filter((id) => id !== itemId) };
      }
      if (max === 1) {
        return { ...prev, [slotId]: [itemId] };
      }
      if (current.length >= max) {
        return { ...prev, [slotId]: [...current.slice(1), itemId] };
      }
      return { ...prev, [slotId]: [...current, itemId] };
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {slots.map((slot) => {
        const picked = selection[slot.id] ?? [];
        const groups = groupOptions(slot.options);
        return (
          <div key={slot.id} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-ink">{slot.categoryName}</h4>
              {slot.isLocked ? (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Included</span>
              ) : (
                <span
                  className={`text-xs font-medium ${
                    picked.length === slot.selectionsCount ? "text-green-600" : "text-ink-muted"
                  }`}
                >
                  Pick {slot.selectionsCount} · {picked.length} selected
                </span>
              )}
            </div>
            {groups.map((group) => (
              <div key={group.label ?? "__ungrouped__"} className="flex flex-col gap-2">
                {group.label && <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{group.label}</p>}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {group.options.map((option) =>
                    slot.isLocked ? (
                      <div
                        key={option.itemId}
                        className="flex min-h-11 flex-col overflow-hidden rounded-2xl border border-border bg-surface text-left"
                      >
                        <ItemImage option={option} />
                        <div className="flex items-center gap-2 px-3 py-2">
                          <VegDot isVeg={option.isVeg} />
                          <span className="text-sm text-ink">{option.name}</span>
                        </div>
                      </div>
                    ) : (
                      <motion.button
                        key={option.itemId}
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        aria-pressed={picked.includes(option.itemId)}
                        onClick={() => toggle(slot.id, option.itemId, slot.selectionsCount)}
                        className={`group flex min-h-11 cursor-pointer flex-col overflow-hidden rounded-2xl border text-left transition-colors duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600 ${
                          picked.includes(option.itemId)
                            ? "border-royal-600 bg-royal-50 ring-2 ring-royal-100"
                            : "border-border bg-surface hover:border-royal-600"
                        }`}
                      >
                        <ItemImage option={option} />
                        <div className="flex items-center gap-2 px-3 py-2">
                          <VegDot isVeg={option.isVeg} />
                          <span className="text-sm text-ink">{option.name}</span>
                          {picked.includes(option.itemId) && <span className="ml-auto text-royal-700">✓</span>}
                        </div>
                      </motion.button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
