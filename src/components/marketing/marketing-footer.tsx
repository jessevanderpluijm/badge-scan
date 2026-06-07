import Link from "next/link";
import { ScanLine } from "lucide-react";
import { type Locale, dict, localePath } from "@/lib/i18n";

const PARTNER_LINKS = [
  { slug: "weticket", name: "WeTicket" },
  { slug: "weeztix", name: "Weeztix" },
  { slug: "paylogic", name: "Paylogic" },
  { slug: "momice", name: "Momice" },
];

const EVENT_TYPE_LINKS: { slug: string; name: Record<Locale, string> }[] = [
  { slug: "trade-shows", name: { en: "trade shows", nl: "beurzen" } },
  { slug: "conferences", name: { en: "conferences", nl: "conferenties" } },
  { slug: "events", name: { en: "events", nl: "evenementen" } },
];

export function MarketingFooter({ locale = "en" }: { locale?: Locale }) {
  const t = dict[locale].footer;
  return (
    <footer className="border-t">
      <div className="container py-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
              <ScanLine className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold">Badge Scan</span>
          </div>
          <p className="text-xs text-muted-foreground max-w-xs">{t.tagline}</p>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t.integrations}
          </h4>
          <ul className="space-y-2 text-sm">
            {PARTNER_LINKS.map((p) => (
              <li key={p.slug}>
                <Link
                  href={localePath(locale, `/badge-printing/${p.slug}`)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t.badgePrintingFor(p.name)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t.useCases}
          </h4>
          <ul className="space-y-2 text-sm">
            {EVENT_TYPE_LINKS.map((e) => (
              <li key={e.slug}>
                <Link
                  href={localePath(locale, `/badge-printing/for/${e.slug}`)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t.badgePrintingFor(e.name[locale])}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t.product}
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link
                href="/login"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {t.signIn}
              </Link>
            </li>
            <li>
              <Link
                href={localePath(locale, "/demo")}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {t.bookDemo}
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t">
        <div className="container py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} {t.copyright}</p>
          <p>{t.madeFor}</p>
        </div>
      </div>
    </footer>
  );
}
