"use client";

import { useActionState, useState } from "react";
import type { Cuisine, EventType } from "@/lib/types/database";
import { submitMatchRequest } from "@/lib/consumer/actions";
import type { CtaState } from "@/lib/consumer/actions";

const inputClass =
  "h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-ink focus:border-royal-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-royal-100";
const selectClass = `${inputClass} appearance-none`;
const primaryButtonClass =
  "h-12 cursor-pointer rounded-lg bg-royal-700 px-6 text-sm font-medium text-cream-50 transition-colors duration-200 ease-out hover:bg-royal-800 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600";

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function MatchMeForm({ cuisines, eventTypes }: { cuisines: Cuisine[]; eventTypes: EventType[] }) {
  const [state, formAction, pending] = useActionState<CtaState, FormData>(submitMatchRequest, { status: "idle" });
  const [cuisine, setCuisine] = useState("");
  const [eventType, setEventType] = useState("");

  if (state.status === "success") {
    return (
      <div className="rounded-3xl border border-gold-500/50 bg-gold-100 p-6 text-center shadow-card sm:p-10">
        <p className="text-sm text-ink">Thank you, our team will get in touch with you for the next steps.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 rounded-3xl border border-gold-500/50 bg-gold-100 p-6 shadow-card sm:p-10">
      <div className="flex flex-col gap-1 text-center sm:text-left">
        <h2 className="text-2xl font-semibold tracking-tight text-royal-800 sm:text-3xl">Too busy to browse?</h2>
        <p className="text-sm text-ink-muted">Tell us what you need — our team will match you with the right caterers.</p>
      </div>
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="cuisines" value={cuisine} />
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
          {eventTypes.length > 0 && (
            <label className="flex flex-col gap-1 text-sm text-ink-muted">
              Event type (optional)
              <select value={eventType} onChange={(e) => setEventType(e.target.value)} className={selectClass}>
                <option value="">Any</option>
                {eventTypes.map((et) => (
                  <option key={et.id} value={et.name}>
                    {et.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {cuisines.length > 0 && (
            <label className="flex flex-col gap-1 text-sm text-ink-muted">
              Preferred cuisine (optional)
              <select value={cuisine} onChange={(e) => setCuisine(e.target.value)} className={selectClass}>
                <option value="">Any</option>
                {cuisines.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button type="submit" disabled={pending} className={`${primaryButtonClass} w-fit`}>
          {pending ? "Submitting..." : "Match me with caterers"}
        </button>
      </form>
    </div>
  );
}
