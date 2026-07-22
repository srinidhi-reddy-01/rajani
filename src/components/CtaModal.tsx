"use client";

import { useActionState, useEffect, useRef } from "react";
import type { CtaState } from "@/lib/consumer/actions";

const inputClass =
  "h-12 w-full rounded-lg border border-border bg-surface px-4 text-base text-ink focus:border-royal-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-royal-100";
const primaryButtonClass =
  "h-12 cursor-pointer rounded-lg bg-royal-700 px-6 text-sm font-medium text-cream-50 transition hover:bg-royal-800 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600";

export function CtaModal({
  open,
  onClose,
  title,
  description,
  action,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  action: (prevState: CtaState, formData: FormData) => Promise<CtaState>;
}) {
  const [state, formAction, pending] = useActionState<CtaState, FormData>(action, { status: "idle" });
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) dialogRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-charcoal-900/50 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-surface p-6 shadow-card-hover"
      >
        {state.status === "success" ? (
          <>
            <h2 className="text-lg font-semibold text-royal-700">Thank you</h2>
            <p className="text-sm text-ink">Thank you, our team will get in touch with you for the next steps.</p>
            <button type="button" onClick={onClose} className={primaryButtonClass}>
              Close
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-royal-700">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-ink-muted hover:bg-royal-100 hover:text-royal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600"
              >
                ×
              </button>
            </div>
            {description && <p className="text-sm text-ink-muted">{description}</p>}
            <form action={formAction} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5 text-sm text-ink-muted">
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
              {state.error && <p className="text-sm text-red-600">{state.error}</p>}
              <button type="submit" disabled={pending} className={primaryButtonClass}>
                {pending ? "Submitting..." : "Submit"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
