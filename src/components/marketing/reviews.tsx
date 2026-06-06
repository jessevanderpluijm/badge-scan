import { Star, Quote } from "lucide-react";
import { cn } from "@/lib/utils";

type Review = {
  name: string;
  role: string;
  company: string;
  quote: string;
  initials: string;
  accent: "primary" | "success" | "warning" | "muted";
};

const ACCENT_COLORS: Record<Review["accent"], string> = {
  primary: "bg-primary/15 text-primary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/20 text-warning",
  muted: "bg-muted text-muted-foreground",
};

const REVIEWS: Review[] = [
  {
    name: "Sander van Houten",
    role: "Event Director",
    company: "TechSummit Amsterdam",
    quote:
      "We used to do this whole evening of stuffing envelopes the day before. Now we just print at the door. Nobody on the team has asked to go back.",
    initials: "SH",
    accent: "primary",
  },
  {
    name: "Emma Visser",
    role: "Operations Lead",
    company: "Amsterdam Trade Fair",
    quote:
      "Twee dagen, vier ingangen, ~5k bezoekers. Eén C4000 per ingang en het loopt. Ook met onze nogal eigenwijze export-headers.",
    initials: "EV",
    accent: "success",
  },
  {
    name: "Mark Janssen",
    role: "Founder",
    company: "Dev Meetups Rotterdam",
    quote:
      "I tried three other tools first. All of them wanted a custom integration or a desktop app. This one is just a browser and a printer.",
    initials: "MJ",
    accent: "warning",
  },
  {
    name: "Lara de Wit",
    role: "Conference Producer",
    company: "FinanceForward",
    quote:
      "Het kleine dingetje dat me overhaalde: 'functie' is gewoon een veld. Bij andere tools moet je dat als custom kolom configureren.",
    initials: "LW",
    accent: "primary",
  },
  {
    name: "Pieter Bosma",
    role: "Event Manager",
    company: "Healthcare Innovation Days",
    quote:
      "Bij ons komt zo'n 30% gewoon walk-in. Dat was altijd hét stressmoment van de dag. Nu eigenlijk niet meer.",
    initials: "PB",
    accent: "success",
  },
  {
    name: "Sophie Bakker",
    role: "Head of Events",
    company: "Retail Future Conference",
    quote:
      "We'd already locked in our ticketing platform — switching wasn't on the table. With Badge Scan it didn't have to be.",
    initials: "SB",
    accent: "muted",
  },
];

export function Reviews() {
  return (
    <section className="border-y bg-muted/30">
      <div className="container py-12 sm:py-14">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            What organisers actually say.
          </h2>
          <div className="inline-flex items-center gap-1 text-warning shrink-0">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-3.5 w-3.5 fill-current" />
            ))}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {REVIEWS.map((r) => (
            <figure
              key={r.name}
              className="relative rounded-lg border bg-card p-4 space-y-3"
            >
              <Quote
                className="absolute top-3 right-3 h-3.5 w-3.5 text-muted-foreground/30"
                aria-hidden
              />
              <blockquote className="text-xs leading-relaxed pr-5">
                &ldquo;{r.quote}&rdquo;
              </blockquote>
              <figcaption className="flex items-center gap-2.5 pt-2 border-t">
                <div
                  className={cn(
                    "h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0",
                    ACCENT_COLORS[r.accent],
                  )}
                >
                  {r.initials}
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-xs truncate leading-tight">
                    {r.name}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {r.role} · {r.company}
                  </div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
