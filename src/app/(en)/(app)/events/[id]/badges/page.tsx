import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { normalizeBadgeDesign, type BadgeDesign } from "@/lib/badge";
import { BadgeDesigner } from "./_components/badge-designer";

export const dynamic = "force-dynamic";

export default async function BadgesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: event, error } = await supabase
    .from("events")
    .select("id, name, badge_design")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") notFound();
    throw new Error(
      `Failed to load event for badge designer: ${error.message}. ` +
        `If this mentions a missing "badge_design" column, run: ` +
        `alter table public.events add column if not exists badge_design jsonb;`,
    );
  }
  if (!event) notFound();

  const { count } = await supabase
    .from("attendees")
    .select("id", { count: "exact", head: true })
    .eq("event_id", id);

  const { data: sample } = await supabase
    .from("attendees")
    .select("first_name, last_name, email, company, job_title, barcode")
    .eq("event_id", id)
    .limit(1)
    .maybeSingle();

  const design = normalizeBadgeDesign(
    event.badge_design as Partial<BadgeDesign> | null,
  );

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/events/${event.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3"
        >
          <ArrowLeft className="h-4 w-4" /> {event.name}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          Badge designer
        </h1>
        <p className="text-sm text-muted-foreground">
          Design once, print one PDF for every attendee.
        </p>
      </div>

      <BadgeDesigner
        eventId={event.id}
        eventName={event.name}
        initialDesign={design}
        attendeeCount={count ?? 0}
        sampleAttendee={sample ?? null}
      />
    </div>
  );
}
