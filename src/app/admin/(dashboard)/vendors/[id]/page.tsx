import Link from "next/link";
import { notFound } from "next/navigation";
import { ALL_VENDOR_STATUSES, computeGoLiveGate, DISH_SUGGESTIONS, getVendorDetail, listCuisines, listEventTypes } from "@/lib/admin/queries";
import {
  addCuisineOption,
  addEventTypeOption,
  addExactDishesToPackage,
  addMenuCategory,
  addMenuItem,
  addPackage,
  addPackageSlot,
  addPackageSlotItem,
  addSuggestedMenuItem,
  deleteMenuCategory,
  deleteMenuItem,
  deletePackage,
  deletePackageSlot,
  deletePackageSlotItem,
  deleteVendor,
  deleteVendorMedia,
  importMenuCsv,
  provisionStandardCategories,
  setDefaultPackage,
  setVendorStatus,
  updateMenuItem,
  updatePackage,
  updateVendorCuisines,
  updateVendorEventTypes,
  updateVendorProfile,
  uploadVendorLogo,
  uploadVendorMedia,
} from "@/lib/admin/actions";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { SpecialitySelector } from "@/components/SpecialitySelector";
import { LogoUploadForm } from "@/components/LogoUploadForm";
import { MediaUploadForm } from "@/components/MediaUploadForm";
import { CsvImportForm } from "@/components/CsvImportForm";

const inputClass =
  "h-11 rounded-lg border border-border bg-surface px-3 text-sm text-ink focus:border-royal-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-royal-100";
const primaryButtonClass =
  "h-11 cursor-pointer rounded-lg bg-royal-700 px-4 text-sm font-medium text-white transition hover:bg-royal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600";
const secondaryButtonClass =
  "h-9 cursor-pointer rounded-lg border border-border px-3 text-xs font-medium text-ink transition hover:border-gold-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600";
const dangerButtonClass =
  "h-9 cursor-pointer rounded-lg border border-red-200 px-3 text-xs font-medium text-red-600 transition hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500";

