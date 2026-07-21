"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { Cuisine, EventType } from "@/lib/types/database";
import { formatInr } from "@/lib/pricing";

const PLATE_PRESETS = [100, 300, 500, 700, 1000];
const TOTAL_STEPS = 5;

const chipBase =
  "flex h-12 cursor-pointer items-center rounded-full border px-5 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600";
const chipInactive = "border-border bg-surface text-ink hover:border-gold-500";
const chipActive = "border-royal-600 bg-royal-700 text-cream-50";

const inputClass =
  "h-14 w-full rounded-lg border border-border bg-surface px-4 text-base text-ink focus:border-royal-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-royal-100";
const primaryButtonClass =
  "h-12 cursor-pointer rounded-lg bg-royal-700 px-6 text-sm font-medium text-cream-50 transition hover:bg-royal-800 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600";
const secondaryButtonClass =
  "h-12 cursor-pointer rounded-lg border border-border px-6 text-sm font-medium text-ink transition hover:border-gold-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600";

const stepVariants = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 32 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: -direction * 32 }),
};

export function GuidedFlow({ cuisines, eventTypes }: { cuisines: Cuisine[]; eventTypes: EventType[] }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
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

  function goTo(next: number) {
    setDirection(next > step ? 1 : -1);
    setStep(next);
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

  const summaryChips = [
    plates && { label: `${plates} plates` },
    selectedCuisines.length > 0 && { label: selectedCuisines.join(", ") },
    budgetPp && { label: `${formatInr(Number(budgetPp))}/plate` },
    eventDate && { label: eventDate },
    eventType && { label: eventType },
  ].filter((c): c is { label: string } => Boolean(c));

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8 rounded-2xl border border-border bg-surface p-6 shadow-card sm:p-8">
      <div className="flex items-center gap-2" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={TOTAL_STEPS}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
          <motion.div
            key={s}
            className="h-1.5 flex-1 rounded-full bg-border"
            animate={{ backgroundColor: s <= step ? "var(--color-gold-500)" : "var(--color-border)" }}
            transition={{ duration: 0.25 }}
          />
        ))}
      </div>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
        Step {step} of {TOTAL_STEPS}
      </p>

      <div className="relative min-h-52 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="flex flex-col gap-4"
          >
            {step === 1 && (
              <>
                <h2 className="font-serif text-2xl font-semibold text-royal-700">How many plates?</h2>
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
                  type="range"
                  min={50}
                  max={1500}
                  step={10}
                  value={typeof plates === "number" ? plates : 500}
                  onChange={(e) => setPlates(Number(e.target.value))}
                  className="h-2 w-full cursor-pointer accent-royal-700"
                />
                <input
                  type="number"
                  min={1}
                  placeholder="Or enter an exact number"
                  value={plates}
                  onChange={(e) => setPlates(e.target.value ? Number(e.target.value) : "")}
                  className={inputClass}
                />
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="font-serif text-2xl font-semibold text-royal-700">Preferred cuisine</h2>
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
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="font-serif text-2xl font-semibold text-royal-700">Budget per plate</h2>
                <input
                  type="range"
                  min={100}
                  max={2000}
                  step={10}
                  value={typeof budgetPp === "number" ? budgetPp : 600}
                  onChange={(e) => setBudgetPp(Number(e.target.value))}
                  className="h-2 w-full cursor-pointer accent-royal-700"
                />
                <input
                  type="number"
                  min={1}
                  placeholder="₹ per plate"
                  value={budgetPp}
                  onChange={(e) => setBudgetPp(e.target.value ? Number(e.target.value) : "")}
                  className={inputClass}
                />
              </>
            )}

            {step === 4 && (
              <>
                <h2 className="font-serif text-2xl font-semibold text-royal-700">Event date</h2>
                <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className={inputClass} />
              </>
            )}

            {step === 5 && (
              <>
                <h2 className="font-serif text-2xl font-semibold text-royal-700">Event type</h2>
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
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {summaryChips.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-border pt-4 text-xs text-ink-muted">
          {summaryChips.map((c) => (
            <span key={c.label} className="rounded-full bg-royal-100 px-3 py-1 text-royal-700">
              {c.label}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        {step > 1 ? (
          <button type="button" onClick={() => goTo(step - 1)} className={secondaryButtonClass}>
            Back
          </button>
        ) : (
          <span />
        )}
        {step < TOTAL_STEPS ? (
          <button type="button" disabled={!canProceed} onClick={() => goTo(step + 1)} className={primaryButtonClass}>
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
