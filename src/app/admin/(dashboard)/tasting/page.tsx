import { listTastingRequests } from "@/lib/admin/queries";
import { updateTastingStatus } from "@/lib/admin/actions";

const TASTING_STATUSES = ["new", "contacted", "completed", "cancelled"] as const;

const inputClass =
  "h-9 rounded-lg border border-border bg-surface px-2 text-sm text-ink focus:border-royal-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-royal-100";
const secondaryButtonClass =
  "h-9 cursor-pointer rounded-lg border border-border px-3 text-xs font-medium text-ink transition hover:border-gold-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600";

export default async function AdminTastingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const requests = await listTastingRequests(status);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-royal-700">Tasting requests</h1>

      <form method="get" className="flex items-end gap-3">
        <label className="flex flex-col gap-1 text-sm text-ink-muted">
          Status
          <select name="status" defaultValue={status ?? ""} className={inputClass}>
            <option value="">All</option>
            {TASTING_STATUSES.map((s) => (
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
        <p className="text-sm text-ink-muted">No tasting requests yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-ink-muted">
                <th className="px-4 py-3 font-medium">Vendor</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Requested</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {requests.map((request) => (
                <tr key={request.id}>
                  <td className="px-4 py-3 text-ink">{request.vendors?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-muted">{request.user_name ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-muted">{request.user_phone}</td>
                  <td className="px-4 py-3 text-ink-muted">{new Date(request.created_at).toLocaleDateString("en-IN")}</td>
                  <td className="px-4 py-3">
                    <form action={updateTastingStatus.bind(null, request.id)} className="flex items-center gap-2">
                      <select name="status" defaultValue={request.status} className={inputClass}>
                        {TASTING_STATUSES.map((s) => (
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
