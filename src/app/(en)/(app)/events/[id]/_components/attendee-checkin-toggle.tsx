"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { normalizeBadgeDesign, type BadgeDesign } from "@/lib/badge";
import { checkPrintAgent, printBadge } from "@/lib/print-agent";

export function AttendeeCheckinToggle({
  id,
  eventId,
  name,
  barcode,
  usedAt,
}: {
  id: string;
  eventId: string;
  name: string | null;
  barcode: string;
  usedAt: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCheckedIn = !!usedAt;
  const displayName = name || barcode;

  // Best effort: when the local print agent runs on this machine, a manual
  // check-in also prints the badge. Without an agent nothing happens — the
  // check-in itself never depends on the printer.
  async function printAfterCheckin() {
    if (!(await checkPrintAgent())) return;
    const [{ data: attendee }, { data: event }] = await Promise.all([
      supabase
        .from("attendees")
        .select("first_name, last_name, email, company, job_title, barcode")
        .eq("id", id)
        .single(),
      supabase
        .from("events")
        .select("badge_design")
        .eq("id", eventId)
        .single(),
    ]);
    if (!attendee) return;
    const design = normalizeBadgeDesign(
      (event?.badge_design ?? null) as Partial<BadgeDesign> | null,
    );
    const result = await printBadge(design, attendee);
    if (!result.ok) {
      console.warn("Badge print na check-in mislukt:", result.error);
    }
  }

  async function confirm() {
    setError(null);
    setBusy(true);
    const { error } = await supabase
      .from("attendees")
      .update({ used_at: isCheckedIn ? null : new Date().toISOString() })
      .eq("id", id);
    setBusy(false);
    if (error) return setError(error.message);
    setOpen(false);
    router.refresh();
    if (!isCheckedIn) {
      void printAfterCheckin();
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className={cn(
          "rounded-full p-0.5 transition-colors",
          isCheckedIn
            ? "text-success hover:text-success/80"
            : "text-muted-foreground hover:text-foreground",
        )}
        aria-label={
          isCheckedIn ? `Un-check ${displayName}` : `Check in ${displayName}`
        }
      >
        {isCheckedIn ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>
          <DialogTitle>
            {isCheckedIn ? "Un-check attendee?" : "Check in attendee?"}
          </DialogTitle>
          <DialogDescription>
            {isCheckedIn ? (
              <>
                Mark <strong>{displayName}</strong> as no longer checked in?
                They will be able to scan in again.
              </>
            ) : (
              <>
                Mark <strong>{displayName}</strong> as checked in? Normally
                check-ins happen automatically when a barcode is scanned.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        {error && (
          <DialogBody>
            <p className="text-sm text-destructive">{error}</p>
          </DialogBody>
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={isCheckedIn ? "destructive" : "default"}
            onClick={confirm}
            disabled={busy}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {busy
              ? "Saving…"
              : isCheckedIn
                ? "Un-check"
                : "Check in"}
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
