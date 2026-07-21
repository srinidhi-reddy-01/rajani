"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Cuisine, EventType } from "@/lib/types/database";

const PLATE_PRESETS = [100, 300, 500, 700, 1000];
const TOTAL_STEPS = 5;

const chipBase =
  "cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600";
const chipInactive = "border-border bg-surface text-ink hover:border-gold-500";
const chipActive = "border-royal-600 bg-royal-700 text-white";

const inputClass =
  "h-12 w-full rounded-lg border border-border bg-surface px-4 text-base text-ink focus:border-royal-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-royal-100";
const primaryButtonClass =
  "h-12 cursor-pointer rounded-lg bg-royal-700 px-6 text-sm font-medium text-white transition hover:bg-royal-800 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600";
const secondaryButtonClass =
  "h-12 cursor-pointer rounded-lg border border-border px-6 text-sm font-medium text-ink transition hover:border-gold-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600";

export function GuidedFlow({ cuisines, eventTypes }: { cuisines: Cuisine[]; eventTypes: EventType[] }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [plates, setPlates] = useState<number | "">("");
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [budgetPp, setBudgetPp] = useState<number | "">("");
  const [eventDate, setEventDate] = useState("");
  const [eventType, setEventType] = useState("");

  const canProceed =
    (step === 1 && typeof plates === "number" && plates > 0) ||
    (step === 2 && selectedCuisines.length > 0) ||
    (step === 3 && typeof budgetPp === "number" && budgetPp > 0) ||
    (step === 4 && eventDate.length > 0) ||
    (step === 5 && eventType.length > 0);

  function toggleCuisine(name: string) {
    setSelectedCuisines((prev) => (prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]));
  }

  function submit() {
    const params = new URLSearchParams({
      plates: String(plates),
      cuisines: selectedCuisines.join(","),
      budget: String(budgetPp),
      date: eventDate,
      eventType,
    });
    router.push(`/discover?${params.toString()}`);
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8 rounded-2xl border border-border bg-surface p-6 shadow-card sm:p-8">
      <div className="flex items-center gap-2" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={TOTAL_STEPS}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? "bg-gold-500" : "bg-border"}`} />
        ))}
      </div>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
        Step {step} of {TOTAL_STEPS}
      </p>

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-royal-700">How many plates?</h2>
          <div className="flex flex-wrap gap-2">
            {PLATE_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPlates(p)}
                className={`${chipBase} ${plates === p ? chipActive : chipInactive}`}
              >
                {p}
              </button>
            ))}
          </div>
          <input
            type="number"
            min={1}
            placeholder="Or enter an exact number"
            value={plates}
            onChange={(e) => setPlates(e.target.value ? Number(e.target.value) : "")}
            className={inputClass}
          />
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-royal-700">Preferred cuisine</h2>
          <div className="flex flex-wrap gap-2">
            {cuisines.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleCuisine(c.name)}
                aria-pressed={selectedCuisines.includes(c.name)}
                className={`${chipBase} ${selectedCuisines.includes(c.name) ? chipActive : chipInactive}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-royal-700">Budget per plate</h2>
          <input
            type="number"
            min={1}
            placeholder="₹ per plate"
            value={budgetPp}
            onChange={(e) => setBudgetPp(e.target.value ? Number(e.target.value) : "")}
            className={inputClass}
          />
        </div>
      )}

      {step === 4 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-royal-700">Event date</h2>
          <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className={inputClass} />
        </div>
      )}

      {step === 5 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-royal-700">Event type</h2>
          <div className="flex flex-wrap gap-2">
            {eventTypes.map((et) => (
              <button
                key={et.id}
                type="button"
                onClick={() => setEventType(et.name)}
                aria-pressed={eventType === et.name}
                className={`${chipBase} ${eventType === et.name ? chipActive : chipInactive}`}
              >
                {et.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {step > 1 && (
        <div className="flex flex-wrap gap-2 border-t border-border pt-4 text-xs text-ink-muted">
          {plates && <span className="rounded-full bg-royal-100 px-3 py-1 text-royal-700">{plates} plates</span>}
          {selectedCuisines.length > 0 && (
            <span className="rounded-full bg-royal-100 px-3 py-1 text-royal-700">{selectedCuisines.join(", ")}</span>
          )}
          {budgetPp && step > 3 && <span className="rounded-full bg-royal-100 px-3 py-1 text-royal-700">₹{budgetPp}/plate</span>}
          {eventDate && step > 4 && <span className="rounded-full bg-royal-100 px-3 py-1 text-royal-700">{eventDate}</span>}
        </div>
      )}

      <div className="flex items-center justify-between">
        {step > 1 ? (
          <button type="button" onClick={() => setStep((s) => s - 1)} className={secondaryButtonClass}>
            Back
          </button>
        ) : (
          <span />
        )}
        {step < TOTAL_STEPS ? (
          <button type="button" disabled={!canProceed} onClick={() => setStep((s) => s + 1)} className={primaryButtonClass}>
            Next
          </button>
        ) : (
          <button type="button" disabled={!canProceed} onClick={submit} className={primaryButtonClass}>
            See matched caterers
          </button>
        )}
      </div>
    </div>
  );
}
