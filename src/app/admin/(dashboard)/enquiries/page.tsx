import { listEnquiries } from "@/lib/admin/queries";
import { updateEnquiryStatus } from "@/lib/admin/actions";
import { formatInr } from "@/lib/pricing";

const ENQUIRY_STATUSES = ["new", "accepted", "declined", "booked", "expired"] as const;

const inputClass =
  "h-9 rounded-lg border border-border bg-surface px-2 text-sm text-ink focus:border-royal-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-royal-100";
const secondaryButtonClass =
  "h-9 cursor-pointer rounded-lg border border-border px-3 text-xs font-medium text-ink transition hover:border-gold-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600";

export default async function AdminEnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const enquiries = await listEnquiries(status);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-royal-700">Enquiries</h1>

      <form method="get" className="flex items-end gap-3">
        <label className="flex flex-col gap-1 text-sm text-ink-muted">
          Status
          <select name="status" defaultValue={status ?? ""} className={inputClass}>
            <option value="">All</option>
            {ENQUIRY_STATUSES.map((s) => (
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

      {enquiries.length === 0 ? (
        <p className="text-sm text-ink-muted">No enquiries yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-ink-muted">
                <th className="px-4 py-3 font-medium">Vendor</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Event</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Plates</th>
                <th className="px-4 py-3 font-medium">Quoted</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {enquiries.map((enquiry) => (
                <tr key={enquiry.id}>
                  <td className="px-4 py-3 text-ink">{enquiry.vendors?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-muted">{enquiry.user_phone}</td>
                  <td className="px-4 py-3 text-ink-muted">{enquiry.event_type}</td>
                  <td className="px-4 py-3 text-ink-muted">{enquiry.event_date}</td>
                  <td className="px-4 py-3 text-ink-muted">{enquiry.plates}</td>
                  <td className="px-4 py-3 font-medium text-gold-600">{formatInr(enquiry.quoted_pp)}</td>
                  <td className="px-4 py-3">
                    <form action={updateEnquiryStatus.bind(null, enquiry.id)} className="flex items-center gap-2">
                      <select name="status" defaultValue={enquiry.status} className={inputClass}>
                        {ENQUIRY_STATUSES.map((s) => (
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
