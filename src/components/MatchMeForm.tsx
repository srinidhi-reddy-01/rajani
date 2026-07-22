"use client";

import { useActionState, useState } from "react";
import type { Cuisine, EventType } from "@/lib/types/database";
import { submitMatchRequest } from "@/lib/consumer/actions";
import type { CtaState } from "@/lib/consumer/actions";

const chipBase =
  "flex h-10 cursor-pointer items-center rounded-full border px-4 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600";
const chipInactive = "border-border bg-surface text-ink hover:border-gold-500";
const chipActive = "border-royal-600 bg-royal-700 text-cream-50";
const inputClass =
  "h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-ink focus:border-royal-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-royal-100";
const primaryButtonClass =
  "h-12 cursor-pointer rounded-lg bg-royal-700 px-6 text-sm font-medium text-cream-50 transition hover:bg-royal-800 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600";

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function MatchMeForm({ cuisines, eventTypes }: { cuisines: Cuisine[]; eventTypes: EventType[] }) {
  const [state, formAction, pending] = useActionState<CtaState, FormData>(submitMatchRequest, { status: "idle" });
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [eventType, setEventType] = useState("");

  function toggleCuisine(name: string) {
    setSelectedCuisines((prev) => (prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]));
  }

  if (state.status === "success") {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 text-center shadow-card">
        <p className="text-sm text-ink">Thank you, our team will get in touch with you for the next steps.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-card sm:p-8">
      <div>
        <h2 className="font-serif text-xl font-semibold text-royal-700">Too busy to browse?</h2>
        <p className="text-sm text-ink-muted">Tell us what you need — our team will match you with the right caterers.</p>
      </div>
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="cuisines" value={selectedCuisines.join(",")} />
        <input type="hidden" name="event_type" value={eventType} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm text-ink-muted">
            Phone number
            <input
              type="tel"
              name="phone"
              inputMode="numeric"
              placeholder="10-digit mobile number"
              required
              pattern="[6-9][0-9]{9}"
              title="Enter a valid 10-digit Indian mobile number"
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-ink-muted">
            Name (optional)
            <input type="text" name="name" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm text-ink-muted">
            Plates (optional)
            <input type="number" name="plates" min={1} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm text-ink-muted">
            Budget per plate (optional)
            <input type="number" name="budget_pp" min={1} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm text-ink-muted">
            Event date (optional)
            <input type="date" name="event_date" min={todayIso()} className={inputClass} />
          </label>
        </div>

        {eventTypes.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-sm text-ink-muted">Event type (optional)</span>
            <div className="flex flex-wrap gap-2">
              {eventTypes.map((et) => (
                <button
                  key={et.id}
                  type="button"
                  onClick={() => setEventType((prev) => (prev === et.name ? "" : et.name))}
                  aria-pressed={eventType === et.name}
                  className={`${chipBase} ${eventType === et.name ? chipActive : chipInactive}`}
                >
                  {et.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {cuisines.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-sm text-ink-muted">Preferred cuisine (optional)</span>
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

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button type="submit" disabled={pending} className={`${primaryButtonClass} w-fit`}>
          {pending ? "Submitting..." : "Match me with caterers"}
        </button>
      </form>
    </div>
  );
}
