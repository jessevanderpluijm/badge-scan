import { Card } from "@/components/ui/card";

export default function EventsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-32 rounded-md bg-muted" />
          <div className="h-4 w-72 rounded-md bg-muted" />
        </div>
        <div className="h-10 w-32 rounded-md bg-muted" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-5 space-y-3">
            <div className="h-5 w-3/4 rounded-md bg-muted" />
            <div className="h-4 w-1/3 rounded-md bg-muted" />
            <div className="h-3 w-1/2 rounded-md bg-muted" />
          </Card>
        ))}
      </div>
    </div>
  );
}
