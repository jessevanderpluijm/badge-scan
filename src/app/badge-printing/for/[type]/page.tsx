import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight, Check } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { FinalCta } from "@/components/marketing/final-cta";
import { Reviews } from "@/components/marketing/reviews";
import { JsonLd, faqPageSchema } from "@/components/seo/json-ld";
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
  const title = `Badge printing for ${data.nameLower}`;
  const description = `${data.oneLiner} On-demand badge printing for ${data.nameLower} (${data.dutchKeyword}) — designed for the Epson ColorWorks C4000.`;
  const url = `/badge-printing/for/${data.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website" },
    twitter: { card: "summary_large_image", title, description },
    keywords: [
      `badge printing ${data.nameLower}`,
      `badge printing ${data.dutchKeyword}`,
      `${data.name} badge printing`,
      `${data.dutchKeyword} badges`,
      `${data.nameLower} check-in`,
      "Epson ColorWorks C4000",
      "on-demand badge printing",
    ],
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd data={faqPageSchema(data.faq)} />
      <MarketingNav />

      <section className="container py-16 sm:py-20">
        <div className="max-w-3xl space-y-6">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to home
          </Link>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
            Badge printing for {data.nameLower}.
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {data.description}
          </p>
          <p className="text-sm text-muted-foreground">{data.audience}</p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link href="/login" className={buttonVariants({ size: "lg" })}>
              Start free <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#scenarios"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              See how it fits
            </a>
          </div>
        </div>
      </section>

      <section id="scenarios" className="border-y bg-muted/30">
        <div className="container py-20">
          <div className="grid lg:grid-cols-2 gap-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Where Badge Scan fits in your {data.nameLower}.
              </h2>
              <p className="text-muted-foreground mt-3">
                Common scenarios where event organisers turn to Badge Scan
                instead of pre-printing or stickers.
              </p>
              <ul className="mt-6 space-y-3">
                {data.scenarios.map((s) => (
                  <li key={s} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid gap-4">
              {data.whyBullets.map((b) => (
                <div
                  key={b.title}
                  className="rounded-xl border bg-card p-5 space-y-1.5"
                >
                  <h3 className="font-semibold tracking-tight">{b.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {b.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Reviews />

      <section className="container py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
            {data.name} badge printing — FAQ
          </h2>
          <p className="text-muted-foreground mb-8">
            Questions event organisers ask before moving their {data.nameLower}{" "}
            badge flow to Badge Scan.
          </p>
          <dl className="divide-y border rounded-xl bg-card">
            {data.faq.map((f) => (
              <div key={f.q} className="p-5">
                <dt className="font-semibold">{f.q}</dt>
                <dd className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  {f.a}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <FinalCta
        heading={`Print badges for your ${data.nameLower} the easy way.`}
        body={`Set up your first ${data.name.toLowerCase()} in under a minute. Free while you try it.`}
      />
      <MarketingFooter />
    </div>
  );
}
