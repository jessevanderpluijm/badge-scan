import Link from "next/link";
import { ArrowRight, Check, Printer, Upload } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { FinalCta } from "@/components/marketing/final-cta";
import { JsonLd, faqPageSchema } from "@/components/seo/json-ld";
import { type Locale, dict, localePath } from "@/lib/i18n";
import type { Partner } from "@/app/(en)/badge-printing/[partner]/partners";

export function PartnerPageContent({
  locale,
  data,
}: {
  locale: Locale;
  data: Partner;
}) {
  const t = dict[locale].partnerPage;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd data={faqPageSchema(data.faq)} />
      <MarketingNav locale={locale} />

      <section className="container py-16 sm:py-20 grid lg:grid-cols-2 gap-10 items-start">
        <div className="space-y-6 max-w-xl">
          <Link
            href={localePath(locale, "/")}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {t.backLink}
          </Link>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1]">
            {dict[locale].footer.badgePrintingFor(data.name)}.
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {data.description}
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href={localePath(locale, "/demo")}
              className={buttonVariants({ size: "lg" })}
            >
              {t.bookDemo} <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#how"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              {t.howFlow(data.name)}
            </a>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 pt-4 text-sm text-muted-foreground">
            {t.bullets(data.name).map((p) => (
              <li key={p} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success flex-shrink-0" />
                {p}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border bg-card p-6 space-y-4">
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono">
            {t.flowLabel(data.name)}
          </div>
          <div className="space-y-3">
            <Step
              icon={Upload}
              n={1}
              title={t.exportTitle(data.name)}
              body={data.exportSteps[0]}
            />
            <Step
              icon={Upload}
              n={2}
              title={t.mapTitle}
              body={data.exportSteps[1]}
            />
            <Step
              icon={Printer}
              n={3}
              title={t.designTitle}
              body={data.exportSteps[2]}
            />
          </div>
        </div>
      </section>

      <section id="how" className="border-y bg-muted/30">
        <div className="container py-20">
          <div className="max-w-2xl mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              {t.whyHeading(data.name)}
            </h2>
            <p className="text-muted-foreground mt-3">
              {t.whySub(data.name, data.origin)}
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {data.whyBullets.map((b) => (
              <div
                key={b.title}
                className="rounded-xl border bg-card p-6 space-y-2"
              >
                <h3 className="font-semibold tracking-tight">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {b.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
            {t.faqHeading(data.name)}
          </h2>
          <p className="text-muted-foreground mb-8">{t.faqSub}</p>
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
        heading={t.ctaHeading(data.name)}
        body={t.ctaBody(data.name)}
      />
      <MarketingFooter locale={locale} />
    </div>
  );
}

function Step({
  icon: Icon,
  n,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  n: number;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 h-9 w-9 rounded-lg bg-muted text-foreground flex items-center justify-center">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">0{n}</span>
          <h4 className="font-semibold text-sm">{title}</h4>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
          {body}
        </p>
      </div>
    </div>
  );
}
