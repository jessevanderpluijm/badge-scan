import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ScanLine } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UploadCsvDialog } from "./_components/upload-csv-dialog";
import { EventActions } from "./_components/event-actions";
import { AttendeeCheckinToggle } from "./_components/attendee-checkin-toggle";
import { AttendeeRowActions } from "./_components/attendee-row-actions";

export const dynamic = "force-dynamic";

// Format an optional start/end date pair from the events table into a short
// human label, e.g. "12 Aug 2026", "12 – 14 Aug 2026" or null when neither is set.
function formatDateRange(start: string | null, end: string | null): string | null {
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

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, name, created_at, start_date, end_date")
    .eq("id", id)
    .single();

  if (!event) notFound();

  const { data: attendees, count } = await supabase
    .from("attendees")
    .select(
      "id, first_name, last_name, email, company, job_title, barcode, used_at",
      { count: "exact" },
    )
    .eq("event_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  const usedCount =
    attendees?.filter((a) => a.used_at !== null).length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3"
        >
          <ArrowLeft className="h-4 w-4" /> Events
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {event.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {formatDateRange(event.start_date, event.end_date) && (
                <>
                  {formatDateRange(event.start_date, event.end_date)}
                  {" · "}
                </>
              )}
              {count ?? 0} {count === 1 ? "attendee" : "attendees"}
              {(count ?? 0) > 0 && (
                <span className="text-muted-foreground">
                  {" · "}showing latest 50
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <UploadCsvDialog eventId={event.id} />
            <Link
              href={`/events/${event.id}/scan`}
              className={buttonVariants()}
            >
              <ScanLine className="h-4 w-4" /> Open scanner
            </Link>
            <EventActions
              id={event.id}
              name={event.name}
              startDate={event.start_date ?? null}
              endDate={event.end_date ?? null}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-semibold mt-1">{count ?? 0}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Checked in</p>
          <p className="text-2xl font-semibold mt-1 text-success">
            {usedCount}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Remaining</p>
          <p className="text-2xl font-semibold mt-1">
            {(count ?? 0) - usedCount}
          </p>
        </Card>
      </div>

      <Card>
        <div className="p-6 border-b">
          <h2 className="font-semibold">Attendees</h2>
        </div>
        {!attendees || attendees.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            No attendees yet. Click <strong>Upload CSV</strong> above to add
            some.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40">
                <tr className="text-left">
                  <th className="py-2.5 px-4 font-medium text-muted-foreground w-8"></th>
                  <th className="py-2.5 px-4 font-medium text-muted-foreground">
                    Name
                  </th>
                  <th className="py-2.5 px-4 font-medium text-muted-foreground">
                    Company
                  </th>
                  <th className="py-2.5 px-4 font-medium text-muted-foreground">
                    Function
                  </th>
                  <th className="py-2.5 px-4 font-medium text-muted-foreground">
                    Email
                  </th>
                  <th className="py-2.5 px-4 font-medium text-muted-foreground font-mono">
                    Barcode
                  </th>
                  <th className="py-2.5 px-4 font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="py-2.5 px-4 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {attendees.map((a) => {
                  const fullName =
                    [a.first_name, a.last_name].filter(Boolean).join(" ") ||
                    null;
                  return (
                    <tr key={a.id} className="border-b last:border-b-0">
                      <td className="py-2 px-4">
                        <AttendeeCheckinToggle
                          id={a.id}
                          name={fullName}
                          barcode={a.barcode}
                          usedAt={a.used_at}
                        />
                      </td>
                      <td className="py-2.5 px-4">
                        {fullName || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-muted-foreground">
                        {a.company || "—"}
                      </td>
                      <td className="py-2.5 px-4 text-muted-foreground">
                        {a.job_title || "—"}
                      </td>
                      <td className="py-2.5 px-4 text-muted-foreground">
                        {a.email || "—"}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-xs">
                        {a.barcode}
                      </td>
                      <td className="py-2.5 px-4">
                        {a.used_at ? (
                          <span className="text-success">Checked in</span>
                        ) : (
                          <span className="text-muted-foreground">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2">
                        <AttendeeRowActions
                          id={a.id}
                          name={fullName}
                          barcode={a.barcode}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
