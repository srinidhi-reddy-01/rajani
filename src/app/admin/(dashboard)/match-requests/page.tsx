import { listMatchRequests } from "@/lib/admin/queries";
import { updateMatchRequestStatus } from "@/lib/admin/actions";
import { formatInr } from "@/lib/pricing";

const MATCH_STATUSES = ["new", "contacted", "closed"] as const;

const inputClass =
  "h-9 rounded-lg border border-border bg-surface px-2 text-sm text-ink focus:border-royal-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-royal-100";
const secondaryButtonClass =
  "h-9 cursor-pointer rounded-lg border border-border px-3 text-xs font-medium text-ink transition-colors duration-200 ease-out hover:border-royal-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600";

export default async function AdminMatchRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const requests = await listMatchRequests(status);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Match requests</h1>
      <p className="text-sm text-ink-muted">
        Submitted by users who didn&apos;t want to browse themselves — match them with caterers manually.
      </p>

      <form method="get" className="flex items-end gap-3">
        <label className="flex flex-col gap-1 text-sm text-ink-muted">
          Status
          <select name="status" defaultValue={status ?? ""} className={inputClass}>
            <option value="">All</option>
            {MATCH_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className={secondaryButtonClass}>
          Filter
        </button>
      </form>

      {requests.length === 0 ? (
        <p className="text-sm text-ink-muted">No match requests yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-border bg-surface shadow-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-ink-muted">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Event</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Plates</th>
                <th className="px-4 py-3 font-medium">Budget</th>
                <th className="px-4 py-3 font-medium">Cuisines</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {requests.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 text-ink">{r.user_name ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-muted">{r.user_phone}</td>
                  <td className="px-4 py-3 text-ink-muted">{r.event_type ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-muted">{r.event_date ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-muted">{r.plates ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-muted">{r.budget_pp ? formatInr(r.budget_pp) : "—"}</td>
                  <td className="px-4 py-3 text-ink-muted">{r.cuisines.length > 0 ? r.cuisines.join(", ") : "—"}</td>
                  <td className="px-4 py-3">
                    <form action={updateMatchRequestStatus.bind(null, r.id)} className="flex items-center gap-2">
                      <select name="status" defaultValue={r.status} className={inputClass}>
                        {MATCH_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <button type="submit" className={secondaryButtonClass}>
                        Save
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
