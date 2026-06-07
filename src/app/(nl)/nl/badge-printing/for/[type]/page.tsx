import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { EventTypePageContent } from "@/components/marketing/event-type-page-content";
import { dict, localeAlternates } from "@/lib/i18n";
import { EVENT_TYPES_NL } from "@/app/(en)/badge-printing/for/[type]/event-types.nl";

export function generateStaticParams() {
  return Object.keys(EVENT_TYPES_NL).map((type) => ({ type }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string }>;
}): Promise<Metadata> {
  const { type } = await params;
  const data = EVENT_TYPES_NL[type];
  if (!data) return {};
  const t = dict.nl.eventTypePage;
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
    alternates: localeAlternates("nl", url),
    openGraph: { title, description, url: `/nl${url}`, type: "website" },
    twitter: { card: "summary_large_image", title, description },
    keywords: t.keywords(data.name, data.nameLower, data.dutchKeyword),
  };
}

export default async function NlEventTypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const data = EVENT_TYPES_NL[type];
  if (!data) notFound();
  return <EventTypePageContent locale="nl" data={data} />;
}
