import { AuthCtaButton } from "@/components/marketing/auth-cta";
import { type Locale, dict } from "@/lib/i18n";

export function FinalCta({
  locale = "en",
  heading,
  body,
}: {
  locale?: Locale;
  heading?: string;
  body?: string;
}) {
  const t = dict[locale].finalCta;
  return (
    <section className="container pb-20">
      <div className="rounded-2xl border bg-primary text-primary-foreground p-10 sm:p-14 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
          {heading ?? t.heading}
        </h2>
        <p className="text-primary-foreground/70 mt-3 max-w-xl mx-auto">
          {body ?? t.body}
        </p>
        <div className="mt-6 flex justify-center">
          <AuthCtaButton
            locale={locale}
            loggedOutLabel={t.button}
            variant="secondary"
          />
        </div>
      </div>
    </section>
  );
}
