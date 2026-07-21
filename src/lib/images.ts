// Curated Unsplash food photography, used when a vendor has no cover_image_url yet.
// Deterministic per vendor (same id always picks the same image) so a card doesn't
// change photo on every render.
const FALLBACK_FOOD_IMAGES = [
  "https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1777613112895-139720bd43c9?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1599043513900-ed6fe01d3833?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1559528896-c5310744cce8?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1633945274309-2c16c9682a8c?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=1200&q=80&auto=format&fit=crop",
];

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function vendorCoverImage(vendorId: string, coverImageUrl: string | null): string {
  if (coverImageUrl) return coverImageUrl;
  return FALLBACK_FOOD_IMAGES[hashString(vendorId) % FALLBACK_FOOD_IMAGES.length];
}
