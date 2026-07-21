"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createVendor } from "@/lib/admin/actions";

const inputClass =
  "h-11 rounded-lg border border-border bg-surface px-3 text-sm text-ink focus:border-royal-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-royal-100";
const primaryButtonClass =
  "h-11 cursor-pointer rounded-lg bg-royal-700 px-4 text-sm font-medium text-white transition hover:bg-royal-800 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600";

export default function NewVendorPage() {
  const [state, formAction, pending] = useActionState(createVendor, { status: "idle" as const });

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin" className="text-sm text-ink-muted hover:text-royal-700">
        ← Back to pipeline
      </Link>
      <h1 className="text-2xl font-semibold text-royal-700">New vendor</h1>
      <form action={formAction} className="flex max-w-md flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-ink-muted">
          Name
          <input type="text" name="name" required autoFocus className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm text-ink-muted">
          Area
          <input type="text" name="area" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm text-ink-muted">
          Phone
          <input type="text" name="phone" className={inputClass} />
        </label>
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? "Creating..." : "Create vendor"}
        </button>
        <p className="text-xs text-ink-muted">
          Starts as &quot;sourced&quot; with the standard menu categories pre-created.
        </p>
      </form>
    </div>
  );
}
