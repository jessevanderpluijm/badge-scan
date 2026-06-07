import { Wrench, MessageSquare, Plug } from "lucide-react";
import { type Locale, dict } from "@/lib/i18n";

const ICONS = [MessageSquare, Plug, Wrench];

export function Reviews({ locale = "en" }: { locale?: Locale }) {
  const t = dict[locale].reviews;
  return (
    <section className="border-y bg-muted/30">
      <div className="container py-12 sm:py-14">
        <div className="max-w-2xl mb-8">
          <span className="inline-flex items-center rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            {t.badge}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight mt-3">
            {t.heading}
          </h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {t.intro}
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {t.points.map((p, i) => {
            const Icon = ICONS[i] ?? MessageSquare;
            return (
              <div
                key={p.title}
                className="rounded-lg border bg-card p-4 space-y-2"
              >
                <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="font-semibold text-sm tracking-tight">
                  {p.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {p.body}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
