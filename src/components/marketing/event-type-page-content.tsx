import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { FinalCta } from "@/components/marketing/final-cta";
import { Reviews } from "@/components/marketing/reviews";
import { JsonLd, faqPageSchema } from "@/components/seo/json-ld";
import { type Locale, dict, localePath } from "@/lib/i18n";
import type { EventType } from "@/app/(en)/badge-printing/for/[type]/event-types";

export function EventTypePageContent({
  locale,
  data,
}: {
  locale: Locale;
  data: EventType;
}) {
  const t = dict[locale].eventTypePage;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd data={faqPageSchema(data.faq)} />
      <MarketingNav locale={locale} />

      <section className="container py-16 sm:py-20">
        <div className="max-w-3xl space-y-6">
          <Link
            href={localePath(locale, "/")}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {t.backLink}
          </Link>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
            {dict[locale].footer.badgePrintingFor(data.nameLower)}.
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {data.description}
          </p>
          <p className="text-sm text-muted-foreground">{data.audience}</p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href={localePath(locale, "/demo")}
              className={buttonVariants({ size: "lg" })}
            >
              {dict[locale].nav.bookDemo} <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#scenarios"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              {t.seeHow}
            </a>
          </div>
        </div>
      </section>

      <section id="scenarios" className="border-y bg-muted/30">
        <div className="container py-20">
          <div className="grid lg:grid-cols-2 gap-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {t.scenariosHeading(data.nameLower)}
              </h2>
              <p className="text-muted-foreground mt-3">{t.scenariosSub}</p>
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

      <Reviews locale={locale} />

      <section className="container py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
            {t.faqHeading(data.name)}
          </h2>
          <p className="text-muted-foreground mb-8">{t.faqSub(data.nameLower)}</p>
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
        locale={locale}
        heading={t.ctaHeading(data.nameLower)}
        body={t.ctaBody(data.nameLower)}
      />
      <MarketingFooter locale={locale} />
    </div>
  );
}
