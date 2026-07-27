import { getSiteSettings } from "@/lib/admin/queries";
import { clearFallbackCoverImage, uploadFallbackCoverImage } from "@/lib/admin/actions";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { LogoUploadForm } from "@/components/LogoUploadForm";

const dangerButtonClass =
  "h-9 cursor-pointer rounded-lg border border-red-200 px-3 text-xs font-medium text-red-600 transition-colors duration-200 ease-out hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500";

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();

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
    </div>
  );
}
