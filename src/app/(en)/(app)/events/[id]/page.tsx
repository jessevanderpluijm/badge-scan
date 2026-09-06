import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, ScanLine } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { UploadCsvDialog } from "./_components/upload-csv-dialog";
import { EventActions } from "./_components/event-actions";
import { AttendeeCheckinToggle } from "./_components/attendee-checkin-toggle";
import { AttendeeRowActions } from "./_components/attendee-row-actions";
import { PrinterControls } from "@/components/printer-controls";
import { AddAttendeeDialog } from "./_components/add-attendee-dialog";
import { AttendeeSearch } from "./_components/attendee-search";

const PAGE_SIZE = 50;

export const dynamic = "force-dynamic";

function pageHref(eventId: string, page: number, q: string): string {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (q) params.set("q", q);
  const qs = params.toString();
  return `/events/${eventId}${qs ? `?${qs}` : ""}`;
}

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
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { id } = await params;
  const { page: pageParam, q: qParam } = await searchParams;
  const supabase = await createClient();

  // Parse + clamp page from the URL. We don't know the total count yet, so
  // we clamp again after the count query.
  const requestedPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const from = (requestedPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const searchQuery = (qParam ?? "").trim();

  let attendeesQuery = supabase
    .from("attendees")
    .select(
      "id, first_name, last_name, email, company, job_title, barcode, used_at",
      { count: "exact" },
    )
    .eq("event_id", id);

  if (searchQuery) {
    // Escape PostgREST reserved characters in the search term so a comma or
    // parenthesis can't break out of the .or() filter list.
    const safe = searchQuery.replace(/[,()]/g, " ");
    const like = `%${safe}%`;
    attendeesQuery = attendeesQuery.or(
      [
        `first_name.ilike.${like}`,
        `last_name.ilike.${like}`,
        `email.ilike.${like}`,
        `company.ilike.${like}`,
        `job_title.ilike.${like}`,
        `barcode.ilike.${like}`,
      ].join(","),
    );
  }

  // The three queries are independent (all keyed on the event id, and RLS
  // yields zero attendee rows for foreign events anyway) — run them in
  // parallel instead of paying three sequential DB round trips.
  const [
    { data: event },
    { data: attendees, count },
    { count: usedCount },
  ] = await Promise.all([
    supabase
      .from("events")
      .select("id, name, created_at, start_date, end_date")
      .eq("id", id)
      .single(),
    attendeesQuery.order("created_at", { ascending: false }).range(from, to),
    supabase
      .from("attendees")
      .select("id", { count: "exact", head: true })
      .eq("event_id", id)
      .not("used_at", "is", null),
  ]);

  if (!event) notFound();

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const checkedIn = usedCount ?? 0;
  const firstShown = total === 0 ? 0 : from + 1;
  const lastShown = Math.min(to + 1, total);

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
              {total} {total === 1 ? "attendee" : "attendees"}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <UploadCsvDialog eventId={event.id} />
            <AddAttendeeDialog eventId={event.id} />
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

      <PrinterControls />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-semibold mt-1">{total}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Checked in</p>
          <p className="text-2xl font-semibold mt-1 text-success">
            {checkedIn}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Remaining</p>
          <p className="text-2xl font-semibold mt-1">{total - checkedIn}</p>
        </Card>
      </div>

      <Card>
        <div className="p-4 sm:p-6 border-b flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="font-semibold">Attendees</h2>
            {total > 0 && (
              <p className="text-xs text-muted-foreground">
                Showing {firstShown}–{lastShown} of {total}
                {searchQuery && (
                  <>
                    {" · matching "}
                    <span className="font-medium text-foreground">
                      &ldquo;{searchQuery}&rdquo;
                    </span>
                  </>
                )}
              </p>
            )}
          </div>
          <AttendeeSearch initialQuery={searchQuery} />
        </div>
        {!attendees || attendees.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            {searchQuery ? (
              <>
                No attendees match{" "}
                <span className="font-medium text-foreground">
                  &ldquo;{searchQuery}&rdquo;
                </span>
                .
              </>
            ) : (
              <>
                No attendees yet. Click <strong>Upload CSV</strong> or{" "}
                <strong>Add manually</strong> above to add some.
              </>
            )}
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
                          eventId={event.id}
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
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t text-sm">
                <span className="text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <Link
                    href={pageHref(event.id, page - 1, searchQuery)}
                    aria-disabled={page <= 1}
                    tabIndex={page <= 1 ? -1 : undefined}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      page <= 1 && "pointer-events-none opacity-40",
                    )}
                  >
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </Link>
                  <Link
                    href={pageHref(event.id, page + 1, searchQuery)}
                    aria-disabled={page >= totalPages}
                    tabIndex={page >= totalPages ? -1 : undefined}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      page >= totalPages && "pointer-events-none opacity-40",
                    )}
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
