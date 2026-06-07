import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { EventTypePageContent } from "@/components/marketing/event-type-page-content";
import { dict, localeAlternates } from "@/lib/i18n";
import { EVENT_TYPES } from "./event-types";

export function generateStaticParams() {
  return Object.keys(EVENT_TYPES).map((type) => ({ type }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string }>;
}): Promise<Metadata> {
  const { type } = await params;
  const data = EVENT_TYPES[type];
  if (!data) return {};
  const t = dict.en.eventTypePage;
  const title = t.metaTitle(data.nameLower);
  const description = t.metaDescription(
    data.oneLiner,
    data.nameLower,
    data.dutchKeyword,
  );
  const url = `/badge-printing/for/${data.slug}`;
  return {
    title,
    description,
    alternates: localeAlternates("en", url),
    openGraph: { title, description, url, type: "website" },
    twitter: { card: "summary_large_image", title, description },
    keywords: t.keywords(data.name, data.nameLower, data.dutchKeyword),
  };
}

export default async function EventTypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const data = EVENT_TYPES[type];
  if (!data) notFound();
  return <EventTypePageContent locale="en" data={data} />;
}
