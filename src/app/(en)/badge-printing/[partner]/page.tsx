import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PartnerPageContent } from "@/components/marketing/partner-page-content";
import { dict, localeAlternates } from "@/lib/i18n";
import { PARTNERS } from "./partners";

export function generateStaticParams() {
  return Object.keys(PARTNERS).map((partner) => ({ partner }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ partner: string }>;
}): Promise<Metadata> {
  const { partner } = await params;
  const data = PARTNERS[partner];
  if (!data) return {};
  const t = dict.en.partnerPage;
  const title = t.metaTitle(data.name);
  const description = t.metaDescription(data.oneLiner);
  const url = `/badge-printing/${data.slug}`;
  return {
    title,
    description,
    alternates: localeAlternates("en", url),
    openGraph: { title, description, url, type: "website" },
    twitter: { card: "summary_large_image", title, description },
    keywords: t.keywords(data.name),
  };
}

export default async function PartnerPage({
  params,
}: {
  params: Promise<{ partner: string }>;
}) {
  const { partner } = await params;
  const data = PARTNERS[partner];
  if (!data) notFound();
  return <PartnerPageContent locale="en" data={data} />;
}
