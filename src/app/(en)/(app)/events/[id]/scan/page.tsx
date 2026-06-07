import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Scanner } from "./_components/scanner";

export const dynamic = "force-dynamic";

export default async function ScanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: event } = await supabase
    .from("events")
    .select("id, name")
    .eq("id", id)
    .single();
  if (!event) notFound();

  return (
    <div className="-my-8 -mx-4 sm:-mx-8 min-h-[calc(100vh-3.5rem)] flex flex-col">
      <div className="px-4 sm:px-8 py-3 border-b bg-background">
        <Link
          href={`/events/${event.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> {event.name}
        </Link>
      </div>
      <Scanner eventId={event.id} eventName={event.name} />
    </div>
  );
}
