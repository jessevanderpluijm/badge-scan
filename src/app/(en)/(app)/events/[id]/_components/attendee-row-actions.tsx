"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Loader2, Trash2 } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export function AttendeeRowActions({
  id,
  name,
  barcode,
}: {
  id: string;
  name: string | null;
  barcode: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
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
            <MoreVertical className="h-3.5 w-3.5" />
          </Button>
        }
      >
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
