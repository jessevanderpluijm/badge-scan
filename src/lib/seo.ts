// Absolute base URL of the public site, used for metadataBase, canonicals,
// sitemap and robots. Set NEXT_PUBLIC_SITE_URL in production; falls back to
// localhost in development.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");
