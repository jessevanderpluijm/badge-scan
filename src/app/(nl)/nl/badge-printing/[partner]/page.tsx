import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PartnerPageContent } from "@/components/marketing/partner-page-content";
import { dict, localeAlternates } from "@/lib/i18n";
import { PARTNERS_NL } from "@/app/(en)/badge-printing/[partner]/partners.nl";

export function generateStaticParams() {
  return Object.keys(PARTNERS_NL).map((partner) => ({ partner }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ partner: string }>;
}): Promise<Metadata> {
  const { partner } = await params;
  const data = PARTNERS_NL[partner];
  if (!data) return {};
  const t = dict.nl.partnerPage;
  const title = t.metaTitle(data.name);
  const description = t.metaDescription(data.oneLiner);
  const url = `/badge-printing/${data.slug}`;
  return {
    title,
    description,
    alternates: localeAlternates("nl", url),
    openGraph: { title, description, url: `/nl${url}`, type: "website" },
    twitter: { card: "summary_large_image", title, description },
    keywords: t.keywords(data.name),
  };
}

export default async function NlPartnerPage({
  params,
}: {
  params: Promise<{ partner: string }>;
}) {
  const { partner } = await params;
  const data = PARTNERS_NL[partner];
  if (!data) notFound();
  return <PartnerPageContent locale="nl" data={data} />;
}
