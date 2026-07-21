"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DEFAULT_DESIGN } from "@/lib/badge";
import { BadgeDesigner } from "../[id]/badges/_components/badge-designer";
import { cn } from "@/lib/utils";

const STEPS = [
  { n: 1, label: "Event details" },
  { n: 2, label: "Badge design" },
] as const;

function Stepper({ current }: { current: 1 | 2 }) {
  return (
    <ol className="flex items-center gap-3 mb-6">
      {STEPS.map((s, i) => {
        const done = current > s.n;
        const active = current === s.n;
        return (
          <li key={s.n} className="flex items-center gap-3">
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm transition-colors",
                done && "bg-success/10 border-success/30 text-success",
                active && "bg-foreground text-background border-foreground",
                !done &&
                  !active &&
                  "border-input text-muted-foreground bg-background",
              )}
            >
              <span
                className={cn(
                  "h-5 w-5 rounded-full flex items-center justify-center text-xs font-medium",
                  done && "bg-success text-success-foreground",
                  active && "bg-background text-foreground",
                  !done && !active && "bg-muted text-muted-foreground",
                )}
              >
                {done ? <Check className="h-3 w-3" /> : s.n}
              </span>
              <span className="font-medium">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="h-px w-6 bg-border" aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export default function NewEventPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [eventId, setEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (startDate && endDate && endDate < startDate) {
      setError("End date must be on or after the start date.");
      return;
    }
    setLoading(true);
    setError(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      setError("Not signed in.");
      return;
    }
    const { data, error } = await supabase
      .from("events")
      .insert({
        name: name.trim(),
        owner_id: user.id,
        start_date: startDate || null,
        end_date: endDate || null,
      })
      .select("id")
      .single();
    setLoading(false);
    if (error) return setError(error.message);
    setEventId(data.id);
    setStep(2);
  }

  function finish() {
    if (!eventId) return;
    router.push(`/events/${eventId}`);
    router.refresh();
  }

  if (step === 1) {
    return (
      <div className="max-w-md mx-auto space-y-4">
        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to events
        </Link>

        <Stepper current={1} />

        <Card>
          <CardHeader>
            <CardTitle>Event details</CardTitle>
            <CardDescription>
              Start with a name. You can rename it later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Event name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Summer Conference 2026"
                  required
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="start-date">
                    Start date{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">
                    End date{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || undefined}
                  />
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end">
                <Button type="submit" disabled={loading || !name.trim()}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? "Creating…" : "Continue"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link
        href="/events"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to events
      </Link>

      <Stepper current={2} />

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Badge design
        </h1>
        <p className="text-sm text-muted-foreground">
          Set up how badges will look for <strong>{name}</strong>. You can
          tweak this later from the event page.
        </p>
      </div>

      {eventId && (
        <BadgeDesigner
          eventId={eventId}
          eventName={name}
          initialDesign={DEFAULT_DESIGN}
          attendeeCount={0}
          sampleAttendee={null}
          mode="wizard"
          onFinish={finish}
        />
      )}
    </div>
  );
}
