"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  IdCard,
  Loader2,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function EventActions({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState(name);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    setEditError(null);
    setSaving(true);
    const { error } = await supabase
      .from("events")
      .update({ name: editName.trim() })
      .eq("id", id);
    setSaving(false);
    if (error) return setEditError(error.message);
    setEditOpen(false);
    router.refresh();
  }

  async function confirmDelete() {
    setDeleteError(null);
    setDeleting(true);
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) {
      setDeleting(false);
      return setDeleteError(error.message);
    }
    router.replace("/events");
    router.refresh();
  }

  function openEdit() {
    setEditName(name);
    setEditError(null);
    setEditOpen(true);
  }

  function openDelete() {
    setDeleteError(null);
    setDeleteOpen(true);
  }

  return (
    <>
      <DropdownMenu
        trigger={
          <Button variant="outline" size="icon" aria-label="Event actions">
            <MoreVertical className="h-4 w-4" />
          </Button>
        }
      >
        <DropdownMenuItem onClick={() => router.push(`/events/${id}/badges`)}>
          <IdCard className="h-4 w-4" /> Design badges
        </DropdownMenuItem>
        <DropdownMenuItem onClick={openEdit}>
          <Pencil className="h-4 w-4" /> Edit event
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={openDelete} destructive>
          <Trash2 className="h-4 w-4" /> Delete event
        </DropdownMenuItem>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <form onSubmit={saveEdit}>
          <DialogHeader>
            <DialogTitle>Edit event</DialogTitle>
            <DialogDescription>Rename your event.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-2">
              <Label htmlFor="edit-name">Event name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                autoFocus
              />
            </div>
            {editError && (
              <p className="text-sm text-destructive mt-3">{editError}</p>
            )}
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                saving || !editName.trim() || editName.trim() === name
              }
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogHeader>
          <DialogTitle>Delete event?</DialogTitle>
          <DialogDescription>
            This will permanently delete <strong>{name}</strong> and all
            attendees. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {deleteError && (
          <DialogBody>
            <p className="text-sm text-destructive">{deleteError}</p>
          </DialogBody>
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setDeleteOpen(false)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={confirmDelete}
            disabled={deleting}
          >
            {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
            {deleting ? "Deleting…" : "Delete event"}
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
