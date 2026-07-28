// Shown wherever a vendor's name appears (SRP card, vendor detail page) when they have
// a real FSSAI license number on file - never based on the older, subjective
// is_verified ("personally vetted") flag. Presence of the number is the whole check.
export function FssaiBadge({ fssaiLicenseNumber }: { fssaiLicenseNumber: string | null }) {
  if (!fssaiLicenseNumber) return null;
  return (
    <span
      title={`FSSAI Lic. No. ${fssaiLicenseNumber}`}
      className="inline-flex shrink-0 items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700"
    >
      <span aria-hidden>✓</span> FSSAI certified
    </span>
  );
}
