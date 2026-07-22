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
        <div className="flex flex-col gap-4">
          {enquiries.map((enquiry) => {
            const sel = enquiry.menu_selection;
            return (
              <div key={enquiry.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 shadow-card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-medium text-ink">{enquiry.vendors?.name ?? "—"}</h2>
                    <p className="text-sm text-ink-muted">{enquiry.user_phone}</p>
                  </div>
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
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
                  <p><span className="text-ink-muted">Event:</span> {enquiry.event_type}</p>
                  <p><span className="text-ink-muted">Date:</span> {enquiry.event_date}</p>
                  <p><span className="text-ink-muted">Plates:</span> {enquiry.plates}</p>
                  <p><span className="text-ink-muted">Budget:</span> {enquiry.budget_pp ? formatInr(enquiry.budget_pp) : "—"}</p>
                  <p><span className="text-ink-muted">Cuisine:</span> {(sel.cuisines ?? []).length > 0 ? sel.cuisines.join(", ") : "—"}</p>
                  <p><span className="text-ink-muted">Package:</span> {sel.package_name ?? "—"}</p>
                  <p className="font-medium text-gold-600"><span className="font-normal text-ink-muted">Quoted:</span> {formatInr(enquiry.quoted_pp)}</p>
                </div>

                {(sel.selection ?? []).length > 0 && (
                  <div className="flex flex-col gap-1 rounded-lg border border-border bg-ivory p-3 text-sm">
                    <p className="font-medium text-ink">Chosen items</p>
                    {sel.selection.map((s) => (
                      <p key={s.category_id} className="text-ink-muted">
                        <span className="text-ink">{s.category_name}:</span> {s.selected_item_names.join(", ") || "none picked"}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
