import Link from "next/link";
import { ALL_VENDOR_STATUSES, listVendorsForPipeline, type VendorPipelineRow } from "@/lib/admin/queries";
import { deleteVendor, setVendorStatus } from "@/lib/admin/actions";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { StatusSelect } from "@/components/StatusSelect";

const PAGE_SIZE = 25;

const STATUS_STYLES: Record<VendorPipelineRow["status"], string> = {
  sourced: "bg-neutral-100 text-neutral-600",
  contacted: "bg-royal-100 text-royal-700",
  onboarding: "bg-royal-100 text-royal-700",
  priced: "bg-gold-100 text-gold-600",
  live: "bg-green-100 text-green-700",
  paused: "bg-neutral-100 text-neutral-500",
};

function buildQuery(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export default async function AdminPipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string; blocked?: string; missing?: string }>;
}) {
  const { status, q, page: pageParam, blocked, missing } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const { vendors, total } = await listVendorsForPipeline({ status, q, page, pageSize: PAGE_SIZE });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const returnTo = `/admin${buildQuery({ status, q, page: pageParam })}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-royal-700">Vendor pipeline</h1>
        <div className="flex items-center gap-3">
          <p className="text-sm text-ink-muted">{total} vendors</p>
          <Link
            href="/admin/vendors/new"
            className="h-9 flex items-center rounded-lg bg-royal-700 px-3 text-xs font-medium text-white transition hover:bg-royal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600"
          >
            + New vendor
          </Link>
        </div>
      </div>

      {blocked && (
        <div className="rounded-xl border border-gold-500 bg-gold-100 px-4 py-3 text-sm text-ink">
          Can&apos;t mark <span className="font-semibold">{blocked}</span> as live — missing {missing}.
        </div>
      )}

      <form method="get" className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm text-ink-muted">
          Status
          <select
            name="status"
            defaultValue={status ?? ""}
            className="h-11 rounded-lg border border-border bg-surface px-3 text-sm text-ink focus:border-royal-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-royal-100"
          >
            <option value="">All</option>
            {ALL_VENDOR_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-ink-muted">
          Search name or area
          <input
            type="text"
            name="q"
            defaultValue={q ?? ""}
            className="h-11 w-64 rounded-lg border border-border bg-surface px-3 text-sm text-ink focus:border-royal-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-royal-100"
          />
        </label>
        <button
          type="submit"
          className="h-11 cursor-pointer rounded-lg bg-royal-700 px-4 text-sm font-medium text-white transition hover:bg-royal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600"
        >
          Filter
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-ink-muted">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Area</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Rating</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {vendors.map((vendor) => (
              <tr key={vendor.id}>
                <td className="px-4 py-3 text-ink">
                  <Link
                    href={`/admin/vendors/${vendor.id}`}
                    className="rounded-sm font-medium hover:text-royal-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600"
                  >
                    {vendor.name}
                  </Link>
                  {vendor.is_demo && (
                    <span className="ml-2 rounded-full bg-gold-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-gold-600">
                      Demo
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-ink-muted">{vendor.area ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[vendor.status]}`}>{vendor.status}</span>
                </td>
                <td className="px-4 py-3 text-ink-muted">
                  {vendor.gbp_rating != null ? (
                    <>
                      <span className="text-gold-500">★</span> {vendor.gbp_rating.toFixed(1)}
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <form action={setVendorStatus.bind(null, vendor.id)} className="flex items-center gap-1.5">
                      <input type="hidden" name="__returnTo" value={returnTo} />
                      <StatusSelect
                        name="status"
                        defaultValue={vendor.status}
                        options={ALL_VENDOR_STATUSES}
                        className="h-9 rounded-lg border border-border bg-surface px-2 text-xs text-ink focus:border-royal-600 focus:outline-none"
                      />
                    </form>
                    <form action={deleteVendor.bind(null, vendor.id, returnTo)}>
                      <ConfirmSubmitButton
                        confirmMessage={`Delete ${vendor.name}? This cannot be undone.`}
                        className="h-9 cursor-pointer rounded-lg border border-red-200 px-2 text-xs font-medium text-red-600 transition hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                      >
                        Delete
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-ink-muted">
        <span>
          Page {page} of {totalPages}
        </span>
        <div className="flex gap-2">
          {page > 1 && (
            <Link
              href={`/admin${buildQuery({ status, q, page: String(page - 1) })}`}
              className="rounded-lg border border-border px-3 py-1.5 hover:border-gold-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600"
            >
              Previous
            </Link>
          )}
          {page < totalPages && (
            <Link
              href={`/admin${buildQuery({ status, q, page: String(page + 1) })}`}
              className="rounded-lg border border-border px-3 py-1.5 hover:border-gold-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600"
            >
              Next
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
