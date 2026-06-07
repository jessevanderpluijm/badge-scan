import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight, Check, Printer, Upload } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { FinalCta } from "@/components/marketing/final-cta";
import { JsonLd, faqPageSchema } from "@/components/seo/json-ld";
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
  const title = `Badge printing for ${data.name}`;
  const description = `${data.oneLiner} Export attendees, design a badge, print at check-in on an Epson ColorWorks C4000.`;
  const url = `/badge-printing/${data.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    keywords: [
      `badge printing ${data.name}`,
      `${data.name} badge printing`,
      `${data.name} conference badges`,
      `${data.name} event badges`,
      "conference badge printing",
      "event badge printing",
      "Epson ColorWorks C4000",
    ],
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd data={faqPageSchema(data.faq)} />
      <MarketingNav />

      <section className="container py-16 sm:py-20 grid lg:grid-cols-2 gap-10 items-start">
        <div className="space-y-6 max-w-xl">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← All integrations
          </Link>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1]">
            Badge printing for {data.name}.
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {data.description}
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link href="/login" className={buttonVariants({ size: "lg" })}>
              Start free <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#how"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              How the {data.name} flow works
            </a>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 pt-4 text-sm text-muted-foreground">
            {[
              `No ${data.name} integration setup`,
              "Print at the door on demand",
              "Compatible with any C4000 printer",
              "Free to try",
            ].map((p) => (
              <li key={p} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success flex-shrink-0" />
                {p}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border bg-card p-6 space-y-4">
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono">
            {data.name} → Badge Scan → Printer
          </div>
          <div className="space-y-3">
            <Step
              icon={Upload}
              n={1}
              title={`Export attendees from ${data.name}`}
              body={data.exportSteps[0]}
            />
            <Step
              icon={Upload}
              n={2}
              title="Map columns in Badge Scan"
              body={data.exportSteps[1]}
            />
            <Step
              icon={Printer}
              n={3}
              title="Design & print"
              body={data.exportSteps[2]}
            />
          </div>
        </div>
      </section>

      <section id="how" className="border-y bg-muted/30">
        <div className="container py-20">
          <div className="max-w-2xl mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Why event organisers using {data.name} pick Badge Scan
            </h2>
            <p className="text-muted-foreground mt-3">
              You already chose {data.origin} for ticketing. Badge Scan only
              touches the badge step.
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
            {data.name} badge printing — FAQ
          </h2>
          <p className="text-muted-foreground mb-8">
            Everything event organisers usually ask before switching their
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
        heading={`Ready to print ${data.name} badges?`}
        body={`Set up your first event in under a minute. No ${data.name} integration required.`}
      />
      <MarketingFooter />
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
          <span className="text-xs font-mono text-muted-foreground">
            0{n}
          </span>
          <h4 className="font-semibold text-sm">{title}</h4>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
          {body}
        </p>
      </div>
    </div>
  );
}
