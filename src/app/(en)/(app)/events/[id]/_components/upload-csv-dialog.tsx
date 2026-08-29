"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
} from "@/components/ui/dialog";
import { CsvUpload } from "./csv-upload";

export function UploadCsvDialog({ eventId }: { eventId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Upload className="h-4 w-4" />
        <span className="hidden sm:inline">Upload CSV</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen} className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload attendees</DialogTitle>
          <DialogDescription>
            Add attendees to this event from a CSV file.
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="pb-6">
          <CsvUpload eventId={eventId} onComplete={() => setOpen(false)} />
        </DialogBody>
      </Dialog>
    </>
  );
}
