"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { type Locale, dict } from "@/lib/i18n";
import { submitDemoRequest } from "@/lib/demo-actions";

type FormState = {
  name: string;
  email: string;
  company: string;
  attendees: string;
  message: string;
};

const EMPTY: FormState = {
  name: "",
  email: "",
  company: "",
  attendees: "",
  message: "",
};

export function DemoForm({ locale = "en" }: { locale?: Locale }) {
  const t = dict[locale].demo.form;
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function update<K extends keyof FormState>(key: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await submitDemoRequest({
      name: form.name,
      email: form.email,
      company: form.company,
      expectedAttendees: form.attendees,
      message: form.message,
    });

    setLoading(false);
    if (!result.ok) {
      setError(result.error);
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
          {t.successHeading}
        </h2>
        <p className="text-sm text-muted-foreground">{t.successBody}</p>
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
          <Label htmlFor="name">{t.name}</Label>
          <Input
            id="name"
            value={form.name}
            onChange={update("name")}
            autoComplete="name"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">{t.email}</Label>
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
          <Label htmlFor="company">{t.company}</Label>
          <Input
            id="company"
            value={form.company}
            onChange={update("company")}
            autoComplete="organization"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="attendees">{t.attendees}</Label>
          <Input
            id="attendees"
            type="number"
            min={1}
            inputMode="numeric"
            value={form.attendees}
            onChange={update("attendees")}
            placeholder={t.attendeesPlaceholder}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">{t.message}</Label>
        <textarea
          id="message"
          className={textareaClass}
          value={form.message}
          onChange={update("message")}
          placeholder={t.messagePlaceholder}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? t.sending : t.submit}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        {t.alreadyCustomer}{" "}
        <a href="/login" className="underline hover:text-foreground">
          {t.signIn}
        </a>
      </p>
    </form>
  );
}
