"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";

type FormState = {
  first_name: string;
  last_name: string;
  email: string;
  company: string;
  job_title: string;
  barcode: string;
};

const EMPTY: FormState = {
  first_name: "",
  last_name: "",
  email: "",
  company: "",
  job_title: "",
  barcode: "",
};

// Walk-in badges need a barcode we control — one that won't clash with
// whatever the ticketing platform uses. Prefix + short random suffix
// keeps it human-readable on the printed badge.
function generateBarcode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/I/1 confusion
  let suffix = "";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  for (const b of bytes) suffix += chars[b % chars.length];
  return `WALKIN-${suffix}`;
}

export function AddAttendeeDialog({ eventId }: { eventId: string }) {
  const router = useRouter();
  const supabase = createClient();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  function openDialog() {
    setForm({ ...EMPTY, barcode: generateBarcode() });
    setError(null);
    setOpen(true);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const barcode = form.barcode.trim();
    if (!barcode) {
      setError("A barcode is required. Click the refresh icon to generate one.");
      return;
    }
    setSaving(true);
    setError(null);

    const { error } = await supabase.from("attendees").insert({
      event_id: eventId,
      barcode,
      first_name: form.first_name.trim() || null,
      last_name: form.last_name.trim() || null,
      email: form.email.trim() || null,
      company: form.company.trim() || null,
      job_title: form.job_title.trim() || null,
    });
    setSaving(false);
    if (error) {
      if (error.code === "23505") {
        setError(
          "That barcode is already used for this event. Generate a new one.",
        );
      } else {
        setError(error.message);
      }
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button variant="outline" onClick={openDialog}>
        <UserPlus className="h-4 w-4" />
        <span className="hidden sm:inline">Add manually</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Add attendee</DialogTitle>
            <DialogDescription>
              All fields except the barcode are optional.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="add-first">First name</Label>
                <Input
                  id="add-first"
                  value={form.first_name}
                  onChange={update("first_name")}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-last">Last name</Label>
                <Input
                  id="add-last"
                  value={form.last_name}
                  onChange={update("last_name")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-email">Email</Label>
              <Input
                id="add-email"
                type="email"
                value={form.email}
                onChange={update("email")}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="add-company">Company</Label>
                <Input
                  id="add-company"
                  value={form.company}
                  onChange={update("company")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-function">Function</Label>
                <Input
                  id="add-function"
                  value={form.job_title}
                  onChange={update("job_title")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-barcode">
                Barcode <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="add-barcode"
                  value={form.barcode}
                  onChange={update("barcode")}
                  className="font-mono"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setForm((f) => ({ ...f, barcode: generateBarcode() }))
                  }
                  aria-label="Generate a new barcode"
                  title="Generate new"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Auto-generated for walk-ins. Overwrite with a ticket barcode if
                the visitor has one.
              </p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "Adding…" : "Add attendee"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </>
  );
}
