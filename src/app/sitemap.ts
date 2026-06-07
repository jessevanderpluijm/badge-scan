import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { PARTNERS } from "@/app/(en)/badge-printing/[partner]/partners";
import { EVENT_TYPES } from "@/app/(en)/badge-printing/for/[type]/event-types";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const partnerPaths = Object.keys(PARTNERS).map(
    (slug) => `/badge-printing/${slug}`,
  );
  const eventTypePaths = Object.keys(EVENT_TYPES).map(
    (slug) => `/badge-printing/for/${slug}`,
  );

  const basePaths = ["/", "/demo", ...partnerPaths, ...eventTypePaths];

  const nlPaths = basePaths.map((path) =>
    path === "/" ? "/nl" : `/nl${path}`,
  );

  const routes = [...basePaths, ...nlPaths];

  return routes.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: "weekly",
    priority: path === "/" || path === "/nl" ? 1 : 0.8,
  }));
}
