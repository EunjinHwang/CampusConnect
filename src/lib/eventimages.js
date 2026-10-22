// Fallback cover images by category, used when an event has no image_url.
export const CATEGORY_IMAGES = {
  Academic:
    "https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1200&q=85",
  Clubs:
    "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=85",
  Sports:
    "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=85",
  Culture:
    "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=85",
  Career:
    "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=85",
  default:
    "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=85",
};

export function fallbackImageFor(category) {
  return CATEGORY_IMAGES[category] ?? CATEGORY_IMAGES.default;
}
