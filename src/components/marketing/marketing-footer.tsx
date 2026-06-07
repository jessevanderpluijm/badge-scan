import Link from "next/link";
import { ScanLine } from "lucide-react";

const PARTNER_LINKS = [
  { slug: "weticket", name: "WeTicket" },
  { slug: "weeztix", name: "Weeztix" },
  { slug: "paylogic", name: "Paylogic" },
  { slug: "momice", name: "Momice" },
];

const EVENT_TYPE_LINKS = [
  { slug: "trade-shows", name: "trade shows" },
  { slug: "conferences", name: "conferences" },
  { slug: "events", name: "events" },
];

export function MarketingFooter() {
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
          <p className="text-xs text-muted-foreground max-w-xs">
            Print conference and event badges on demand. Bring any ticket
            platform.
          </p>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Integrations
          </h4>
          <ul className="space-y-2 text-sm">
            {PARTNER_LINKS.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/badge-printing/${p.slug}`}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Badge printing for {p.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Use cases
          </h4>
          <ul className="space-y-2 text-sm">
            {EVENT_TYPE_LINKS.map((t) => (
              <li key={t.slug}>
                <Link
                  href={`/badge-printing/for/${t.slug}`}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Badge printing for {t.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Product
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link
                href="/login"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign in
              </Link>
            </li>
            <li>
              <Link
                href="/demo"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Book a demo
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t">
        <div className="container py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Badge Scan</p>
          <p>Made for conference and event organizers.</p>
        </div>
      </div>
    </footer>
  );
}
