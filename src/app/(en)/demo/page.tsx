import type { Metadata } from "next";
import { Check } from "lucide-react";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { DemoForm } from "@/components/marketing/demo-form";
import { dict, localeAlternates } from "@/lib/i18n";

const t = dict.en.demo;

export const metadata: Metadata = {
  title: t.meta.title,
  description: t.meta.description,
  alternates: localeAlternates("en", "/demo"),
  openGraph: {
    title: `${t.meta.title} | Badge Scan`,
    description: t.meta.description,
    url: "/demo",
    type: "website",
  },
};

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingNav locale="en" />

      <section className="container py-16 sm:py-20 grid lg:grid-cols-2 gap-12 items-start">
        <div className="space-y-6 max-w-lg">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1]">
            {t.title}
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {t.intro}
          </p>
          <ul className="space-y-3 pt-2">
            {t.points.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{p}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border bg-card p-6 sm:p-8">
          <DemoForm locale="en" />
        </div>
      </section>

      <MarketingFooter locale="en" />
    </div>
  );
}
