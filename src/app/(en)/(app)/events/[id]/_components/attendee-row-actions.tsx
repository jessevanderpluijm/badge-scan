"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Loader2, Printer, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { normalizeBadgeDesign, type BadgeDesign } from "@/lib/badge";
import { printBadge } from "@/lib/print-agent";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export function AttendeeRowActions({
  id,
  eventId,
  name,
  barcode,
  attendee,
}: {
  id: string;
  eventId: string;
  name: string | null;
  barcode: string;
  attendee: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    company: string | null;
    job_title: string | null;
  };
}) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const displayName = name || barcode;

  async function onDelete() {
    setError(null);
    setBusy(true);
    const { error } = await supabase.from("attendees").delete().eq("id", id);
    setBusy(false);
    if (error) return setError(error.message);
    setOpen(false);
    router.refresh();
  }

  // Manual reprint for a crumpled or lost badge — independent of check-in
  // status and of the auto-print toggle.
  async function onPrint() {
    setPrinting(true);
    const { data: event } = await supabase
      .from("events")
      .select("badge_design")
      .eq("id", eventId)
      .single();
    const design = normalizeBadgeDesign(
      (event?.badge_design ?? null) as Partial<BadgeDesign> | null,
    );
    const result = await printBadge(design, { ...attendee, barcode });
    setPrinting(false);
    if (!result.ok) {
      window.alert(`Badge printen mislukte: ${result.error}`);
    }
  }

  return (
    <>
      <DropdownMenu
        trigger={
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label={`Actions for ${displayName}`}
          >
            {printing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <MoreVertical className="h-3.5 w-3.5" />
            )}
          </Button>
        }
      >
        <DropdownMenuItem onClick={() => void onPrint()}>
          <Printer className="h-3.5 w-3.5" /> Print badge
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            setError(null);
            setOpen(true);
          }}
          destructive
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete attendee
        </DropdownMenuItem>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>
          <DialogTitle>Delete attendee?</DialogTitle>
          <DialogDescription>
            Permanently remove <strong>{displayName}</strong> from this
            event. The barcode <code className="font-mono">{barcode}</code>{" "}
            will no longer scan in.
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
            variant="destructive"
            onClick={onDelete}
            disabled={busy}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {busy ? "Deleting…" : "Delete attendee"}
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
