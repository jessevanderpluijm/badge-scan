"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FormState = {
  name: string;
  email: string;
  company: string;
  eventDate: string;
  attendees: string;
  message: string;
};

const EMPTY: FormState = {
  name: "",
  email: "",
  company: "",
  eventDate: "",
  attendees: "",
  message: "",
};

export function DemoForm() {
  const supabase = createClient();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function update<K extends keyof FormState>(key: K) {
    return (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.from("demo_requests").insert({
      name: form.name,
      email: form.email,
      company: form.company || null,
      event_date: form.eventDate || null,
      expected_attendees: form.attendees ? Number(form.attendees) : null,
      message: form.message || null,
    });

    setLoading(false);
    if (error) {
      // Surface the real Supabase error to the user (and the console) so
      // misconfigurations like a missing table or RLS policy are obvious.
      console.error("demo_requests insert failed:", error);
      const detail =
        error.message || error.hint || error.code || "Unknown error";
      setError(`Couldn't submit your request: ${detail}`);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center space-y-3">
        <div className="mx-auto h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
          <Check className="h-6 w-6 text-success" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight">
          Thanks — we&apos;ll be in touch.
        </h2>
        <p className="text-sm text-muted-foreground">
          We&apos;ve received your request and will reach out shortly to set up
          your demo.
        </p>
      </div>
    );
  }

  const textareaClass = cn(
    "flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  );

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={form.name}
            onChange={update("name")}
            autoComplete="name"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={update("email")}
            autoComplete="email"
            required
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="company">Company / organization</Label>
          <Input
            id="company"
            value={form.company}
            onChange={update("company")}
            autoComplete="organization"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="attendees">Expected attendees</Label>
          <Input
            id="attendees"
            type="number"
            min={1}
            inputMode="numeric"
            value={form.attendees}
            onChange={update("attendees")}
            placeholder="e.g. 250"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="eventDate">Next event date (optional)</Label>
        <Input
          id="eventDate"
          type="date"
          value={form.eventDate}
          onChange={update("eventDate")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Anything we should know? (optional)</Label>
        <textarea
          id="message"
          className={textareaClass}
          value={form.message}
          onChange={update("message")}
          placeholder="Type of event, ticketing system you use, questions…"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Sending…" : "Book a demo"}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Already a customer?{" "}
        <a href="/login" className="underline hover:text-foreground">
          Sign in
        </a>
      </p>
    </form>
  );
}
