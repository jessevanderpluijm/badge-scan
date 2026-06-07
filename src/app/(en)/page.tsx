import Link from "next/link";
import type { Metadata } from "next";
import {
  ScanLine,
  Upload,
  Palette,
  Printer,
  Check,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { FinalCta } from "@/components/marketing/final-cta";
import { Reviews } from "@/components/marketing/reviews";
import { AuthCtaButton } from "@/components/marketing/auth-cta";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_URL } from "@/lib/seo";
import { localeAlternates } from "@/lib/i18n";

export const metadata: Metadata = {
  title: {
    absolute: "Badge Scan — Print event & conference badges on demand",
  },
  description:
    "The easiest way to print name badges for conferences, trade shows and networking events. Upload your attendee list, design beautiful badges in minutes, and print on demand at the door.",
  alternates: localeAlternates("en", "/"),
  openGraph: {
    title: "Badge Scan — Print event & conference badges on demand",
    description:
      "Upload your attendee list, design badges in minutes, and print on demand at the door — straight from your browser.",
    url: "/",
    type: "website",
  },
};

const TICKET_PARTNERS = [
  { slug: "weticket", name: "WeTicket" },
  { slug: "weeztix", name: "Weeztix" },
  { slug: "paylogic", name: "Paylogic" },
  { slug: "momice", name: "Momice" },
];

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": `${SITE_URL}/#organization`,
              name: "Badge Scan",
              url: SITE_URL,
            },
            {
              "@type": "SoftwareApplication",
              name: "Badge Scan",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              url: SITE_URL,
              description:
                "Self-serve check-in and on-demand badge printing for conferences, trade shows and networking events.",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "EUR",
              },
            },
          ],
        }}
      />
      <MarketingNav locale="en" />
      <Hero />
      <TicketingPartners />
      <Features />
      <Reviews locale="en" />
      <FinalCta locale="en" />
      <MarketingFooter locale="en" />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 -z-10 opacity-[0.04] bg-[radial-gradient(circle_at_1px_1px,_currentColor_1px,_transparent_0)]"
        style={{ backgroundSize: "24px 24px" }}
        aria-hidden
      />
      <div className="container py-20 sm:py-28 grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6 max-w-xl">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
            The easiest way to print badges for conferences and events.
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Upload your attendee list, design beautiful badges in minutes, and
            print on demand at the door — straight from your browser to your
            Epson ColorWorks C4000.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <AuthCtaButton locale="en" loggedOutLabel="Book a demo" />
            <a
              href="#how-it-works"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              See how it works
            </a>
          </div>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2 pt-4 text-sm text-muted-foreground">
            {[
              "Works with any ticketing system",
              "Print on demand at check-in",
              "Bring your own CSV",
              "No setup fees",
            ].map((p) => (
              <li key={p} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success flex-shrink-0" />
                {p}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <BadgeMockup />
        </div>
      </div>
    </section>
  );
}

function BadgeMockup() {
  return (
    <div className="relative mx-auto max-w-md">
      <div
        className="absolute -inset-8 bg-gradient-to-tr from-primary/10 via-transparent to-success/10 blur-3xl -z-10"
        aria-hidden
      />
      <div className="bg-card border rounded-2xl shadow-2xl shadow-foreground/10 p-6 rotate-[-2deg]">
        <div className="flex justify-between items-center mb-4">
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Butterfly · 96 × 82 mm
          </div>
          <div className="flex gap-1">
            <span className="h-2 w-2 rounded-full bg-destructive/50" />
            <span className="h-2 w-2 rounded-full bg-warning/50" />
            <span className="h-2 w-2 rounded-full bg-success/50" />
          </div>
        </div>
        <div
          className="relative rounded-md overflow-hidden border bg-white text-slate-900"
          style={{ aspectRatio: "96 / 82" }}
        >
          <div className="absolute inset-y-0 left-1/2 border-l border-dashed border-slate-200 pointer-events-none" />
          {[0, 1].map((i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 flex flex-col items-center text-center justify-between py-4 px-3"
              style={{ left: `${i * 50}%`, width: "50%" }}
            >
              <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                TechConf 2026
              </div>
              <div className="space-y-0.5">
                <div className="text-lg sm:text-xl font-bold leading-tight">
                  Sarah Lee
                </div>
                <div className="text-[10px] text-slate-500">
                  Head of Product
                </div>
                <div className="text-[10px] text-slate-500">Acme Inc.</div>
              </div>
              <div className="text-[8px] font-mono text-slate-400">
                #A12-3045
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Printer className="h-3.5 w-3.5" />
          Ready for the Epson ColorWorks C4000
        </div>
      </div>
    </div>
  );
}

function TicketingPartners() {
  return (
    <section className="border-y bg-muted/30">
      <div className="container py-12">
        <p className="text-center text-sm font-medium text-muted-foreground mb-6">
          Compatible with every ticketing system. Drop in a CSV from any of
          these — or your own:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 items-center">
          {TICKET_PARTNERS.map((p) => (
            <Link
              key={p.slug}
              href={`/badge-printing/${p.slug}`}
              className={cn(
                "flex items-center justify-center h-12 rounded-lg",
                "text-lg sm:text-xl font-bold tracking-tight",
                "text-muted-foreground hover:text-foreground transition-colors",
                "grayscale opacity-80 hover:opacity-100",
              )}
              title={`Badge printing for ${p.name}`}
            >
              {p.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    {
      icon: Upload,
      title: "Bring your CSV",
      body: "Export attendees from any ticket platform — WeTicket, Weeztix, Paylogic, Momice, or a plain spreadsheet. Drag the file in, map columns once, done.",
    },
    {
      icon: Palette,
      title: "Design once, print many",
      body: "Drop in your logo, pick brand colors, choose which fields to show. A live preview at the exact print dimensions so what you see is what comes out.",
    },
    {
      icon: Printer,
      title: "Scan & print at the door",
      body: "Plug in a barcode scanner, scan the ticket, and the badge prints instantly on your Epson ColorWorks C4000. No queues, no manual lookup.",
    },
  ];

  return (
    <section id="how-it-works" className="container py-20 sm:py-28">
      <div className="max-w-2xl mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
          From CSV to printed badge in three steps.
        </h2>
        <p className="text-muted-foreground mt-3 text-lg">
          No new ticketing platform. No new scanners. Bring what you already
          have.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {items.map(({ icon: Icon, title, body }, i) => (
          <div
            key={title}
            className="relative rounded-xl border bg-card p-6 space-y-4"
          >
            <div className="absolute top-6 right-6 text-xs font-mono text-muted-foreground">
              0{i + 1}
            </div>
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg tracking-tight">{title}</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
