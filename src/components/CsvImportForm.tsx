"use client";

import { useActionState } from "react";
import type { CsvImportState } from "@/lib/admin/actions";

const INITIAL_STATE: CsvImportState = { status: "idle", created: 0, errors: [] };

export function CsvImportForm({
  action,
}: {
  action: (prevState: CsvImportState, formData: FormData) => Promise<CsvImportState>;
}) {
  const [state, formAction, pending] = useActionState<CsvImportState, FormData>(action, INITIAL_STATE);

  return (
    <div className="flex flex-col gap-3">
      <form action={formAction} className="flex items-end gap-2">
        <input type="file" name="file" accept=".csv,text/csv" required className="text-sm text-ink" />
        <button
          type="submit"
          disabled={pending}
          className="h-9 cursor-pointer rounded-lg border border-royal-600 px-3 text-xs font-medium text-royal-700 transition hover:bg-royal-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Importing..." : "Import CSV"}
        </button>
      </form>
      <p className="text-xs text-ink-muted">Columns: category, dish_name, price_pp (price per plate at 500 plates)</p>
      {state.status === "done" && (
        <div className="flex flex-col gap-1 rounded-lg border border-border p-3 text-xs">
          <p className="font-medium text-ink">{state.created} dish{state.created === 1 ? "" : "es"} created.</p>
          {state.errors.length > 0 && (
            <ul className="flex flex-col gap-0.5 text-red-600">
              {state.errors.map((e, i) => (
                <li key={i}>
                  {e.row > 0 ? `Row ${e.row}: ` : ""}
                  {e.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
