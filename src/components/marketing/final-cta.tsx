import { AuthCtaButton } from "@/components/marketing/auth-cta";

export function FinalCta({
  heading = "Skip the badge-printing headache.",
  body = "Book a demo and we'll show you check-in and on-demand badge printing end to end.",
}: {
  heading?: string;
  body?: string;
}) {
  return (
    <section className="container pb-20">
      <div className="rounded-2xl border bg-primary text-primary-foreground p-10 sm:p-14 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
          {heading}
        </h2>
        <p className="text-primary-foreground/70 mt-3 max-w-xl mx-auto">
          {body}
        </p>
        <div className="mt-6 flex justify-center">
          <AuthCtaButton loggedOutLabel="Book a demo" variant="secondary" />
        </div>
      </div>
    </section>
  );
}
