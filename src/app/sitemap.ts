import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { PARTNERS } from "@/app/badge-printing/[partner]/partners";
import { EVENT_TYPES } from "@/app/badge-printing/for/[type]/event-types";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const routes = [
    "/",
    "/demo",
    ...Object.keys(PARTNERS).map((slug) => `/badge-printing/${slug}`),
    ...Object.keys(EVENT_TYPES).map((slug) => `/badge-printing/for/${slug}`),
  ];

  return routes.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: "weekly",
    priority: path === "/" ? 1 : 0.8,
  }));
}
