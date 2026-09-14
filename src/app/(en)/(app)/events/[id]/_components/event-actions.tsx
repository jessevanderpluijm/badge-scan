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
  startDate,
  endDate,
}: {
  id: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState(name);
  const [editStart, setEditStart] = useState(startDate ?? "");
  const [editEnd, setEditEnd] = useState(endDate ?? "");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isDirty =
    editName.trim() !== name ||
    editStart !== (startDate ?? "") ||
    editEnd !== (endDate ?? "");

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (editStart && editEnd && editEnd < editStart) {
      setEditError("De einddatum moet op of na de startdatum liggen.");
      return;
    }
    setEditError(null);
    setSaving(true);
    const { error } = await supabase
      .from("events")
      .update({
        name: editName.trim(),
        start_date: editStart || null,
        end_date: editEnd || null,
      })
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
    setEditStart(startDate ?? "");
    setEditEnd(endDate ?? "");
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
          <Button variant="outline" size="icon" aria-label="Event-acties">
            <MoreVertical className="h-4 w-4" />
          </Button>
        }
      >
        <DropdownMenuItem onClick={() => router.push(`/events/${id}/badges`)}>
          <IdCard className="h-4 w-4" /> Badge ontwerpen
        </DropdownMenuItem>
        <DropdownMenuItem onClick={openEdit}>
          <Pencil className="h-4 w-4" /> Event bewerken
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={openDelete} destructive>
          <Trash2 className="h-4 w-4" /> Event verwijderen
        </DropdownMenuItem>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <form onSubmit={saveEdit}>
          <DialogHeader>
            <DialogTitle>Event bewerken</DialogTitle>
            <DialogDescription>
              Pas de naam of de datums van het event aan.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Eventnaam</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-start">
                  Startdatum{" "}
                  <span className="text-muted-foreground font-normal">
                    (optioneel)
                  </span>
                </Label>
                <Input
                  id="edit-start"
                  type="date"
                  value={editStart}
                  onChange={(e) => setEditStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-end">
                  Einddatum{" "}
                  <span className="text-muted-foreground font-normal">
                    (optioneel)
                  </span>
                </Label>
                <Input
                  id="edit-end"
                  type="date"
                  value={editEnd}
                  onChange={(e) => setEditEnd(e.target.value)}
                  min={editStart || undefined}
                />
              </div>
            </div>
            {editError && (
              <p className="text-sm text-destructive">{editError}</p>
            )}
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={saving}
            >
              Annuleren
            </Button>
            <Button
              type="submit"
              disabled={saving || !editName.trim() || !isDirty}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "Opslaan…" : "Wijzigingen opslaan"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogHeader>
          <DialogTitle>Event verwijderen?</DialogTitle>
          <DialogDescription>
            Dit verwijdert <strong>{name}</strong> en alle deelnemers
            definitief. Dit kan niet ongedaan worden gemaakt.
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
            Annuleren
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={confirmDelete}
            disabled={deleting}
          >
            {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
            {deleting ? "Verwijderen…" : "Event verwijderen"}
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
