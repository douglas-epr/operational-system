export type LandingImageSlot = "hero" | "features" | "testimonials" | "cta";

export interface LandingImage {
  url: string;
  alt: string;
  use: LandingImageSlot;
  width: number;
  height: number;
}

interface PexelsPhoto {
  width: number;
  height: number;
  alt: string;
  src: { large2x: string; large: string };
}

interface PexelsResponse {
  photos: PexelsPhoto[];
}

// Generic fallback images — used when PEXELS_API_KEY is not configured.
// These professional photos work for most SaaS / consumer product landing pages.
const FALLBACK_IMAGES: LandingImage[] = [
  {
    url: "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
    alt: "Professional team collaborating in a bright modern workspace",
    use: "hero",
    width: 1260,
    height: 750,
  },
  {
    url: "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
    alt: "Team working together on a solution",
    use: "features",
    width: 1260,
    height: 750,
  },
  {
    url: "https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
    alt: "Happy people sharing a moment of success",
    use: "testimonials",
    width: 1260,
    height: 750,
  },
  {
    url: "https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
    alt: "Person achieving their goals on a laptop",
    use: "cta",
    width: 1260,
    height: 750,
  },
];

const SLOTS: Array<{ use: LandingImageSlot; suffix: string }> = [
  { use: "hero",         suffix: "lifestyle portrait people" },
  { use: "features",     suffix: "benefit solution modern" },
  { use: "testimonials", suffix: "happy success customer smiling" },
  { use: "cta",          suffix: "action motivation achievement" },
];

/**
 * Searches Pexels for contextually relevant landing page images.
 *
 * Requires PEXELS_API_KEY in the environment (free at pexels.com/api).
 * Falls back to generic professional photos when the key is absent.
 * Results are cached for 1 hour per query to avoid redundant API calls.
 */
export async function searchLandingImages(query: string): Promise<LandingImage[]> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return FALLBACK_IMAGES;

  const safeQuery = query.trim().slice(0, 80);

  const results = await Promise.all(
    SLOTS.map(async ({ use, suffix }) => {
      try {
        const res = await fetch(
          `https://api.pexels.com/v1/search?query=${encodeURIComponent(`${safeQuery} ${suffix}`)}&per_page=1&orientation=landscape&size=large`,
          {
            headers: { Authorization: apiKey },
            next: { revalidate: 3600 },
          }
        );
        if (!res.ok) return null;
        const data: PexelsResponse = await res.json();
        const photo = data.photos?.[0];
        if (!photo) return null;
        return {
          url: photo.src.large2x || photo.src.large,
          alt: photo.alt || `${safeQuery} ${use}`,
          use,
          width: photo.width,
          height: photo.height,
        } satisfies LandingImage;
      } catch {
        return null;
      }
    })
  );

  const valid = results.filter((r): r is LandingImage => r !== null);
  return valid.length >= 2 ? valid : FALLBACK_IMAGES;
}
