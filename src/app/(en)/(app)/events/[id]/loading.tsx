import { Card } from "@/components/ui/card";

export default function EventDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-4 w-16 rounded-md bg-muted mb-3" />
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <div className="h-7 w-64 rounded-md bg-muted" />
            <div className="h-4 w-40 rounded-md bg-muted" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-28 rounded-md bg-muted" />
            <div className="h-10 w-32 rounded-md bg-muted" />
            <div className="h-10 w-10 rounded-md bg-muted" />
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-5 space-y-2">
            <div className="h-4 w-20 rounded-md bg-muted" />
            <div className="h-8 w-14 rounded-md bg-muted" />
          </Card>
        ))}
      </div>
      <Card>
        <div className="p-6 border-b flex items-center justify-between">
          <div className="h-5 w-24 rounded-md bg-muted" />
          <div className="h-9 w-64 rounded-md bg-muted" />
        </div>
        <div className="p-4 space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-9 rounded-md bg-muted" />
          ))}
        </div>
      </Card>
    </div>
  );
}
