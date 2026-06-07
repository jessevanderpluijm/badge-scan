import type { Metadata } from "next";
import { Check } from "lucide-react";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { DemoForm } from "./demo-form";

export const metadata: Metadata = {
  title: "Book a demo",
  description:
    "See how Badge Scan handles check-in and on-demand badge printing for your event. Tell us about your event and we'll set up a personal demo.",
  alternates: { canonical: "/demo" },
  openGraph: {
    title: "Book a demo | Badge Scan",
    description:
      "See how Badge Scan handles check-in and on-demand badge printing for your event.",
    url: "/demo",
    type: "website",
  },
};

const POINTS = [
  "See the full CSV-to-printed-badge flow",
  "Works with your existing ticketing system",
  "Get pricing for your event size",
];

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingNav />

      <section className="container py-16 sm:py-20 grid lg:grid-cols-2 gap-12 items-start">
        <div className="space-y-6 max-w-lg">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1]">
            Book a demo.
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Tell us about your event and we&apos;ll walk you through check-in and
            on-demand badge printing with Badge Scan — and answer anything you
            need before your next event.
          </p>
          <ul className="space-y-3 pt-2">
            {POINTS.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{p}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border bg-card p-6 sm:p-8">
          <DemoForm />
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
