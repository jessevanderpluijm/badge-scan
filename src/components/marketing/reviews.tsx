import { Wrench, MessageSquare, Plug } from "lucide-react";

type Point = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
};

const POINTS: Point[] = [
  {
    icon: MessageSquare,
    title: "You get the person who built it",
    body: "Badge Scan is run by one person, not a support queue. Email lands with the maker — questions get answered the same way they get fixed.",
  },
  {
    icon: Plug,
    title: "Built around real export files",
    body: "It's shaped by the messy CSV exports ticketing platforms actually produce — odd headers, extra columns, mixed name fields and all.",
  },
  {
    icon: Wrench,
    title: "Set up at real events",
    body: "Designed hands-on for door check-in and on-demand printing — the parts that go wrong on the day are the parts it's built to survive.",
  },
];

export function Reviews() {
  return (
    <section className="border-y bg-muted/30">
      <div className="container py-12 sm:py-14">
        <div className="max-w-2xl mb-8">
          <span className="inline-flex items-center rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            Newly launched
          </span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight mt-3">
            No reviews to show off yet — here&apos;s the honest version.
          </h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Badge Scan is new, so we&apos;d rather not fill this space with
            testimonials we don&apos;t have. Instead, here&apos;s what you can
            actually count on right now.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {POINTS.map((p) => (
            <div
              key={p.title}
              className="rounded-lg border bg-card p-4 space-y-2"
            >
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <p.icon className="h-4 w-4" />
              </div>
              <h3 className="font-semibold text-sm tracking-tight">
                {p.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
