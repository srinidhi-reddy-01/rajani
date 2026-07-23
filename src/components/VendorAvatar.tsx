import Image from "next/image";

function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

// Circular vendor avatar with a fallback chain: a real owner photo is the most
// trustworthy, the uploaded logo is the next best thing, and an initials badge
// means a card is never left with a broken image or a blank circle.
export function VendorAvatar({
  name,
  ownerPhotoUrl,
  logoUrl,
  className = "",
}: {
  name: string;
  ownerPhotoUrl: string | null;
  logoUrl: string | null;
  className?: string;
}) {
  const src = ownerPhotoUrl ?? logoUrl;
  if (src) {
    return (
      <Image
        src={src}
        alt=""
        width={64}
        height={64}
        className={`rounded-full border-4 border-surface object-cover shadow-card ${className}`}
      />
    );
  }
  return (
    <div
      className={`flex items-center justify-center rounded-full border-4 border-surface bg-gradient-to-br from-royal-600 to-royal-800 text-sm font-semibold text-cream-50 shadow-card ${className}`}
      aria-hidden
    >
      {initialsOf(name)}
    </div>
  );
}
