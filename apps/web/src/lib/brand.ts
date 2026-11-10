// The organization's logo as supplied (public/brand/logo.jpg); next/image
// serves resized copies, so the original stays the single source.
export const BRAND_LOGO = { src: "/brand/logo.jpg", width: 960, height: 856 } as const;

// Cleared for use (docs/design/README.md); the repository is public.
export const HERITAGE_IMAGES = {
  painting: { src: "/images/heritage/yakthung-cheli-painting.jpg", width: 1920, height: 2561 },
  illustration: { src: "/images/heritage/yakthung-pair-illustration.jpg", width: 447, height: 447 },
} as const;