export default async function AdminVendorEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [vendor, cuisines, eventTypes] = await Promise.all([getVendorDetail(id), listCuisines(), listEventTypes()]);
  if (!vendor) notFound();

  const gate = computeGoLiveGate(vendor);
  const returnTo = `/admin/vendors/${vendor.id}`;
  const allItems = vendor.menu_categories.flatMap((c) => c.menu_items.map((i) => ({ ...i, categoryName: c.name })));

  return (
    <div className="flex flex-col gap-10">
      <div>
        <Link href="/admin" className="text-sm text-ink-muted hover:text-royal-700">
          ← Back to pipeline
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-royal-700">
            {vendor.name}
            {vendor.is_demo && (
              <span className="ml-2 rounded-full bg-gold-100 px-1.5 py-0.5 align-middle text-[10px] font-medium uppercase text-gold-600">
                Demo
              </span>
            )}
          </h1>
          <div className="flex items-center gap-2">
            <form action={setVendorStatus.bind(null, vendor.id)} className="flex items-center gap-1.5">
              <input type="hidden" name="__returnTo" value={returnTo} />
              <select name="status" defaultValue={vendor.status} className={`${inputClass} h-9 w-36 text-xs`}>
                {ALL_VENDOR_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button type="submit" className={secondaryButtonClass}>
                Save
              </button>
            </form>
            <form action={deleteVendor.bind(null, vendor.id, "/admin")}>
              <ConfirmSubmitButton confirmMessage={`Delete ${vendor.name}? This cannot be undone.`} className={dangerButtonClass}>
                Delete vendor
              </ConfirmSubmitButton>
            </form>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
        <h2 className="mb-3 text-lg font-semibold text-royal-700">Go-live checklist</h2>
        <ul className="flex flex-col gap-1.5 text-sm">
          {[{ label: "At least one active package", ok: vendor.packages.some((p) => p.is_active) }].map((check) => (
            <li key={check.label} className="flex items-center gap-2">
              <span className={check.ok ? "text-green-600" : "text-red-500"}>{check.ok ? "✓" : "✕"}</span>
              <span className={check.ok ? "text-ink" : "text-ink-muted"}>{check.label}</span>
            </li>
          ))}
        </ul>
        {!gate.canGoLive && vendor.status !== "live" && (
          <p className="mt-3 text-xs text-ink-muted">Missing before this vendor can go live: {gate.missing.join(", ")}.</p>
        )}
        <p className="mt-2 text-xs text-ink-muted">Everything else (menu, media, description) is optional.</p>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-card">
        <h2 className="text-lg font-semibold text-royal-700">Showcase</h2>
        <LogoUploadForm action={uploadVendorLogo.bind(null, vendor.id)} currentUrl={vendor.logo_url} />
        <MediaUploadForm
          action={uploadVendorMedia.bind(null, vendor.id)}
          deleteAction={deleteVendorMedia.bind(null, vendor.id)}
          media={vendor.vendor_media}
        />
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-card">
        <h2 className="text-lg font-semibold text-royal-700">Profile</h2>
        <form action={updateVendorProfile.bind(null, vendor.id)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm text-ink-muted">
            Name
            <input type="text" name="name" defaultValue={vendor.name} required className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm text-ink-muted">
            Phone
            <input type="text" name="phone" defaultValue={vendor.phone ?? ""} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm text-ink-muted">
            Area
            <input type="text" name="area" defaultValue={vendor.area ?? ""} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm text-ink-muted">
            Established year
            <input type="number" name="established_year" defaultValue={vendor.established_year ?? ""} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm text-ink-muted sm:col-span-2">
            Address
            <input type="text" name="address" defaultValue={vendor.address ?? ""} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm text-ink-muted sm:col-span-2">
            Description
            <textarea name="description" defaultValue={vendor.description ?? ""} rows={3} className={`${inputClass} h-auto py-2`} />
          </label>
          <label className="flex flex-col gap-1 text-sm text-ink-muted">
            Pricing model
            <select name="pricing_model" defaultValue={vendor.pricing_model} className={inputClass}>
              <option value="flexible">flexible</option>
              <option value="final">final</option>
            </select>
          </label>
          <label className="flex items-center gap-2 self-end text-sm text-ink-muted">
            <input type="checkbox" name="serviceable_everywhere" defaultChecked={vendor.serviceable_everywhere} className="h-5 w-5" />
            Serviceable everywhere
          </label>
          <div className="sm:col-span-2">
            <button type="submit" className={primaryButtonClass}>
              Save profile
            </button>
          </div>
        </form>

        <div className="grid grid-cols-1 gap-6 border-t border-border pt-4 sm:grid-cols-2">
          <SpecialitySelector
            label="Cuisine specialities"
            fieldName="cuisines"
            newFieldName="new_cuisine"
            options={cuisines}
            selected={vendor.cuisine_specialities}
            saveAction={updateVendorCuisines.bind(null, vendor.id)}
            addAction={addCuisineOption.bind(null, vendor.id)}
          />
          <SpecialitySelector
            label="Event specialities"
            fieldName="event_types"
            newFieldName="new_event_type"
            options={eventTypes}
            selected={vendor.event_specialities}
            saveAction={updateVendorEventTypes.bind(null, vendor.id)}
            addAction={addEventTypeOption.bind(null, vendor.id)}
          />
        </div>
      </section>

      <section className="flex flex-col gap-6 rounded-2xl border border-border bg-surface p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-royal-700">Menu</h2>
          {vendor.menu_categories.length === 0 && (
            <form action={provisionStandardCategories.bind(null, vendor.id)}>
              <button type="submit" className={secondaryButtonClass}>
                Set up standard categories
              </button>
            </form>
          )}
        </div>
        <p className="-mt-3 text-xs text-ink-muted">All prices below are per plate at 500 plates.</p>

        <div className="border-b border-border pb-6">
          <h3 className="mb-2 text-sm font-medium text-ink">Bulk import (CSV)</h3>
          <CsvImportForm action={importMenuCsv.bind(null, vendor.id)} />
        </div>

        {vendor.menu_categories.map((category) => {
          const suggestions = (DISH_SUGGESTIONS[category.name] ?? []).filter(
            (s) => !category.menu_items.some((i) => i.name === s)
          );
          return (
            <div key={category.id} className="flex flex-col gap-3 border-t border-border pt-4 first:border-t-0 first:pt-0">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-ink">{category.name}</h3>
                <form action={deleteMenuCategory.bind(null, category.id, vendor.id)}>
                  <button type="submit" className={dangerButtonClass}>
                    Delete category (and its items)
                  </button>
                </form>
              </div>

              {category.menu_items.length > 0 && (
                <ul className="flex flex-col gap-2">
                  {category.menu_items.map((item) => (
                    <li key={item.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border px-3 py-2">
                      <span className="min-w-40 text-sm text-ink">
                        {item.name} <span className="text-xs text-ink-muted">({item.is_veg ? "veg" : "non-veg"})</span>
                      </span>
                      <form action={updateMenuItem.bind(null, item.id, vendor.id)} className="flex items-center gap-3">
                        <label className="flex items-center gap-1 text-xs text-ink-muted">
                          ₹
                          <input
                            type="number"
                            step="0.01"
                            name="base_price_pp"
                            defaultValue={item.base_price_pp}
                            className="h-9 w-24 rounded-lg border border-border bg-surface px-2 text-sm"
                          />
                        </label>
                        <label className="flex items-center gap-1 text-xs text-ink-muted">
                          <input type="checkbox" name="is_active" defaultChecked={item.is_active} className="h-5 w-5" />
                          Active
                        </label>
                        <button type="submit" className={secondaryButtonClass}>
                          Save
                        </button>
                      </form>
                      <form action={deleteMenuItem.bind(null, item.id, vendor.id)}>
                        <button type="submit" className={dangerButtonClass}>
                          Delete
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}

              {suggestions.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-ink-muted">Suggestions:</span>
                  {suggestions.map((s) => (
                    <form key={s} action={async () => addSuggestedMenuItem(vendor.id, category.id, s)}>
                      <button
                        type="submit"
                        className="cursor-pointer rounded-full border border-gold-500 px-2.5 py-1 text-xs text-gold-600 transition hover:bg-gold-100"
                      >
                        + {s}
                      </button>
                    </form>
                  ))}
                </div>
              )}

              <form action={addMenuItem.bind(null, vendor.id)} className="flex flex-wrap items-end gap-3">
                <input type="hidden" name="category_id" value={category.id} />
                <label className="flex flex-col gap-1 text-xs text-ink-muted">
                  Name
                  <input type="text" name="name" required className={`${inputClass} h-9 w-40`} />
                </label>
                <label className="flex flex-col gap-1 text-xs text-ink-muted">
                  ₹ / plate
                  <input type="number" step="0.01" name="base_price_pp" required className={`${inputClass} h-9 w-24`} />
                </label>
                <label className="flex items-center gap-1 text-xs text-ink-muted">
                  <input type="checkbox" name="is_veg" defaultChecked className="h-5 w-5" />
                  Veg
                </label>
                <button type="submit" className={secondaryButtonClass}>
                  Add item
                </button>
              </form>
            </div>
          );
        })}

        <form action={addMenuCategory.bind(null, vendor.id)} className="flex items-end gap-3 border-t border-border pt-4">
          <label className="flex flex-col gap-1 text-sm text-ink-muted">
            New category name
            <input type="text" name="name" required className={inputClass} />
          </label>
          <button type="submit" className={secondaryButtonClass}>
            Add category
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-6 rounded-2xl border border-border bg-surface p-5 shadow-card">
        <h2 className="text-lg font-semibold text-royal-700">Packages</h2>
        {vendor.packages.map((pkg) => (
          <div key={pkg.id} className="flex flex-col gap-3 border-t border-border pt-4 first:border-t-0 first:pt-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-ink">{pkg.name}</h3>
                {pkg.is_default && <span className="rounded-full bg-gold-100 px-2 py-0.5 text-xs text-gold-600">Default</span>}
              </div>
              <div className="flex items-center gap-2">
                {!pkg.is_default && (
                  <form action={setDefaultPackage.bind(null, pkg.id, vendor.id)}>
                    <button type="submit" className={secondaryButtonClass}>
                      Set as default
                    </button>
                  </form>
                )}
                <form action={deletePackage.bind(null, pkg.id, vendor.id)}>
                  <button type="submit" className={dangerButtonClass}>
                    Delete package
                  </button>
                </form>
              </div>
            </div>

            <form action={updatePackage.bind(null, pkg.id, vendor.id)} className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1 text-xs text-ink-muted">
                Description
                <input type="text" name="description" defaultValue={pkg.description ?? ""} className={`${inputClass} h-9 w-64`} />
              </label>
              <label className="flex flex-col gap-1 text-xs text-ink-muted">
                ₹ / plate at 500 plates
                <input type="number" step="0.01" name="base_price_pp" defaultValue={pkg.base_price_pp} className={`${inputClass} h-9 w-32`} />
              </label>
              <label className="flex flex-col gap-1 text-xs text-ink-muted">
                Min plates (optional)
                <input type="number" name="min_plates" defaultValue={pkg.min_plates ?? ""} className={`${inputClass} h-9 w-24`} />
              </label>
              <label className="flex items-center gap-1 text-xs text-ink-muted">
                <input type="checkbox" name="is_active" defaultChecked={pkg.is_active} className="h-5 w-5" />
                Active
              </label>
              <button type="submit" className={secondaryButtonClass}>
                Save
              </button>
            </form>

            <div className="flex flex-col gap-3 pl-4">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">By category rule</p>
              {pkg.package_slots.map((slot) => {
                const category = vendor.menu_categories.find((c) => c.id === slot.category_id);
                const slotItems = slot.package_slot_items
                  .map((si) => ({ ...si, item: allItems.find((i) => i.id === si.item_id) }))
                  .filter((si) => si.item);
                const categoryItems = allItems.filter((i) => i.category_id === slot.category_id);
                return (
                  <div key={slot.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-ink">
                        Pick {slot.selections_count} from <span className="font-medium">{category?.name ?? "unknown category"}</span>
                      </p>
                      <form action={deletePackageSlot.bind(null, slot.id, vendor.id)}>
                        <button type="submit" className={dangerButtonClass}>
                          Delete slot
                        </button>
                      </form>
                    </div>
                    {slotItems.length > 0 && (
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {slotItems.map((si) => (
                          <li key={si.id} className="flex items-center gap-1.5 rounded-full bg-royal-100 px-2 py-0.5 text-xs text-royal-700">
                            {si.item?.name}
                            {si.is_default && <span className="text-gold-600">★</span>}
                            <form action={deletePackageSlotItem.bind(null, si.id, vendor.id)}>
                              <button type="submit" aria-label={`Remove ${si.item?.name}`} className="cursor-pointer text-royal-700 hover:text-red-600">
                                ×
                              </button>
                            </form>
                          </li>
                        ))}
                      </ul>
                    )}
                    {categoryItems.length > 0 && (
                      <form action={addPackageSlotItem.bind(null, slot.id, vendor.id)} className="mt-2 flex flex-wrap items-end gap-2">
                        <select name="item_id" className={`${inputClass} h-9`}>
                          {categoryItems.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                        <label className="flex items-center gap-1 text-xs text-ink-muted">
                          <input type="checkbox" name="is_default" className="h-5 w-5" />
                          Default
                        </label>
                        <button type="submit" className={secondaryButtonClass}>
                          Add to slot
                        </button>
                      </form>
                    )}
                  </div>
                );
              })}

              {vendor.menu_categories.length > 0 && (
                <form action={addPackageSlot.bind(null, pkg.id, vendor.id)} className="flex flex-wrap items-end gap-3">
                  <label className="flex flex-col gap-1 text-xs text-ink-muted">
                    Category
                    <select name="category_id" className={`${inputClass} h-9`}>
                      {vendor.menu_categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-ink-muted">
                    Pick count
                    <input type="number" name="selections_count" min={1} defaultValue={1} className={`${inputClass} h-9 w-20`} />
                  </label>
                  <button type="submit" className={secondaryButtonClass}>
                    Add slot
                  </button>
                </form>
              )}
            </div>

            {allItems.length > 0 && (
              <details className="pl-4">
                <summary className="cursor-pointer text-xs font-medium uppercase tracking-wide text-ink-muted">
                  Or pick exact dishes
                </summary>
                <form action={addExactDishesToPackage.bind(null, pkg.id, vendor.id)} className="mt-2 flex flex-col gap-2">
                  <div className="flex max-h-48 flex-col gap-1 overflow-y-auto rounded-lg border border-border p-3">
                    {allItems.map((item) => (
                      <label key={item.id} className="flex items-center gap-2 text-sm text-ink">
                        <input type="checkbox" name="item_ids" value={item.id} className="h-4 w-4" />
                        {item.name} <span className="text-xs text-ink-muted">({item.categoryName})</span>
                      </label>
                    ))}
                  </div>
                  <button type="submit" className={`${secondaryButtonClass} w-fit`}>
                    Add selected dishes
                  </button>
                </form>
              </details>
            )}
          </div>
        ))}

        <form action={addPackage.bind(null, vendor.id)} className="flex flex-wrap items-end gap-3 border-t border-border pt-4">
          <label className="flex flex-col gap-1 text-sm text-ink-muted">
            New package name
            <input type="text" name="name" required className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm text-ink-muted">
            Description
            <input type="text" name="description" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm text-ink-muted">
            ₹ / plate at 500 plates
            <input type="number" step="0.01" name="base_price_pp" required className={`${inputClass} w-40`} />
          </label>
          <label className="flex flex-col gap-1 text-sm text-ink-muted">
            Min plates (optional)
            <input type="number" name="min_plates" className={`${inputClass} w-28`} />
          </label>
          <button type="submit" className={secondaryButtonClass}>
            Add package
          </button>
        </form>
      </section>

      <p className="text-xs text-ink-muted">Prices above are per plate at 500 plates.</p>
    </div>
  );
}
