"use client";

import { useState } from "react";

export function SpecialitySelector({
  label,
  fieldName,
  newFieldName,
  options,
  selected,
  saveAction,
  addAction,
}: {
  label: string;
  fieldName: string;
  newFieldName: string;
  options: { id: number; name: string }[];
  selected: string[];
  saveAction: (formData: FormData) => Promise<void>;
  addAction: (formData: FormData) => Promise<void>;
}) {
  const [checked, setChecked] = useState<string[]>(selected);

  function toggle(name: string) {
    setChecked((prev) => {
      if (prev.includes(name)) return prev.filter((n) => n !== name);
      if (prev.length >= 2) return prev;
      return [...prev, name];
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-medium text-ink">{label} (max 2)</h3>
      <form action={saveAction} className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {options.map((opt) => {
            const isChecked = checked.includes(opt.name);
            const disabled = !isChecked && checked.length >= 2;
            return (
              <label
                key={opt.id}
                className={`flex h-9 cursor-pointer items-center rounded-full border px-3 text-xs transition ${
                  isChecked ? "border-royal-600 bg-royal-700 text-white" : "border-border bg-surface text-ink hover:border-gold-500"
                } ${disabled ? "cursor-not-allowed opacity-40 hover:border-border" : ""}`}
              >
                <input
                  type="checkbox"
                  name={fieldName}
                  value={opt.name}
                  checked={isChecked}
                  disabled={disabled}
                  onChange={() => toggle(opt.name)}
                  className="sr-only"
                />
                {opt.name}
              </label>
            );
          })}
        </div>
        <button
          type="submit"
          className="h-9 w-fit cursor-pointer rounded-lg border border-royal-600 px-3 text-xs font-medium text-royal-700 transition hover:bg-royal-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600"
        >
          Save
        </button>
      </form>
      <form action={addAction} className="flex items-end gap-2">
        <label className="flex flex-col gap-1 text-xs text-ink-muted">
          Add new
          <input
            type="text"
            name={newFieldName}
            className="h-9 rounded-lg border border-border bg-surface px-2 text-sm text-ink focus:border-royal-600 focus:outline-none"
          />
        </label>
        <button
          type="submit"
          className="h-9 cursor-pointer rounded-lg border border-border px-3 text-xs font-medium text-ink transition hover:border-gold-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600"
        >
          Add
        </button>
      </form>
    </div>
  );
}
