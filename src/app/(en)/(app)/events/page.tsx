import Link from "next/link";
import { Plus, Calendar, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const supabase = await createClient();

  // Order by event date when it's set, else fall back to creation date so
  // upcoming events surface first and old undated events stay near the bottom.
  const { data: events } = await supabase
    .from("events")
    .select("id, name, created_at, start_date, end_date, attendees(count)")
    .order("start_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  function formatRange(start: string | null, end: string | null): string | null {
    if (!start && !end) return null;
    const fmt = (d: string) =>
      new Date(d).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    if (start && end && start !== end) return `${fmt(start)} – ${fmt(end)}`;
    return fmt(start ?? end!);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Events</h1>
        </div>
        <Link href="/events/new" className={buttonVariants()}>
          <Plus className="h-4 w-4" /> New event
        </Link>
      </div>

      {!events || events.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Calendar className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="font-semibold">No events yet</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Create your first event to get started.
          </p>
          <Link href="/events/new" className={buttonVariants()}>
            <Plus className="h-4 w-4" /> New event
          </Link>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => {
            const count =
              (e.attendees as unknown as Array<{ count: number }>)[0]?.count ??
              0;
            return (
              <Link key={e.id} href={`/events/${e.id}`}>
                <Card className="p-5 hover:border-foreground/20 transition-colors group">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{e.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {count} {count === 1 ? "attendee" : "attendees"}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    {formatRange(e.start_date, e.end_date) ??
                      `Created ${new Date(e.created_at).toLocaleDateString()}`}
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
