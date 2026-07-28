import { getSiteSettings } from "@/lib/admin/queries";
import { clearFallbackCoverImage, updateHomeContent, uploadFallbackCoverImage } from "@/lib/admin/actions";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { LogoUploadForm } from "@/components/LogoUploadForm";

const inputClass =
  "h-11 rounded-lg border border-border bg-surface px-3 text-sm text-ink transition-colors duration-200 ease-out focus:border-royal-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-royal-100";
const textareaClass = `${inputClass} h-auto py-2`;
const primaryButtonClass =
  "h-11 cursor-pointer rounded-lg bg-royal-700 px-4 text-sm font-medium text-white transition-colors duration-200 ease-out hover:bg-royal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600";
const dangerButtonClass =
  "h-9 cursor-pointer rounded-lg border border-red-200 px-3 text-xs font-medium text-red-600 transition-colors duration-200 ease-out hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500";

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();
  const content = settings.home_content;

  return (
    <div className="flex flex-col gap-10">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Settings</h1>

      <section className="flex flex-col gap-4 rounded-3xl border border-border bg-surface p-5 shadow-card">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-ink">SRP fallback cover image</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Shown on discovery cards and vendor profiles whenever a vendor has no cover photo of their own. Leave unset
            to use the built-in rotating stock-photo pool.
          </p>
        </div>
        <LogoUploadForm
          action={uploadFallbackCoverImage}
          currentUrl={settings.fallback_cover_image_url}
          vendorName="Fallback"
          fieldName="fallback_image"
          label="fallback image"
          alt="Default fallback cover image"
        />
        {settings.fallback_cover_image_url && (
          <form action={clearFallbackCoverImage}>
            <ConfirmSubmitButton
              confirmMessage="Revert to the built-in rotating stock-photo pool?"
              className={dangerButtonClass}
            >
              Reset to default pool
            </ConfirmSubmitButton>
          </form>
        )}
      </section>

      <section className="flex flex-col gap-6 rounded-3xl border border-border bg-surface p-5 shadow-card">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-ink">Home page content</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Every piece of text on the home page, including the brand name. Changes go live immediately on save.
          </p>
        </div>

        <form action={updateHomeContent} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm text-ink-muted">
              Brand name
              <input type="text" name="brandName" defaultValue={content.brandName} required className={inputClass} />
            </label>
            <label className="flex flex-col gap-1 text-sm text-ink-muted">
              Hero button label
              <input type="text" name="heroCtaLabel" defaultValue={content.heroCtaLabel} required className={inputClass} />
            </label>
            <label className="flex flex-col gap-1 text-sm text-ink-muted sm:col-span-2">
              Hero subtitle
              <textarea name="heroSubtitle" defaultValue={content.heroSubtitle} rows={2} required className={textareaClass} />
            </label>
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-4">
            <label className="flex flex-col gap-1 text-sm text-ink-muted">
              &quot;Worries&quot; section heading
              <input type="text" name="worriesHeading" defaultValue={content.worriesHeading} required className={inputClass} />
            </label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {content.worries.map((w, i) => (
                <div key={i} className="flex flex-col gap-2 rounded-2xl border border-border p-3">
                  <label className="flex flex-col gap-1 text-xs text-ink-muted">
                    Card {i + 1} title
                    <input type="text" name={`worry${i}_title`} defaultValue={w.title} required className={`${inputClass} h-9`} />
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-ink-muted">
                    Card {i + 1} body
                    <textarea name={`worry${i}_body`} defaultValue={w.body} rows={3} required className={textareaClass} />
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm text-ink-muted">
                Second section heading
                <input type="text" name="section2Heading" defaultValue={content.section2Heading} required className={inputClass} />
              </label>
              <label className="flex flex-col gap-1 text-sm text-ink-muted">
                Second section button label
                <input type="text" name="section2CtaLabel" defaultValue={content.section2CtaLabel} required className={inputClass} />
              </label>
              <label className="flex flex-col gap-1 text-sm text-ink-muted sm:col-span-2">
                Second section body
                <textarea name="section2Body" defaultValue={content.section2Body} rows={2} required className={textareaClass} />
              </label>
              <label className="flex flex-col gap-1 text-sm text-ink-muted">
                Second section fine print (e.g. &quot;T&amp;C apply.&quot;)
                <input type="text" name="section2Tc" defaultValue={content.section2Tc} required className={inputClass} />
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-4">
            <p className="text-sm text-ink-muted">Feature cards</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {content.features.map((f, i) => (
                <div key={i} className="flex flex-col gap-2 rounded-2xl border border-border p-3">
                  <label className="flex flex-col gap-1 text-xs text-ink-muted">
                    Card {i + 1} title
                    <input type="text" name={`feature${i}_title`} defaultValue={f.title} required className={`${inputClass} h-9`} />
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-ink-muted">
                    Card {i + 1} body
                    <textarea name={`feature${i}_body`} defaultValue={f.body} rows={3} required className={textareaClass} />
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <button type="submit" className={primaryButtonClass}>
              Save home page content
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
